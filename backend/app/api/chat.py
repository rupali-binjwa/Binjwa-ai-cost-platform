from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from bson import ObjectId
import os
import requests
from datetime import datetime

from app.database.collections import (
    ai_models_collection,
    employees_collection,
    organizations_collection,
    usage_logs_collection,
    client_admins_collection,
    users_collection
)
from app.api.dependencies import get_current_user

router = APIRouter(
    prefix="/chat",
    tags=["Chat Integration"]
)

class ChatRequest(BaseModel):
    messages: List[Dict[str, Any]]
    model_id: str
    organization_id: str
    employee_id: str

# Helper mapping for OpenRouter model strings in case DB has display names
MODEL_MAPPING = {
    "GPT-4o": "openai/gpt-4o",
    "GPT-4o Mini": "openai/gpt-4o-mini",
    "Gemini 1.5 Pro": "google/gemini-1.5-pro",
    "Gemini 1.5 Flash": "google/gemini-1.5-flash",
    "Llama 3 70B": "meta-llama/llama-3.1-70b-instruct",
    "Llama 3 8B": "meta-llama/llama-3.1-8b-instruct"
}

@router.post("/completions", dependencies=[Depends(get_current_user)])
def chat_completions(req: ChatRequest):
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_api_key or openrouter_api_key == "your_openrouter_api_key":
        # Fallback to a mock response if no real API key is set to avoid breaking
        # but we will calculate fake tokens to still test the flow.
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is not set or invalid in .env")

    # 1. Fetch Model Details
    try:
        model_data = ai_models_collection.find_one({"_id": ObjectId(req.model_id)})
    except Exception:
        model_data = None

    if not model_data:
        model_data = ai_models_collection.find_one({}) # Fallback to first
    
    if not model_data:
        raise HTTPException(status_code=404, detail="AI Model not found.")

    model_display_name = model_data.get("model_name", "GPT-4o")
    # Resolve exact OpenRouter ID
    or_model_id = MODEL_MAPPING.get(model_display_name, "openai/gpt-4o")

    # 2. Check Employee Token Limit
    org_id = req.organization_id
    emp_id = req.employee_id
    
    # Try fetching exact employee
    try:
        employee = employees_collection.find_one({"_id": ObjectId(emp_id)})
    except Exception:
        employee = None
        
    if not employee:
        employee = employees_collection.find_one({"organization_id": org_id}) or client_admins_collection.find_one({"organization_id": org_id}) or users_collection.find_one({})

    dynamic_max_tokens = 1000
    if employee and "platform_allocations" in employee:
        platform_provider = model_data.get("provider", "")
        allocations = employee.get("platform_allocations", {})
        platform_alloc = allocations.get(platform_provider)
        
        if not platform_alloc:
            # Fuzzy match
            for key, alloc in allocations.items():
                if platform_provider.lower() in key.lower() or key.split(' ')[0].lower() in platform_provider.lower():
                    platform_alloc = alloc
                    break
                    
        if not platform_alloc:
            platform_alloc = {}
            
        available_tokens = platform_alloc.get("available", 0)
        
        if available_tokens < 200:
            raise HTTPException(status_code=403, detail=f"Token limit exhausted for {platform_provider}. You have less than 200 tokens remaining, which is insufficient to generate a response.")
            
        dynamic_max_tokens = min(1000, max(10, int(available_tokens - 100)))

    # 3. Call OpenRouter API
    headers = {
        "Authorization": f"Bearer {openrouter_api_key}",
        "HTTP-Referer": "http://localhost:5173", # Optional for OpenRouter
        "X-Title": "Binjwa AI Cost Platform", # Optional for OpenRouter
        "Content-Type": "application/json"
    }

    formatted_messages = [{"role": "system", "content": f"You are a helpful enterprise AI assistant. IMPORTANT: You have a strict output limit of {dynamic_max_tokens} tokens. You must completely finish your thought and keep your response extremely concise so it does not get cut off."}]
    
    # Add all historical messages. Map 'bot' to 'assistant' for OpenRouter
    for msg in req.messages:
        role = "assistant" if msg.get("role") == "bot" else msg.get("role", "user")
        formatted_messages.append({"role": role, "content": msg.get("content", "")})

    payload = {
        "model": or_model_id,
        "messages": formatted_messages,
        "max_tokens": dynamic_max_tokens # Capped dynamically to prevent exceeding budget
    }

    try:
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        resp_data = response.json()
    except requests.exceptions.RequestException as e:
        err_msg = str(e)
        if response is not None and response.text:
            err_msg += f" - {response.text}"
        raise HTTPException(status_code=502, detail=f"Failed to communicate with OpenRouter API: {err_msg}")

    # 4. Extract exact token usage
    usage = resp_data.get("usage", {})
    prompt_tokens = usage.get("prompt_tokens", 0)
    completion_tokens = usage.get("completion_tokens", 0)
    total_tokens = usage.get("total_tokens", 0)
    
    ai_message = resp_data.get("choices", [{}])[0].get("message", {}).get("content", "No response generated.")

    # 5. Calculate exact cost
    input_cost_rate = model_data.get("input_cost_per_1k", 0) / 1000.0
    output_cost_rate = model_data.get("output_cost_per_1k", 0) / 1000.0
    
    exact_cost = (prompt_tokens * input_cost_rate) + (completion_tokens * output_cost_rate)

    # 6. Log and Deduct Tokens

    if employee:
        emp_id_str = str(employee["_id"])
        org_id_str = str(employee.get("organization_id", org_id))
        
        # Deduct if allocation exists
        platform_provider = model_data.get("provider", "")
        if "platform_allocations" in employee:
            allocations = employee.get("platform_allocations", {})
            platform_alloc_key = None
            
            if platform_provider in allocations:
                platform_alloc_key = platform_provider
            else:
                for key in allocations.keys():
                    if platform_provider.lower() in key.lower() or key.split(' ')[0].lower() in platform_provider.lower():
                        platform_alloc_key = key
                        break
                        
            if platform_alloc_key:
                employees_collection.update_one(
                    {"_id": ObjectId(emp_id_str)},
                    {"$inc": {f"platform_allocations.{platform_alloc_key}.available": -total_tokens}}
                )
                # Ensure balance never displays as negative
                updated_emp = employees_collection.find_one({"_id": ObjectId(emp_id_str)})
                if updated_emp and updated_emp.get("platform_allocations", {}).get(platform_alloc_key, {}).get("available", 0) < 0:
                    employees_collection.update_one(
                        {"_id": ObjectId(emp_id_str)},
                        {"$set": {f"platform_allocations.{platform_alloc_key}.available": 0}}
                    )
            
        # Log to usage_logs
        usage_log = {
            "organization_id": org_id_str,
            "employee_id": emp_id_str,
            "model_id": str(model_data["_id"]),
            "task_type": "Live Chat / API Execution",
            "input_tokens": prompt_tokens,
            "output_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "total_cost": round(exact_cost, 6),
            "date_and_time": datetime.utcnow()
        }
        usage_logs_collection.insert_one(usage_log)
        
        # Deduct Cost from Organization's Platform Balance
        if exact_cost > 0:
            org = organizations_collection.find_one({"_id": ObjectId(org_id_str)})
            if org and "platform_balances" in org:
                org_balances = org.get("platform_balances", {})
                org_platform_key = None
                
                if platform_provider in org_balances:
                    org_platform_key = platform_provider
                else:
                    for key in org_balances.keys():
                        if platform_provider.lower() in key.lower() or key.split(' ')[0].lower() in platform_provider.lower():
                            org_platform_key = key
                            break
                            
                if org_platform_key:
                    organizations_collection.update_one(
                        {"_id": ObjectId(org_id_str)},
                        {"$inc": {
                            f"platform_balances.{org_platform_key}": -exact_cost,
                            "available_tokens": -exact_cost
                        }}
                    )

    # 6. Return Data
    return {
        "reply": ai_message,
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "cost": round(exact_cost, 6)
        },
        "model_used": or_model_id
    }
