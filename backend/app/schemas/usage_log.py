from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UsageLogCreate(BaseModel):
    organization_id: str
    employee_id: str
    model_id: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    total_cost: float

class UsageLogUpdate(BaseModel):
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    total_cost: Optional[float] = None
