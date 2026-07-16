# Placeholder
from pydantic import BaseModel, EmailStr

class EmployeeCreate(BaseModel):
    organization_id: str
    client_admin_id: str
    name: str
    email: EmailStr
    phone: str
    password: str
    allocated_tokens: float = 0.0


class EmployeeUpdate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    is_active: bool

