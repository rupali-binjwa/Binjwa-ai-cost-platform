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

class EvaluateVendorsRequest(BaseModel):
    monthly_interactions: int
    avg_duration_minutes: float
    comp_input_tokens: int
    comp_output_tokens: int

class LLMModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    input_cost: float
    output_cost: float
    latency: int
    context: str
    strength: str
    badge: str
    single_cost: float
    bulk_cost: float
    is_top: bool

class VendorInfo(BaseModel):
    name: str
    provider: str
    rate: float
    latency: int = 0
    uptime: str = ""
    accuracy: str = ""
    quality: str = ""
    badge: str = ""
    is_top: bool = False
    monthly_cost: float = 0.0

class EvaluateVendorsResponse(BaseModel):
    llm_models: List[LLMModelInfo]
    stt_vendors: List[VendorInfo]
    tts_vendors: List[VendorInfo]
    telecom_vendors: List[VendorInfo]
