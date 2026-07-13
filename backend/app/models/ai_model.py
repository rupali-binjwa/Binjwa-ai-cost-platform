from pydantic import BaseModel


class AIModelCreate(BaseModel):
    provider: str
    model_name: str
    input_cost: float
    output_cost: float