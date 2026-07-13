from pydantic import BaseModel, EmailStr


class OrganizationCreate(BaseModel):
    company_name: str
    company_email: EmailStr
    company_phone: str
    address: str