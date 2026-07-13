from pydantic import BaseModel
from typing import List

class RecommendationRequest(BaseModel):
    task_description: str
    estimated_input_characters: int
    expected_output_characters: int

class ModelRecommendation(BaseModel):
    model_id: str
    model_name: str
    provider: str
    predicted_input_tokens: int
    predicted_output_tokens: int
    predicted_total_tokens: int
    predicted_cost: float
    is_recommended: bool

class RecommendationResponse(BaseModel):
    recommendations: List[ModelRecommendation]
