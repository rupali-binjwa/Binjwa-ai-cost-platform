from pydantic import BaseModel, EmailStr
from typing import Optional

class OrganizationCreate(BaseModel):
    company_name: str
    company_email: EmailStr
    company_phone: str
    address: str
