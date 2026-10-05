from datetime import datetime

from pydantic import Field

from app.core.schemas import ApiSchema


class LoginRequest(ApiSchema):
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)


class AdminRead(ApiSchema):
    id: int
    email: str
    name: str
    is_active: bool
    created_at: datetime
