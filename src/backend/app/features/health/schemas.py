from typing import Literal

from app.core.schemas import ApiSchema


class HealthRead(ApiSchema):
    status: Literal["ok"]
