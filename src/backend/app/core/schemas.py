from dataclasses import dataclass
from typing import Any

from fastapi import Query
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

# re-exported so the experimental import lives in one place
from pydantic.experimental.missing_sentinel import MISSING as MISSING


class ApiSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        validate_by_alias=True,
        serialize_by_alias=True,
        from_attributes=True,
    )


class PatchSchema(ApiSchema):
    # fields default to MISSING, so omitted ones never reach changes
    def changes(self) -> dict[str, Any]:
        return self.model_dump(exclude_unset=True, by_alias=False)


class Page[T](ApiSchema):
    items: list[T]
    total: int


@dataclass
class Pagination:
    limit: int = Query(50, ge=1, le=100)
    offset: int = Query(0, ge=0)
