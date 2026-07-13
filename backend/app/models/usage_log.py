#from pydantic import BaseModel
from datetime import datetime


class UsageLog(BaseModel):
    user_id: str
    organization_id: str
    model_name: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    total_cost: float
    created_at: datetime = datetime.utcnow() Placeholder
