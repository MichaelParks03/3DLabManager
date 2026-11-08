from datetime import datetime

from pydantic import EmailStr, Field

from app.core.schemas import MISSING, ApiSchema, PatchSchema


class LoginRequest(ApiSchema):
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)


class AdminRead(ApiSchema):
    id: int
    email: str
    name: str
    is_active: bool
    created_at: datetime


class AdminCreate(ApiSchema):
    email: EmailStr = Field(max_length=254)
    name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=12, max_length=128)


class AdminUpdate(PatchSchema):
    name: str | MISSING = Field(MISSING, min_length=1, max_length=100)
    is_active: bool | MISSING = MISSING
