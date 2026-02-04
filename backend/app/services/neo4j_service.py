from typing import Dict, Any, List

from neo4j import GraphDatabase, basic_auth


class Neo4jExecutor:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=basic_auth(user, password))

    def close(self):
        self.driver.close()

    def execute(self, query: str) -> Dict[str, Any]:
        """
        Ejecuta Cypher y retorna formato compatible con visualizadores de grafos (d3/force-graph).
        Retorno: { "nodes": [...], "links": [...] }
        """
        nodes = {}
        links = []

        # Normalización de la consulta
        query = query.strip()

        try:
            with self.driver.session() as session:
                result = session.run(query)
                records = [record for record in result]

                # Procesamos los resultados para extraer nodos y relaciones
                for record in records:
                    for key, value in record.items():
                        # Si es un NODO
                        if hasattr(value, "labels"):
                            node_id = (
                                str(value.element_id)
                                if hasattr(value, "element_id")
                                else str(value.id)
                            )
                            # Evitar duplicados
                            if node_id not in nodes:
                                nodes[node_id] = {
                                    "id": node_id,
                                    "labels": list(value.labels),
                                    "properties": dict(value._properties),
                                    "val": 1,  # Peso visual por defecto
                                }

                        # Si es una RELACIÓN
                        elif hasattr(value, "start_node"):
                            source_id = (
                                str(value.start_node.element_id)
                                if hasattr(value.start_node, "element_id")
                                else str(value.start_node.id)
                            )
                            target_id = (
                                str(value.end_node.element_id)
                                if hasattr(value.end_node, "element_id")
                                else str(value.end_node.id)
                            )

                            links.append(
                                {
                                    "source": source_id,
                                    "target": target_id,
                                    "type": value.type,
                                    "properties": dict(value._properties),
                                }
                            )

            return {"nodes": list(nodes.values()), "links": links}

        except Exception as e:
            raise Exception(f"Error ejecutando en Neo4j: {str(e)}")
        finally:
            self.close()

    def execute_tabular(self, query: str) -> List[Dict[str, Any]]:
        """
        Ejecuta Cypher y retorna una lista plana de diccionarios, ideal para tablas y CSV.
        """
        query = query.strip()
        data = []
        try:
            with self.driver.session() as session:
                result = session.run(query)
                for record in result:
                    # Convertimos el registro a un diccionario simple
                    row = {}
                    for key in record.keys():
                        val = record[key]
                        # Si es un Nodo o Relación, extraemos sus propiedades para que sea legible en CSV
                        if hasattr(val, "_properties"):
                            # Aplanamos las propiedades para el CSV
                            props = dict(val._properties)
                            # Opcional: convertir a string JSON si prefieres mantenerlo junto
                            # row[key] = json.dumps(props)
                            # O simplemente usar la representación string por defecto:
                            row[key] = str(props)
                        else:
                            row[key] = val
                    data.append(row)
            return data
        except Exception as e:
            raise Exception(f"Error obteniendo datos tabulares: {str(e)}")
        finally:
            self.close()
