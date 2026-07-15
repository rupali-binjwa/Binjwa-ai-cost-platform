# Placeholder
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from app.schemas.models import (
    AIModelCreate,
    AIModelUpdate
)

from app.database.collections import (
    ai_models_collection
)
from app.api.dependencies import get_current_user, get_current_super_admin

router = APIRouter(
    prefix="/models",
    tags=["AI Models"]
)

@router.post("/create", dependencies=[Depends(get_current_super_admin)])
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


@router.get("/all", dependencies=[Depends(get_current_user)])
def get_all_models():
    models = list(ai_models_collection.find())
    for model in models:
        model["_id"] = str(model["_id"])
    return {
        "total": len(models),
        "models": models
    }