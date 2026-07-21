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

from typing import Optional

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    add_tokens: Optional[float] = None
    platform: Optional[str] = None

