"""
DTOs para el módulo de ejecución de consultas Cypher en Neo4j.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any

from ..models.enums.query_status import QueryStatus


class ExecutionRequestDTO(BaseModel):
    """
    Esquema de solicitud para ejecutar una consulta Cypher en Neo4j.

    Attributes:
        cypher_query: Consulta Cypher a ejecutar.
        connection_id: ID de la conexión Neo4j a usar (opcional, usa la activa si no se especifica).
        sql_query: Consulta SQL original (opcional, para registro).
    """

    cypher_query: str = Field(
        ..., min_length=1, description="Consulta Cypher a ejecutar"
    )
    connection_id: Optional[UUID] = Field(
        None, description="ID de la conexión Neo4j (usa la activa si no se especifica)"
    )
    sql_query: Optional[str] = Field(
        None, description="Consulta SQL original para registro"
    )


class NodeDTO(BaseModel):
    """
    Representa un nodo de Neo4j para visualización en grafo.

    Attributes:
        id: ID interno del nodo en Neo4j.
        labels: Etiquetas del nodo.
        properties: Propiedades del nodo.
    """

    id: int = Field(..., description="ID interno del nodo")
    labels: list[str] = Field(default_factory=list, description="Etiquetas del nodo")
    properties: dict[str, Any] = Field(
        default_factory=dict, description="Propiedades del nodo"
    )


class RelationshipDTO(BaseModel):
    """
    Representa una relación de Neo4j para visualización en grafo.

    Attributes:
        id: ID interno de la relación.
        type: Tipo de relación.
        start_node_id: ID del nodo de origen.
        end_node_id: ID del nodo de destino.
        properties: Propiedades de la relación.
    """

    id: int = Field(..., description="ID interno de la relación")
    type: str = Field(..., description="Tipo de relación")
    start_node_id: int = Field(..., description="ID del nodo de origen")
    end_node_id: int = Field(..., description="ID del nodo de destino")
    properties: dict[str, Any] = Field(
        default_factory=dict, description="Propiedades de la relación"
    )


class GraphDataDTO(BaseModel):
    """
    Datos del grafo para visualización.

    Attributes:
        nodes: Lista de nodos.
        relationships: Lista de relaciones.
    """

    nodes: list[NodeDTO] = Field(default_factory=list, description="Nodos del grafo")
    relationships: list[RelationshipDTO] = Field(
        default_factory=list, description="Relaciones del grafo"
    )


class TabularDataDTO(BaseModel):
    """
    Datos tabulares para visualización en tabla.

    Attributes:
        columns: Nombres de las columnas.
        rows: Filas de datos (cada fila es un diccionario columna->valor).
    """

    columns: list[str] = Field(
        default_factory=list, description="Nombres de las columnas"
    )
    rows: list[dict[str, Any]] = Field(
        default_factory=list, description="Filas de datos"
    )


class ExecutionStatisticsDTO(BaseModel):
    """
    Estadísticas de ejecución de la consulta.

    Attributes:
        execution_time: Tiempo de ejecución en segundos.
        nodes_created: Número de nodos creados.
        nodes_deleted: Número de nodos eliminados.
        relationships_created: Número de relaciones creadas.
        relationships_deleted: Número de relaciones eliminadas.
        properties_set: Número de propiedades establecidas.
        labels_added: Número de etiquetas añadidas.
        labels_removed: Número de etiquetas eliminadas.
        rows_affected: Número de filas afectadas/retornadas.
    """

    execution_time: float = Field(..., description="Tiempo de ejecución en segundos")
    nodes_created: int = Field(default=0, description="Nodos creados")
    nodes_deleted: int = Field(default=0, description="Nodos eliminados")
    relationships_created: int = Field(default=0, description="Relaciones creadas")
    relationships_deleted: int = Field(default=0, description="Relaciones eliminadas")
    properties_set: int = Field(default=0, description="Propiedades establecidas")
    labels_added: int = Field(default=0, description="Etiquetas añadidas")
    labels_removed: int = Field(default=0, description="Etiquetas eliminadas")
    rows_affected: int = Field(default=0, description="Filas afectadas/retornadas")


class ExecutionResponseDTO(BaseModel):
    """
    Esquema de respuesta para ejecución de consulta Cypher.

    Attributes:
        query_id: ID del registro de historial de la consulta.
        cypher_query: Consulta Cypher ejecutada.
        sql_query: Consulta SQL original (si fue proporcionada).
        status: Estado de la ejecución.
        graph_data: Datos del grafo para visualización.
        tabular_data: Datos tabulares para visualización en tabla.
        statistics: Estadísticas de ejecución.
        error_message: Mensaje de error (si la ejecución falló).
        executed_at: Fecha y hora de ejecución.
    """

    query_id: UUID = Field(..., description="ID del registro de historial")
    cypher_query: Optional[str] = Field(None, description="Consulta Cypher ejecutada")
    sql_query: Optional[str] = Field(None, description="Consulta SQL original")
    status: QueryStatus = Field(..., description="Estado de la ejecución")
    graph_data: Optional[GraphDataDTO] = Field(None, description="Datos del grafo")
    tabular_data: Optional[TabularDataDTO] = Field(None, description="Datos tabulares")
    statistics: Optional[ExecutionStatisticsDTO] = Field(
        None, description="Estadísticas de ejecución"
    )
    error_message: Optional[str] = Field(None, description="Mensaje de error")
    executed_at: datetime = Field(..., description="Fecha y hora de ejecución")


class TranslateAndExecuteRequestDTO(BaseModel):
    """
    Esquema para traducir SQL y ejecutar el Cypher resultante en un solo paso.

    Attributes:
        sql_query: Consulta SQL a traducir y ejecutar.
        connection_id: ID de la conexión Neo4j a usar (opcional).
    """

    sql_query: str = Field(
        ..., min_length=1, description="Consulta SQL a traducir y ejecutar"
    )
    connection_id: Optional[UUID] = Field(
        None, description="ID de la conexión Neo4j (usa la activa si no se especifica)"
    )


class QueryHistoryResponseDTO(BaseModel):
    """
    Esquema de respuesta para historial de consultas.

    Attributes:
        query_id: ID único de la consulta.
        user_id: ID del usuario que ejecutó la consulta.
        connection_id: ID de la conexión usada.
        sql_query: Consulta SQL original.
        cypher_query: Consulta Cypher generada.
        query_status: Estado de la consulta.
        failure_stage: Etapa donde falló (si aplica).
        error_message: Mensaje de error (si aplica).
        translation_time: Tiempo de traducción.
        execution_time: Tiempo de ejecución.
        result_details: Detalles del resultado (estadísticas).
        created_at: Fecha de creación.
    """

    model_config = ConfigDict(from_attributes=True)

    query_id: UUID
    user_id: UUID
    connection_id: Optional[UUID] = None
    sql_query: str
    cypher_query: Optional[str] = None
    query_status: QueryStatus
    failure_stage: Optional[str] = None
    error_message: Optional[str] = None
    translation_time: Optional[float] = None
    execution_time: Optional[float] = None
    result_details: Optional[dict[str, Any]] = None
    created_at: datetime


class QueryHistoryListResponseDTO(BaseModel):
    """
    Esquema de respuesta para listar historial con paginación.

    Attributes:
        queries: Lista de consultas.
        total: Total de registros.
        page: Página actual.
        page_size: Tamaño de página.
        total_pages: Total de páginas.
    """

    queries: list[QueryHistoryResponseDTO]
    total: int
    page: int
    page_size: int
    total_pages: int
