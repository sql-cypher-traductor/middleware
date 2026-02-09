"""
Servicio de ejecución de consultas Cypher en Neo4j.
Utiliza el driver oficial de Neo4j para Python.
"""

import time
from uuid import UUID
from typing import Optional, Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable, AuthError, CypherSyntaxError

from ..core.encryption import decrypt_credential
from ..dto.execution_dto import (
    ExecutionRequestDTO,
    ExecutionResponseDTO,
    TranslateAndExecuteRequestDTO,
    NodeDTO,
    RelationshipDTO,
    GraphDataDTO,
    TabularDataDTO,
    ExecutionStatisticsDTO,
    QueryHistoryResponseDTO,
    QueryHistoryListResponseDTO,
)
from ..dto.translator_dto import TranslationRequestDTO
from ..models.query_history import QueryHistory
from ..models.enums.query_status import QueryStatus
from ..models.enums.status_failure import FailureStage
from ..models.enums.engine_type import EngineType
from ..repositories.query_history_repository import QueryHistoryRepository
from ..repositories.connection_repository import ConnectionRepository
from ..services.translation_service import TranslationService

import math


class ExecutionService:
    """
    Servicio para ejecutar consultas Cypher en Neo4j.
    Captura nodos, relaciones, datos tabulares y estadísticas.
    """

    def __init__(self, db: Session):
        self.db = db
        self.query_history_repository = QueryHistoryRepository(db)
        self.connection_repository = ConnectionRepository(db)
        self.translation_service = TranslationService()

    def execute_cypher(
        self, user_id: UUID, request: ExecutionRequestDTO
    ) -> ExecutionResponseDTO:
        """
        Ejecuta una consulta Cypher en Neo4j.

        Args:
            user_id: ID del usuario que ejecuta la consulta.
            request: Datos de la consulta a ejecutar.

        Returns:
            Resultado de la ejecución con datos del grafo, tabulares y estadísticas.

        Raises:
            HTTPException: Si no hay conexión Neo4j activa o hay error de ejecución.
        """
        # Obtener la conexión Neo4j
        connection = self._get_neo4j_connection(user_id, request.connection_id)

        # Crear registro de historial
        query_history = QueryHistory(
            user_id=user_id,
            connection_id=connection.connection_id,
            sql_query=request.sql_query
            or request.cypher_query,  # Usar cypher como SQL si no hay SQL
            cypher_query=request.cypher_query,
            query_status=QueryStatus.PENDING,
        )
        query_history = self.query_history_repository.create(query_history)

        # Ejecutar la consulta
        try:
            result = self._execute_query_internal(
                connection=connection,
                cypher_query=request.cypher_query,
            )

            # Actualizar historial con éxito
            query_history.query_status = QueryStatus.EXECUTED
            query_history.execution_time = result["execution_time"]
            query_history.result_details = {
                "nodes_count": len(result["graph_data"].nodes),
                "relationships_count": len(result["graph_data"].relationships),
                "rows_count": len(result["tabular_data"].rows),
                "statistics": result["statistics"].model_dump(),
            }
            self.query_history_repository.update(query_history)

            return ExecutionResponseDTO(
                query_id=query_history.query_id,
                cypher_query=request.cypher_query,
                sql_query=request.sql_query,
                status=QueryStatus.EXECUTED,
                graph_data=result["graph_data"],
                tabular_data=result["tabular_data"],
                statistics=result["statistics"],
                error_message=None,
                executed_at=query_history.created_at,
            )

        except Exception as e:
            # Actualizar historial con error
            query_history.query_status = QueryStatus.FAILED
            query_history.failure_stage = FailureStage.EXECUTION
            query_history.error_message = str(e)
            self.query_history_repository.update(query_history)

            return ExecutionResponseDTO(
                query_id=query_history.query_id,
                cypher_query=request.cypher_query,
                sql_query=request.sql_query,
                status=QueryStatus.FAILED,
                graph_data=None,
                tabular_data=None,
                statistics=None,
                error_message=str(e),
                executed_at=query_history.created_at,
            )

    def translate_and_execute(
        self, user_id: UUID, request: TranslateAndExecuteRequestDTO
    ) -> ExecutionResponseDTO:
        """
        Traduce una consulta SQL a Cypher y la ejecuta en Neo4j.

        Args:
            user_id: ID del usuario.
            request: Datos de la consulta SQL a traducir y ejecutar.

        Returns:
            Resultado de la ejecución.
        """
        # Obtener la conexión Neo4j primero
        connection = self._get_neo4j_connection(user_id, request.connection_id)

        # Crear registro de historial
        query_history = QueryHistory(
            user_id=user_id,
            connection_id=connection.connection_id,
            sql_query=request.sql_query,
            query_status=QueryStatus.PENDING,
        )
        query_history = self.query_history_repository.create(query_history)

        # Traducir SQL a Cypher
        try:
            translation_start = time.perf_counter()
            translation_result = self.translation_service.translate(
                TranslationRequestDTO(sql=request.sql_query)
            )
            translation_time = time.perf_counter() - translation_start

            query_history.cypher_query = translation_result.cypher
            query_history.translation_time = translation_time
            query_history.query_status = QueryStatus.TRANSLATED
            self.query_history_repository.update(query_history)

        except HTTPException as e:
            # Error en la traducción
            query_history.query_status = QueryStatus.FAILED
            query_history.failure_stage = FailureStage.TRANSLATION
            query_history.error_message = e.detail
            self.query_history_repository.update(query_history)

            return ExecutionResponseDTO(
                query_id=query_history.query_id,
                cypher_query=None,
                sql_query=request.sql_query,
                status=QueryStatus.FAILED,
                graph_data=None,
                tabular_data=None,
                statistics=None,
                error_message=f"Error de traducción: {e.detail}",
                executed_at=query_history.created_at,
            )

        # Ejecutar la consulta Cypher
        try:
            result = self._execute_query_internal(
                connection=connection,
                cypher_query=translation_result.cypher,
            )

            # Actualizar historial con éxito
            query_history.query_status = QueryStatus.EXECUTED
            query_history.execution_time = result["execution_time"]
            query_history.result_details = {
                "nodes_count": len(result["graph_data"].nodes),
                "relationships_count": len(result["graph_data"].relationships),
                "rows_count": len(result["tabular_data"].rows),
                "statistics": result["statistics"].model_dump(),
            }
            self.query_history_repository.update(query_history)

            return ExecutionResponseDTO(
                query_id=query_history.query_id,
                cypher_query=translation_result.cypher,
                sql_query=request.sql_query,
                status=QueryStatus.EXECUTED,
                graph_data=result["graph_data"],
                tabular_data=result["tabular_data"],
                statistics=result["statistics"],
                error_message=None,
                executed_at=query_history.created_at,
            )

        except Exception as e:
            # Error en la ejecución
            query_history.query_status = QueryStatus.FAILED
            query_history.failure_stage = FailureStage.EXECUTION
            query_history.error_message = str(e)
            self.query_history_repository.update(query_history)

            return ExecutionResponseDTO(
                query_id=query_history.query_id,
                cypher_query=translation_result.cypher,
                sql_query=request.sql_query,
                status=QueryStatus.FAILED,
                graph_data=None,
                tabular_data=None,
                statistics=None,
                error_message=f"Error de ejecución: {str(e)}",
                executed_at=query_history.created_at,
            )

    def get_query_history(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 10,
        status: Optional[str] = None,
        connection_id: Optional[UUID] = None,
    ) -> QueryHistoryListResponseDTO:
        """
        Obtiene el historial de consultas de un usuario con paginación.

        Args:
            user_id: ID del usuario.
            page: Número de página.
            page_size: Tamaño de página.
            status: Filtrar por estado (opcional).
            connection_id: Filtrar por conexión (opcional).

        Returns:
            Lista paginada de historial de consultas.
        """
        # Convertir string a QueryStatus si se proporciona
        status_enum = None
        if status:
            try:
                status_enum = QueryStatus(status)
            except ValueError:
                pass

        queries, total = self.query_history_repository.get_all_by_user(
            user_id=user_id,
            page=page,
            page_size=page_size,
            status=status_enum,
            connection_id=connection_id,
        )

        total_pages = math.ceil(total / page_size) if total > 0 else 1

        return QueryHistoryListResponseDTO(
            queries=[QueryHistoryResponseDTO.model_validate(q) for q in queries],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_query_by_id(self, user_id: UUID, query_id: UUID) -> QueryHistoryResponseDTO:
        """
        Obtiene una consulta específica del historial.

        Args:
            user_id: ID del usuario.
            query_id: ID de la consulta.

        Returns:
            Registro de la consulta.

        Raises:
            HTTPException: Si la consulta no existe o no pertenece al usuario.
        """
        query = self.query_history_repository.get_by_id_and_user(query_id, user_id)

        if not query:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consulta no encontrada",
            )

        return QueryHistoryResponseDTO.model_validate(query)

    def delete_query_history(self, user_id: UUID, query_id: UUID) -> dict:
        """
        Elimina una consulta del historial.

        Args:
            user_id: ID del usuario.
            query_id: ID de la consulta a eliminar.

        Returns:
            Mensaje de confirmación.
        """
        query = self.query_history_repository.get_by_id_and_user(query_id, user_id)

        if not query:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consulta no encontrada",
            )

        self.query_history_repository.delete(query)
        return {"message": "Consulta eliminada del historial exitosamente"}

    def clear_query_history(self, user_id: UUID) -> dict:
        """
        Elimina todo el historial de consultas de un usuario.

        Args:
            user_id: ID del usuario.

        Returns:
            Mensaje con el número de registros eliminados.
        """
        deleted_count = self.query_history_repository.delete_all_by_user(user_id)
        return {
            "message": f"Se eliminaron {deleted_count} registros del historial",
            "deleted_count": deleted_count,
        }

    def _get_neo4j_connection(
        self, user_id: UUID, connection_id: Optional[UUID] = None
    ):
        """
        Obtiene la conexión Neo4j a usar.

        Args:
            user_id: ID del usuario.
            connection_id: ID de conexión específica (opcional).

        Returns:
            Conexión Neo4j.

        Raises:
            HTTPException: Si no se encuentra una conexión válida.
        """
        if connection_id:
            # Usar conexión específica
            connection = self.connection_repository.get_by_id_and_user(
                connection_id, user_id
            )
            if not connection:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conexión no encontrada",
                )
            if connection.engine_type != EngineType.NEO4J:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La conexión debe ser de tipo Neo4j",
                )
        else:
            # Buscar conexión activa
            connection = self.connection_repository.get_active_by_user_and_type(
                user_id, EngineType.NEO4J
            )
            if not connection:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No hay conexión Neo4j activa. Por favor, activa una conexión primero.",
                )

        return connection

    def _execute_query_internal(
        self,
        connection,
        cypher_query: str,
    ) -> dict:
        """
        Ejecuta una consulta Cypher y extrae los resultados.

        Args:
            connection: Modelo de conexión con los datos de Neo4j.
            cypher_query: Consulta Cypher a ejecutar.

        Returns:
            Diccionario con graph_data, tabular_data, statistics y execution_time.
        """
        # Desencriptar contraseña
        decrypted_password = decrypt_credential(connection.password_db)

        # Construir URI de conexión
        uri = f"bolt://{connection.host}:{connection.port}"

        driver = None
        try:
            driver = GraphDatabase.driver(
                uri,
                auth=(connection.username_db, decrypted_password),
            )

            # Ejecutar la consulta y medir tiempo
            start_time = time.perf_counter()

            with driver.session(database=connection.database_name) as session:
                result = session.run(cypher_query)

                # Extraer todos los registros y estadísticas
                records = list(result)
                summary = result.consume()

            execution_time = time.perf_counter() - start_time

            # Procesar resultados
            graph_data = self._extract_graph_data(records)
            tabular_data = self._extract_tabular_data(records)
            statistics = self._extract_statistics(summary, execution_time, len(records))

            return {
                "graph_data": graph_data,
                "tabular_data": tabular_data,
                "statistics": statistics,
                "execution_time": execution_time,
            }

        except AuthError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Error de autenticación en Neo4j: {str(e)}",
            )
        except ServiceUnavailable as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Neo4j no disponible: {str(e)}",
            )
        except CypherSyntaxError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error de sintaxis Cypher: {str(e)}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error ejecutando consulta: {str(e)}",
            )
        finally:
            if driver:
                driver.close()

    def _extract_graph_data(self, records: list) -> GraphDataDTO:
        """
        Extrae nodos y relaciones de los registros para visualización en grafo.

        Args:
            records: Lista de registros retornados por Neo4j.

        Returns:
            Datos del grafo con nodos y relaciones únicos.
        """
        nodes_dict: dict[int, NodeDTO] = {}
        relationships_dict: dict[int, RelationshipDTO] = {}

        for record in records:
            for value in record.values():
                self._process_graph_value(value, nodes_dict, relationships_dict)

        return GraphDataDTO(
            nodes=list(nodes_dict.values()),
            relationships=list(relationships_dict.values()),
        )

    def _process_graph_value(
        self,
        value: Any,
        nodes_dict: dict[int, NodeDTO],
        relationships_dict: dict[int, RelationshipDTO],
    ) -> None:
        """
        Procesa un valor del registro y extrae nodos/relaciones.

        Args:
            value: Valor a procesar (puede ser Node, Relationship, Path, etc.)
            nodes_dict: Diccionario de nodos encontrados.
            relationships_dict: Diccionario de relaciones encontradas.
        """
        from neo4j.graph import Node, Relationship, Path

        if isinstance(value, Node):
            if value.id not in nodes_dict:
                nodes_dict[value.id] = NodeDTO(
                    id=value.id,
                    labels=list(value.labels),
                    properties=dict(value),
                )
        elif isinstance(value, Relationship):
            if value.id not in relationships_dict:
                relationships_dict[value.id] = RelationshipDTO(
                    id=value.id,
                    type=value.type,
                    start_node_id=value.start_node.id,
                    end_node_id=value.end_node.id,
                    properties=dict(value),
                )
                # También agregar los nodos de la relación
                self._process_graph_value(
                    value.start_node, nodes_dict, relationships_dict
                )
                self._process_graph_value(
                    value.end_node, nodes_dict, relationships_dict
                )
        elif isinstance(value, Path):
            # Procesar todos los nodos y relaciones del path
            for node in value.nodes:
                self._process_graph_value(node, nodes_dict, relationships_dict)
            for rel in value.relationships:
                self._process_graph_value(rel, nodes_dict, relationships_dict)
        elif isinstance(value, list):
            for item in value:
                self._process_graph_value(item, nodes_dict, relationships_dict)

    def _extract_tabular_data(self, records: list) -> TabularDataDTO:
        """
        Extrae datos en formato tabular de los registros.

        Args:
            records: Lista de registros retornados por Neo4j.

        Returns:
            Datos tabulares con columnas y filas.
        """
        if not records:
            return TabularDataDTO(columns=[], rows=[])

        # Obtener columnas del primer registro
        columns = list(records[0].keys()) if records else []

        rows = []
        for record in records:
            row = {}
            for key in columns:
                value = record.get(key)
                # Serializar valores complejos
                row[key] = self._serialize_value(value)
            rows.append(row)

        return TabularDataDTO(columns=columns, rows=rows)

    def _serialize_value(self, value: Any) -> Any:
        """
        Serializa un valor de Neo4j a un formato JSON-compatible.

        Args:
            value: Valor a serializar.

        Returns:
            Valor serializado.
        """
        from neo4j.graph import Node, Relationship, Path
        from neo4j.time import DateTime as Neo4jDateTime, Date as Neo4jDate

        if value is None:
            return None
        elif isinstance(value, (str, int, float, bool)):
            return value
        elif isinstance(value, Node):
            return {
                "_type": "node",
                "id": value.id,
                "labels": list(value.labels),
                "properties": dict(value),
            }
        elif isinstance(value, Relationship):
            return {
                "_type": "relationship",
                "id": value.id,
                "type": value.type,
                "start_node_id": value.start_node.id,
                "end_node_id": value.end_node.id,
                "properties": dict(value),
            }
        elif isinstance(value, Path):
            return {
                "_type": "path",
                "nodes": [self._serialize_value(n) for n in value.nodes],
                "relationships": [
                    self._serialize_value(r) for r in value.relationships
                ],
            }
        elif isinstance(value, (Neo4jDateTime, Neo4jDate)):
            return value.iso_format()
        elif isinstance(value, list):
            return [self._serialize_value(v) for v in value]
        elif isinstance(value, dict):
            return {k: self._serialize_value(v) for k, v in value.items()}
        else:
            return str(value)

    def _extract_statistics(
        self,
        summary,
        execution_time: float,
        rows_count: int,
    ) -> ExecutionStatisticsDTO:
        """
        Extrae estadísticas de la ejecución de la consulta.

        Args:
            summary: Resumen de ejecución de Neo4j.
            execution_time: Tiempo de ejecución medido.
            rows_count: Número de filas retornadas.

        Returns:
            Estadísticas de ejecución.
        """
        counters = summary.counters

        return ExecutionStatisticsDTO(
            execution_time=round(execution_time, 6),
            nodes_created=counters.nodes_created,
            nodes_deleted=counters.nodes_deleted,
            relationships_created=counters.relationships_created,
            relationships_deleted=counters.relationships_deleted,
            properties_set=counters.properties_set,
            labels_added=counters.labels_added,
            labels_removed=counters.labels_removed,
            rows_affected=rows_count,
        )
