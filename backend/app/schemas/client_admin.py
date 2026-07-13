from pydantic import BaseModel, EmailStr


class ClientAdminCreate(BaseModel):
    organization_id: str
    name: str
    email: EmailStr
    phone: str
    password: str


class ClientAdminUpdate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    is_active: bool