# Placeholder
from fastapi import APIRouter, HTTPException
from bson import ObjectId

from app.schemas.models import (
    AIModelCreate,
    AIModelUpdate
)

from app.database.collections import (
    ai_models_collection
)

router = APIRouter(
    prefix="/models",
    tags=["AI Models"]
)

@router.post("/create")
def create_model(data: AIModelCreate):

    existing = ai_models_collection.find_one(
        {"model_name": data.model_name}
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Model already exists"
        )

    model = {
        "model_name": data.model_name,
        "provider": data.provider,
        "input_cost_per_1k": data.input_cost_per_1k,
        "output_cost_per_1k": data.output_cost_per_1k,
        "is_active": data.is_active
    }

    result = ai_models_collection.insert_one(model)

    return {
        "message": "AI Model Created Successfully",
        "model_id": str(result.inserted_id)
    }