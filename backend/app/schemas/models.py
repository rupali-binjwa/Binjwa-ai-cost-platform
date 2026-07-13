from pydantic import BaseModel

class AIModelCreate(BaseModel):
    model_name: str
    provider: str
    input_cost_per_1k: float
    output_cost_per_1k: float
    is_active: bool = True


class AIModelUpdate(BaseModel):
    model_name: str
    provider: str
    input_cost_per_1k: float
    output_cost_per_1k: float
    is_active: bool