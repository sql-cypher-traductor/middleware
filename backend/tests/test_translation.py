"""
Tests para validar la traducción de sentencias SQL a Cypher.
Incluye tests de multi-sentencia, INSERT con FK, JOINs con topología correcta,
y singularización de nombres de tabla.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.translation_service import TranslationService
from app.dto.translator_dto import TranslationRequestDTO, StatementType


def test_batch_translation():
    """Test: múltiples sentencias SQL se traducen como BATCH."""
    service = TranslationService()
    sql = """
    INSERT INTO Clientes (Nombre, Email, Telefono)
    VALUES ('Pedro Sánchez', 'pedro.sanchez@email.com', '555-1006');

    INSERT INTO Pedidos (ClienteID, ProductoID, Cantidad, Fecha, Total)
    VALUES (6, 2, 3, '2025-02-01', 59.97);

    SELECT
        p.PedidoID,
        p.Fecha,
        c.Nombre        AS Cliente,
        c.Email,
        pr.Nombre       AS Producto,
        cat.Nombre      AS Categoria,
        p.Cantidad,
        p.Total
    FROM        Pedidos    p
    INNER JOIN  Clientes   c   ON p.ClienteID  = c.ClienteID
    INNER JOIN  Productos  pr  ON p.ProductoID = pr.ProductoID
    INNER JOIN  Categorias cat ON pr.CategoriaID = cat.CategoriaID
    ORDER BY p.Fecha ASC;
    """
    result = service.translate(TranslationRequestDTO(sql=sql))
    assert result.statement_type == StatementType.BATCH, (
        f"Expected BATCH, got {result.statement_type}"
    )
    assert "// Sentencia 1: INSERT" in result.cypher
    assert "// Sentencia 2: INSERT" in result.cypher
    assert "// Sentencia 3: SELECT" in result.cypher
    print("✓ test_batch_translation PASSED")


def test_insert_without_fk():
    """Test: INSERT sin FK genera CREATE simple."""
    service = TranslationService()
    sql = "INSERT INTO Clientes (Nombre, Email, Telefono) VALUES ('Maria', 'maria@test.com', '555-0001')"
    result = service.translate(TranslationRequestDTO(sql=sql))
    assert result.statement_type == StatementType.INSERT
    assert "CREATE (cli:Cliente" in result.cypher
    assert "Nombre:" in result.cypher
    assert "Email:" in result.cypher
    assert "MATCH" not in result.cypher  # No debería haber MATCH sin FKs
    print("✓ test_insert_without_fk PASSED")


def test_insert_with_fk():
    """Test: INSERT con FK genera MATCH + CREATE con relaciones."""
    service = TranslationService()
    sql = "INSERT INTO Pedidos (ClienteID, ProductoID, Cantidad, Fecha, Total) VALUES (6, 2, 3, '2025-02-01', 59.97)"
    result = service.translate(TranslationRequestDTO(sql=sql))
    assert result.statement_type == StatementType.INSERT
    assert "MATCH" in result.cypher
    assert "Cliente" in result.cypher
    assert "Producto" in result.cypher
    assert "CREATE (ped:Pedido" in result.cypher
    assert "HAS_CLIENTE" in result.cypher
    assert "HAS_PRODUCTO" in result.cypher
    print("✓ test_insert_with_fk PASSED")


def test_select_join_topology():
    """Test: SELECT con JOINs genera topología correcta (no lineal)."""
    service = TranslationService()
    sql = """
    SELECT p.PedidoID, c.Nombre AS Cliente, pr.Nombre AS Producto, cat.Nombre AS Categoria
    FROM Pedidos p
    INNER JOIN Clientes c ON p.ClienteID = c.ClienteID
    INNER JOIN Productos pr ON p.ProductoID = pr.ProductoID
    INNER JOIN Categorias cat ON pr.CategoriaID = cat.CategoriaID
    """
    result = service.translate(TranslationRequestDTO(sql=sql))
    cypher = result.cypher

    # Verificar que hay ramificación (dos patrones MATCH separados por coma)
    assert "(p:Pedido)-[:HAS_CLIENTE]->(c:Cliente)" in cypher
    assert "(p)-[:HAS_PRODUCTO]->(pr:Producto)-[:HAS_CATEGORIA]->(cat:Categoria)" in cypher

    # Verificar que NO es una cadena lineal incorrecta
    assert "(c:Cliente)-[:HAS_PRODUCTO]" not in cypher, "JOINs should not chain linearly through Clientes"
    print("✓ test_select_join_topology PASSED")


def test_singularization():
    """Test: nombres de tabla se singularizan correctamente."""
    service = TranslationService()
    assert service._singularize_table_name("Clientes") == "Cliente"
    assert service._singularize_table_name("Pedidos") == "Pedido"
    assert service._singularize_table_name("Productos") == "Producto"
    assert service._singularize_table_name("Categorias") == "Categoria"
    assert service._singularize_table_name("users") == "user"
    assert service._singularize_table_name("User") == "User"  # Already singular
    print("✓ test_singularization PASSED")


def test_update_singularized():
    """Test: UPDATE usa nombre de tabla singularizado."""
    service = TranslationService()
    sql = "UPDATE Clientes SET Nombre = 'Juan' WHERE ClienteID = 1"
    result = service.translate(TranslationRequestDTO(sql=sql))
    assert "MATCH (c:Cliente)" in result.cypher
    assert "Cliente" in result.cypher
    print("✓ test_update_singularized PASSED")


def test_delete_singularized():
    """Test: DELETE usa nombre de tabla singularizado."""
    service = TranslationService()
    sql = "DELETE FROM Clientes WHERE ClienteID = 5"
    result = service.translate(TranslationRequestDTO(sql=sql))
    assert "MATCH (c:Cliente)" in result.cypher
    assert "DETACH DELETE c" in result.cypher
    print("✓ test_delete_singularized PASSED")


def test_single_statement_not_batch():
    """Test: una sola sentencia no se marca como BATCH."""
    service = TranslationService()
    sql = "SELECT * FROM users WHERE active = 1"
    result = service.translate(TranslationRequestDTO(sql=sql))
    assert result.statement_type == StatementType.SELECT
    assert "//" not in result.cypher  # No debería tener comentarios de batch
    print("✓ test_single_statement_not_batch PASSED")


if __name__ == "__main__":
    print("=== Running Translation Tests ===\n")
    test_batch_translation()
    test_insert_without_fk()
    test_insert_with_fk()
    test_select_join_topology()
    test_singularization()
    test_update_singularized()
    test_delete_singularized()
    test_single_statement_not_batch()
    print("\n=== All tests PASSED ===")
