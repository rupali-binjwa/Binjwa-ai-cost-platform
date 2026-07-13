from fastapi import APIRouter, HTTPException
from bson import ObjectId

from app.schemas.token import (
    TokenCreate,
    TokenUpdate
)

from app.database.collections import (
    ai_models_collection,
    organizations_collection,
    tokens_collection
)

router = APIRouter(
    prefix="/tokens",
    tags=["Tokens"]
)


# Create Token
@router.post("/create")
def create_token(data: TokenCreate):

    model = ai_models_collection.find_one(
        {"_id": ObjectId(data.model_id)}
    )

    if not model:
        raise HTTPException(
            status_code=404,
            detail="Model not found"
        )

    organization = organizations_collection.find_one(
        {"_id": ObjectId(data.organization_id)}
    )

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found"
        )

    token = {
        "model_id": data.model_id,
        "organization_id": data.organization_id,
        "total_tokens": data.total_tokens,
        "used_tokens": data.used_tokens,
        "remaining_tokens": data.remaining_tokens,
        "is_active": True
    }

    result = tokens_collection.insert_one(token)

    return {
        "message": "Token Added Successfully",
        "token_id": str(result.inserted_id)
    }


# Get All Tokens
@router.get("/all")
def get_all_tokens():

    tokens = list(tokens_collection.find())

    for token in tokens:
        token["_id"] = str(token["_id"])

    return {
        "total": len(tokens),
        "tokens": tokens
    }


# Get Single Token
@router.get("/{token_id}")
def get_token(token_id: str):

    token = tokens_collection.find_one(
        {"_id": ObjectId(token_id)}
    )

    if not token:
        raise HTTPException(
            status_code=404,
            detail="Token not found"
        )

    token["_id"] = str(token["_id"])

    return token


# Update Token
@router.put("/{token_id}")
def update_token(
    token_id: str,
    data: TokenCreate
):

    result = tokens_collection.update_one(
        {"_id": ObjectId(token_id)},
        {
            "$set": {
                "model_id": data.model_id,
                "organization_id": data.organization_id,
                "total_tokens": data.total_tokens,
                "used_tokens": data.used_tokens,
                "remaining_tokens": data.remaining_tokens,
                "is_active": True
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Token not found"
        )

    return {
        "message": "Token Updated Successfully"
    }


# Delete Token
@router.delete("/{token_id}")
def delete_token(token_id: str):

    result = tokens_collection.delete_one(
        {"_id": ObjectId(token_id)}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Token not found"
        )

    return {
        "message": "Token Deleted Successfully"
    }