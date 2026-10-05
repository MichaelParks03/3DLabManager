from dataclasses import dataclass

from fastapi import Query
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        validate_by_alias=True,
        serialize_by_alias=True,
        from_attributes=True,
    )


class Page[T](ApiSchema):
    items: list[T]
    total: int


@dataclass
class Pagination:
    limit: int = Query(50, ge=1, le=100)
    offset: int = Query(0, ge=0)
