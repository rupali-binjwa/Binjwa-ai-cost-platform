# Placeholder
from pydantic import BaseModel

class TokenCreate(BaseModel):
    model_id: str
    organization_id: str
    total_tokens: int
    used_tokens: int = 0
    remaining_tokens: int

class TokenUpdate(BaseModel):
    total_tokens: int
    used_tokens: int
    remaining_tokens: int
    is_active: bool