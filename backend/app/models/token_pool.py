from pydantic import BaseModel


class TokenAllocation(BaseModel):
    organization_id: str
    employee_id: str
    model_name: str
    tokens: int