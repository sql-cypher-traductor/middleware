import sqlglot
from sqlglot import exp


def poc_translate_query(test_name, sql_query):
    print(f"\n--- PRUEBA: {test_name} ---")
    print(f"🔹 SQL Original: {sql_query.strip()}")

    try:
        # PASO 1: PARSEO SQL (Conversión a AST)
        expression = sqlglot.parse_one(sql_query, read="tsql")

        # PASO 2: EXTRACCIÓN DE DATOS
        # A. Encontrar la tabla principal mediante FROM
        # Buscamos los nodos de tipo Table en el árbol
        tables = [t.name for t in expression.find_all(exp.Table)]
        main_table = tables[0] if tables else "Dato"

        # B. Encontrar las columnas seleccionadas (Sentencia SELECT)
        # Búsqueda de Columnas o de *
        projection_list = []
        for select_statement in expression.find_all(exp.Select):
            for projection in select_statement.expressions:
                if isinstance(projection, exp.Star):
                    projection_list.append("n")  # Devolver todo el nodo
                else:
                    # Si es columna, obtenemos su nombre o alias
                    column_name = projection.alias_or_name
                    projection_list.append(f"n.{column_name}")

        return_str = ", ".join(projection_list)

        # C. Encontrar Filtros "WHERE"
        filters = []
        where_clause = expression.find(exp.Where)
        if where_clause:
            # Convertir la expresión "WHERE" a string y reemplazar sintaxis.
            filter_str = where_clause.sql().replace("WHERE", "").strip()
            filters.append(f"WHERE n.{filter_str}")

        filter_str = " ".join(filters)

        # PASO 3: GENERACIÓN DE CYPHER
        # Estructura base: MATCH (n:Tabla) [WHERE...] RETURN ...
        cypher_query = (
            f"MATCH (n:{main_table}) {filter_str} RETURN {return_str}"
        )

        print(f"🔸 Resultado Cypher (Generado por nosotros): \n{cypher_query}")

    except Exception as e:
        print(f"❌ Error: {e}")


# Prueba 1: Selección Básica
sql_query_1 = "SELECT nombre, edad FROM usuarios WHERE edad > 25;"

# Prueba 2: Proyección simple
sql_query_2 = "SELECT * FROM productos;"

if __name__ == "__main__":
    print("🚀 Iniciando prueba de concepto AST...")
    poc_translate_query("Prueba 1: Select con Where", sql_query_1)
    poc_translate_query("Prueba 2: Select All", sql_query_2)
