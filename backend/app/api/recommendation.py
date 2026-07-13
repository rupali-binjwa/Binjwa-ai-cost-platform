from fastapi import APIRouter
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse, ModelRecommendation
from app.database.collections import ai_models_collection
import math

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"]
)

@router.post("/predict-cost", response_model=RecommendationResponse)
def predict_cost(data: RecommendationRequest):
    # Retrieve all active AI models
    models = list(ai_models_collection.find({"is_active": True}))
    
    if not models:
        return RecommendationResponse(recommendations=[])

    # Simple heuristic: 1 token is roughly 4 characters
    CHARS_PER_TOKEN = 4
    
    predicted_input_tokens = math.ceil(data.estimated_input_characters / CHARS_PER_TOKEN)
    predicted_output_tokens = math.ceil(data.expected_output_characters / CHARS_PER_TOKEN)
    predicted_total_tokens = predicted_input_tokens + predicted_output_tokens

    recommendations = []
    
    for model in models:
        # Calculate cost
        # cost fields are per 1k tokens, so divide by 1000
        input_cost = (predicted_input_tokens / 1000) * model.get("input_cost_per_1k", 0)
        output_cost = (predicted_output_tokens / 1000) * model.get("output_cost_per_1k", 0)
        total_cost = input_cost + output_cost
        
        recommendations.append(
            ModelRecommendation(
                model_id=str(model["_id"]),
                model_name=model.get("model_name", "Unknown"),
                provider=model.get("provider", "Unknown"),
                predicted_input_tokens=predicted_input_tokens,
                predicted_output_tokens=predicted_output_tokens,
                predicted_total_tokens=predicted_total_tokens,
                predicted_cost=total_cost,
                is_recommended=False
            )
        )
        
    # Sort by cost to find the cheapest (most recommended)
    recommendations.sort(key=lambda x: x.predicted_cost)
    
    # Mark the cheapest as recommended
    if recommendations:
        recommendations[0].is_recommended = True

    return RecommendationResponse(recommendations=recommendations)
