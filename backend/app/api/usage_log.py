from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime

from app.schemas.usage_log import UsageLogCreate, UsageLogUpdate
from app.database.collections import (
    usage_logs_collection,
    organizations_collection,
    employees_collection,
    ai_models_collection
)

router = APIRouter(
    prefix="/usage-logs",
    tags=["Usage Logs"]
)

# ==========================
# Create Usage Log
# ==========================
@router.post("/create")
def create_usage_log(data: UsageLogCreate):
    
    organization = organizations_collection.find_one({"_id": ObjectId(data.organization_id)})
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    employee = employees_collection.find_one({"_id": ObjectId(data.employee_id)})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    model = ai_models_collection.find_one({"_id": ObjectId(data.model_id)})
    if not model:
        raise HTTPException(status_code=404, detail="AI Model not found")

    usage_log = {
        "organization_id": data.organization_id,
        "employee_id": data.employee_id,
        "model_id": data.model_id,
        "input_tokens": data.input_tokens,
        "output_tokens": data.output_tokens,
        "total_tokens": data.total_tokens,
        "total_cost": data.total_cost,
        "date_and_time": datetime.utcnow()
    }

    result = usage_logs_collection.insert_one(usage_log)

    return {
        "message": "Usage Log Created Successfully",
        "usage_log_id": str(result.inserted_id)
    }

# ==========================
# Get All Usage Logs
# ==========================
@router.get("/all")
def get_all_usage_logs():
    usage_logs = list(usage_logs_collection.find())
    for log in usage_logs:
        log["_id"] = str(log["_id"])
    return {
        "total": len(usage_logs),
        "usage_logs": usage_logs
    }

# ==========================
# Get Usage Log By ID
# ==========================
@router.get("/{log_id}")
def get_usage_log(log_id: str):
    log = usage_logs_collection.find_one({"_id": ObjectId(log_id)})
    if not log:
        raise HTTPException(status_code=404, detail="Usage Log not found")
    log["_id"] = str(log["_id"])
    return log

# ==========================
# Update Usage Log
# ==========================
@router.put("/{log_id}")
def update_usage_log(log_id: str, data: UsageLogUpdate):
    log = usage_logs_collection.find_one({"_id": ObjectId(log_id)})
    if not log:
        raise HTTPException(status_code=404, detail="Usage Log not found")

    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    if not update_data:
         return {"message": "No data provided to update"}

    usage_logs_collection.update_one(
        {"_id": ObjectId(log_id)},
        {"$set": update_data}
    )

    return {"message": "Usage Log Updated Successfully"}

# ==========================
# Delete Usage Log
# ==========================
@router.delete("/{log_id}")
def delete_usage_log(log_id: str):
    result = usage_logs_collection.delete_one({"_id": ObjectId(log_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usage Log not found")

    return {"message": "Usage Log Deleted Successfully"}
