"""
Servicio para gestión de conexiones a bases de datos externas.
Maneja la lógica de conexión a SQL Server y Neo4j.
"""

import math
from uuid import UUID
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..core.encryption import encrypt_credential, decrypt_credential
from ..dto.connection_dto import (
    ConnectionCreateDTO,
    ConnectionUpdateDTO,
    ConnectionResponseDTO,
    ConnectionTestDTO,
    ConnectionTestResponseDTO,
    DatabaseSchemaDTO,
    TableSchemaDTO,
    TableColumnDTO,
    ConnectionListResponseDTO,
    ActiveConnectionsDTO,
)
from ..models.connection import Connection
from ..models.enums.engine_type import EngineType
from ..repositories.connection_repository import ConnectionRepository


class ConnectionService:
    """
    Servicio para gestionar conexiones a bases de datos externas.
    """

    def __init__(self, db: Session):
        self.connection_repository = ConnectionRepository(db)

    def create_connection(
        self, user_id: UUID, connection_data: ConnectionCreateDTO
    ) -> ConnectionResponseDTO:
        """
        Crea una nueva conexión para un usuario.
        La contraseña se cifra antes de guardarla.

        Args:
            user_id: ID del usuario propietario.
            connection_data: Datos de la conexión a crear.

        Returns:
            Conexión creada.
        """
        # Cifrar la contraseña antes de guardar
        encrypted_password = encrypt_credential(connection_data.password_db)

        connection = Connection(
            user_id=user_id,
            connection_name=connection_data.connection_name,
            engine_type=connection_data.engine_type,
            host=connection_data.host,
            port=connection_data.port,
            database_name=connection_data.database_name,
            username_db=connection_data.username_db,
            password_db=encrypted_password,
            is_active=False,  # Inicia desactivada
        )

        created_connection = self.connection_repository.create(connection)
        return ConnectionResponseDTO.model_validate(created_connection)

    def get_connection(
        self, connection_id: UUID, user_id: UUID
    ) -> ConnectionResponseDTO:
        """
        Obtiene una conexión por su ID.

        Args:
            connection_id: ID de la conexión.
            user_id: ID del usuario propietario.

        Returns:
            Conexión encontrada.

        Raises:
            HTTPException: Si la conexión no existe o no pertenece al usuario.
        """
        connection = self.connection_repository.get_by_id_and_user(
            connection_id, user_id
        )

        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conexión no encontrada",
            )

        return ConnectionResponseDTO.model_validate(connection)

    def get_connections(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 10,
        engine_type: Optional[str] = None,
    ) -> ConnectionListResponseDTO:
        """
        Obtiene todas las conexiones de un usuario con paginación.

        Args:
            user_id: ID del usuario.
            page: Número de página.
            page_size: Tamaño de página.
            engine_type: Filtrar por tipo de motor (opcional).

        Returns:
            Lista paginada de conexiones.
        """
        # Convertir string a EngineType si se proporciona
        engine_type_enum = None
        if engine_type:
            engine_type_enum = EngineType(engine_type)

        connections, total = self.connection_repository.get_all_by_user(
            user_id, page, page_size, engine_type_enum
        )

        total_pages = math.ceil(total / page_size) if total > 0 else 1

        return ConnectionListResponseDTO(
            connections=[ConnectionResponseDTO.model_validate(c) for c in connections],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def update_connection(
        self, connection_id: UUID, user_id: UUID, update_data: ConnectionUpdateDTO
    ) -> ConnectionResponseDTO:
        """
        Actualiza una conexión existente.

        Args:
            connection_id: ID de la conexión a actualizar.
            user_id: ID del usuario propietario.
            update_data: Datos a actualizar.

        Returns:
            Conexión actualizada.

        Raises:
            HTTPException: Si la conexión no existe o no pertenece al usuario.
        """
        connection = self.connection_repository.get_by_id_and_user(
            connection_id, user_id
        )

        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conexión no encontrada",
            )

        # Actualizar solo los campos proporcionados
        if update_data.connection_name is not None:
            connection.connection_name = update_data.connection_name
        if update_data.host is not None:
            connection.host = update_data.host
        if update_data.port is not None:
            connection.port = update_data.port
        if update_data.database_name is not None:
            connection.database_name = update_data.database_name
        if update_data.username_db is not None:
            connection.username_db = update_data.username_db
        if update_data.password_db is not None:
            connection.password_db = encrypt_credential(update_data.password_db)

        updated_connection = self.connection_repository.update(connection)
        return ConnectionResponseDTO.model_validate(updated_connection)

    def delete_connection(self, connection_id: UUID, user_id: UUID) -> dict:
        """
        Elimina una conexión.

        Args:
            connection_id: ID de la conexión a eliminar.
            user_id: ID del usuario propietario.

        Returns:
            Mensaje de confirmación.

        Raises:
            HTTPException: Si la conexión no existe o no pertenece al usuario.
        """
        connection = self.connection_repository.get_by_id_and_user(
            connection_id, user_id
        )

        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conexión no encontrada",
            )

        self.connection_repository.delete(connection)
        return {"message": "Conexión eliminada exitosamente"}

    def activate_connection(
        self, connection_id: UUID, user_id: UUID
    ) -> ConnectionResponseDTO:
        """
        Activa una conexión. Desactiva cualquier otra conexión del mismo tipo.
        Solo puede haber una conexión activa por tipo de motor (SQL Server o Neo4j).

        Args:
            connection_id: ID de la conexión a activar.
            user_id: ID del usuario propietario.

        Returns:
            Conexión activada.

        Raises:
            HTTPException: Si la conexión no existe o no se puede conectar.
        """
        connection = self.connection_repository.get_by_id_and_user(
            connection_id, user_id
        )

        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conexión no encontrada",
            )

        # Primero, probar la conexión antes de activarla
        decrypted_password = decrypt_credential(connection.password_db)

        test_result = self._test_connection_internal(
            engine_type=connection.engine_type,
            host=connection.host,
            port=connection.port,
            database_name=connection.database_name,
            username_db=connection.username_db,
            password_db=decrypted_password,
        )

        if not test_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se pudo conectar: {test_result['message']}",
            )

        # Desactivar cualquier otra conexión del mismo tipo para este usuario
        self.connection_repository.deactivate_all_by_user_and_type(
            user_id, connection.engine_type
        )

        # Activar esta conexión
        connection.is_active = True
        updated_connection = self.connection_repository.update(connection)

        return ConnectionResponseDTO.model_validate(updated_connection)

    def deactivate_connection(
        self, connection_id: UUID, user_id: UUID
    ) -> ConnectionResponseDTO:
        """
        Desactiva una conexión.

        Args:
            connection_id: ID de la conexión a desactivar.
            user_id: ID del usuario propietario.

        Returns:
            Conexión desactivada.
        """
        connection = self.connection_repository.get_by_id_and_user(
            connection_id, user_id
        )

        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conexión no encontrada",
            )

        connection.is_active = False
        updated_connection = self.connection_repository.update(connection)

        return ConnectionResponseDTO.model_validate(updated_connection)

    def get_active_connections(self, user_id: UUID) -> ActiveConnectionsDTO:
        """
        Obtiene las conexiones activas del usuario (una por cada tipo de motor).

        Args:
            user_id: ID del usuario.

        Returns:
            Conexiones activas (SQL Server y/o Neo4j).
        """
        sql_server_connection = self.connection_repository.get_active_by_user_and_type(
            user_id, EngineType.SQL_SERVER
        )
        neo4j_connection = self.connection_repository.get_active_by_user_and_type(
            user_id, EngineType.NEO4J
        )

        return ActiveConnectionsDTO(
            sql_server=(
                ConnectionResponseDTO.model_validate(sql_server_connection)
                if sql_server_connection
                else None
            ),
            neo4j=(
                ConnectionResponseDTO.model_validate(neo4j_connection)
                if neo4j_connection
                else None
            ),
        )

    def test_connection(
        self, connection_data: ConnectionTestDTO
    ) -> ConnectionTestResponseDTO:
        """
        Prueba una conexión volátil sin guardarla.

        Args:
            connection_data: Datos de la conexión a probar.

        Returns:
            Resultado del test de conexión.
        """
        result = self._test_connection_internal(
            engine_type=connection_data.engine_type,
            host=connection_data.host,
            port=connection_data.port,
            database_name=connection_data.database_name,
            username_db=connection_data.username_db,
            password_db=connection_data.password_db,
        )

        return ConnectionTestResponseDTO(
            success=result["success"],
            message=result["message"],
            engine_type=connection_data.engine_type,
        )

    def test_saved_connection(
        self, connection_id: UUID, user_id: UUID
    ) -> ConnectionTestResponseDTO:
        """
        Prueba una conexión guardada.

        Args:
            connection_id: ID de la conexión a probar.
            user_id: ID del usuario propietario.

        Returns:
            Resultado del test de conexión.
        """
        connection = self.connection_repository.get_by_id_and_user(
            connection_id, user_id
        )

        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conexión no encontrada",
            )

        decrypted_password = decrypt_credential(connection.password_db)

        result = self._test_connection_internal(
            engine_type=connection.engine_type,
            host=connection.host,
            port=connection.port,
            database_name=connection.database_name,
            username_db=connection.username_db,
            password_db=decrypted_password,
        )

        return ConnectionTestResponseDTO(
            success=result["success"],
            message=result["message"],
            engine_type=connection.engine_type,
        )

    def get_database_schema(
        self, connection_id: UUID, user_id: UUID
    ) -> DatabaseSchemaDTO:
        """
        Obtiene el esquema de la base de datos (tablas y columnas).
        Solo funciona para conexiones SQL Server.

        Args:
            connection_id: ID de la conexión.
            user_id: ID del usuario propietario.

        Returns:
            Esquema de la base de datos.

        Raises:
            HTTPException: Si la conexión no existe o no es SQL Server.
        """
        connection = self.connection_repository.get_by_id_and_user(
            connection_id, user_id
        )

        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conexión no encontrada",
            )

        if connection.engine_type != EngineType.SQL_SERVER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La obtención de esquema solo está disponible para SQL Server",
            )

        decrypted_password = decrypt_credential(connection.password_db)

        return self._get_sql_server_schema(
            host=connection.host,
            port=connection.port,
            database_name=connection.database_name,
            username_db=connection.username_db,
            password_db=decrypted_password,
        )

    def _test_connection_internal(
        self,
        engine_type: EngineType,
        host: str,
        port: int,
        database_name: str,
        username_db: str,
        password_db: str,
    ) -> dict:
        """
        Prueba una conexión internamente.

        Args:
            engine_type: Tipo de motor de base de datos.
            host: Host del servidor.
            port: Puerto de conexión.
            database_name: Nombre de la base de datos.
            username_db: Usuario.
            password_db: Contraseña.

        Returns:
            Diccionario con success (bool) y message (str).
        """
        if engine_type == EngineType.SQL_SERVER:
            return self._test_sql_server_connection(
                host, port, database_name, username_db, password_db
            )
        elif engine_type == EngineType.NEO4J:
            return self._test_neo4j_connection(
                host, port, database_name, username_db, password_db
            )
        else:
            return {"success": False, "message": "Tipo de motor no soportado"}

    def _test_sql_server_connection(
        self,
        host: str,
        port: int,
        database_name: str,
        username_db: str,
        password_db: str,
    ) -> dict:
        """
        Prueba una conexión a SQL Server usando pyodbc.
        """
        try:
            import pyodbc

            # Construir la cadena de conexión para SQL Server
            connection_string = (
                f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                f"SERVER={host},{port};"
                f"DATABASE={database_name};"
                f"UID={username_db};"
                f"PWD={password_db};"
                f"Connection Timeout=10;"
            )

            conn = pyodbc.connect(connection_string, timeout=10)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            conn.close()

            return {"success": True, "message": "Conexión exitosa a SQL Server"}

        except pyodbc.Error as e:
            error_message = str(e)
            return {
                "success": False,
                "message": f"Error de SQL Server: {error_message}",
            }
        except Exception as e:
            return {"success": False, "message": f"Error inesperado: {str(e)}"}

    def _test_neo4j_connection(
        self,
        host: str,
        port: int,
        database_name: str,
        username_db: str,
        password_db: str,
    ) -> dict:
        """
        Prueba una conexión a Neo4j usando el driver oficial.
        """
        try:
            from neo4j import GraphDatabase
            from neo4j.exceptions import ServiceUnavailable, AuthError

            # Construir la URI de conexión
            uri = f"bolt://{host}:{port}"

            driver = GraphDatabase.driver(uri, auth=(username_db, password_db))

            # Verificar la conexión
            with driver.session(database=database_name) as session:
                result = session.run("RETURN 1 AS test")
                result.single()

            driver.close()

            return {"success": True, "message": "Conexión exitosa a Neo4j"}

        except AuthError as e:
            return {"success": False, "message": f"Error de autenticación: {str(e)}"}
        except ServiceUnavailable as e:
            return {"success": False, "message": f"Servicio no disponible: {str(e)}"}
        except Exception as e:
            return {"success": False, "message": f"Error inesperado: {str(e)}"}

    def _get_sql_server_schema(
        self,
        host: str,
        port: int,
        database_name: str,
        username_db: str,
        password_db: str,
    ) -> DatabaseSchemaDTO:
        """
        Obtiene el esquema de una base de datos SQL Server usando INFORMATION_SCHEMA.
        """
        try:
            import pyodbc

            connection_string = (
                f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                f"SERVER={host},{port};"
                f"DATABASE={database_name};"
                f"UID={username_db};"
                f"PWD={password_db};"
                f"Connection Timeout=10;"
            )

            conn = pyodbc.connect(connection_string, timeout=10)
            cursor = conn.cursor()

            # Obtener todas las tablas y sus columnas
            query = """
                SELECT 
                    c.TABLE_SCHEMA,
                    c.TABLE_NAME,
                    c.COLUMN_NAME,
                    c.DATA_TYPE,
                    c.IS_NULLABLE,
                    c.CHARACTER_MAXIMUM_LENGTH
                FROM INFORMATION_SCHEMA.COLUMNS c
                INNER JOIN INFORMATION_SCHEMA.TABLES t 
                    ON c.TABLE_SCHEMA = t.TABLE_SCHEMA 
                    AND c.TABLE_NAME = t.TABLE_NAME
                WHERE t.TABLE_TYPE = 'BASE TABLE'
                ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION
            """

            cursor.execute(query)
            rows = cursor.fetchall()

            cursor.close()
            conn.close()

            # Agrupar columnas por tabla
            tables_dict: dict[str, TableSchemaDTO] = {}

            for row in rows:
                table_key = f"{row.TABLE_SCHEMA}.{row.TABLE_NAME}"

                if table_key not in tables_dict:
                    tables_dict[table_key] = TableSchemaDTO(
                        table_name=row.TABLE_NAME,
                        table_schema=row.TABLE_SCHEMA,
                        columns=[],
                    )

                tables_dict[table_key].columns.append(
                    TableColumnDTO(
                        column_name=row.COLUMN_NAME,
                        data_type=row.DATA_TYPE,
                        is_nullable=row.IS_NULLABLE == "YES",
                        character_maximum_length=row.CHARACTER_MAXIMUM_LENGTH,
                    )
                )

            return DatabaseSchemaDTO(
                database_name=database_name,
                tables=list(tables_dict.values()),
            )

        except pyodbc.Error as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener el esquema: {str(e)}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error inesperado: {str(e)}",
            )
