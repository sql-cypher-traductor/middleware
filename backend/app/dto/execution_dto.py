from typing import Literal
from uuid import UUID
from pydantic import BaseModel


class ExecutionRequestDTO(BaseModel):
    connection_id: UUID
    cypher_query: str


class ExportRequestDTO(ExecutionRequestDTO):
    format: Literal["json", "csv"] = "json"
