# Placeholder
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from app.database.collections import organizations_collection, client_admins_collection
from app.core.security import hash_password
from app.schemas.organization import OrganizationCreate
from app.api.dependencies import get_current_super_admin, get_current_client_admin, get_current_user

router = APIRouter(
    prefix="/super-admin",
    tags=["Super Admin"]
)


@router.post("/organization", dependencies=[Depends(get_current_super_admin)])
def create_organization(data: OrganizationCreate):

    existing = organizations_collection.find_one(
        {"company_email": data.company_email}
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Organization already exists."
        )

    clean_email = data.company_email.strip()

    organization = {
        "company_name": data.company_name.strip(),
        "company_email": clean_email,
        "company_phone": data.company_phone,
        "address": data.address,
        "total_tokens": 0,
        "available_tokens": 0,
        "status": True
    }

    result = organizations_collection.insert_one(
        organization
    )
    org_id = str(result.inserted_id)

    # Automatically create the primary Client Admin account for this new organization
    client_admin = {
        "organization_id": org_id,
        "name": f"{data.company_name.strip()} Admin",
        "email": clean_email,
        "phone": data.company_phone,
        "password": "",
        "role": "client_admin",
        "is_active": True
    }
    client_admins_collection.insert_one(client_admin)

    return {
        "message": "Organization & Client Admin Created Successfully",
        "organization_id": org_id
    }


@router.get("/organizations", dependencies=[Depends(get_current_user)])
def get_all_organizations():

    organizations = []

    for org in organizations_collection.find():

        org["_id"] = str(org["_id"])

        organizations.append(org)

    return organizations  

@router.get("/organization/{organization_id}", dependencies=[Depends(get_current_user)])
def get_organization(organization_id: str):

    organization = organizations_collection.find_one(
        {"_id": ObjectId(organization_id)}
    )

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found"
        )

    organization["_id"] = str(organization["_id"])

    return organization 

@router.put("/organization/{organization_id}", dependencies=[Depends(get_current_super_admin)])
def update_organization(
    organization_id: str,
    data: OrganizationCreate
):

    result = organizations_collection.update_one(
        {"_id": ObjectId(organization_id)},
        {
            "$set": {
                "company_name": data.company_name,
                "company_email": data.company_email,
                "company_phone": data.company_phone,
                "address": data.address
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Organization not found"
        )

    return {
        "message": "Organization Updated Successfully"
    }   

@router.delete("/organization/{organization_id}", dependencies=[Depends(get_current_super_admin)])
def delete_organization(organization_id: str):

    result = organizations_collection.delete_one(
        {"_id": ObjectId(organization_id)}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Organization not found"
        )

    return {
        "message": "Organization Deleted Successfully"
    }
@router.get("/wallets", dependencies=[Depends(get_current_super_admin)])
def get_wallets():
    from app.database.collections import platform_wallets_collection
    wallets = list(platform_wallets_collection.find({}, {"_id": 0}))
    return wallets


@router.get("/plan-requests")
def get_plan_requests(current_user: dict = Depends(get_current_super_admin)):
    from app.database.collections import plan_requests_collection
    reqs = list(plan_requests_collection.find({"status": "pending"}).sort("created_at", -1))
    for r in reqs:
        r["_id"] = str(r["_id"])
        if "organization_id" in r:
            r["organization_id"] = str(r["organization_id"])
    return reqs

@router.post("/approve-plan/{request_id}")
def approve_plan(request_id: str, current_user: dict = Depends(get_current_super_admin)):
    from app.database.collections import plan_requests_collection, organizations_collection, platform_wallets_collection
    
    req = plan_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    org_id = req["organization_id"]
    price = req["plan_price"]
    
    current_org = organizations_collection.find_one({"_id": ObjectId(org_id)})
    
    custom_platforms = req.get("custom_platforms")
    platform_ratios = {}
    
    platform_map = {
        "Deepgram": "Deepgram (STT & TTS)",
        "Cartesia": "Cartesia (TTS)",
        "Vobiz Cloud": "Vobiz (Telecom)",
        "AssemblyAI": "AssemblyAI (STT)",
        "ElevenLabs": "ElevenLabs (TTS)",
        "Play.ht": "Play.ht (TTS)",
        "Murf": "Murf AI (TTS)",
        "Murf AI": "Murf AI (TTS)",
        "OpenRouter": "OpenRouter",
        "Groq": "Groq",
        "Google": "Google",
        "OpenAI": "OpenAI"
    }
    
    if custom_platforms and isinstance(custom_platforms, list) and len(custom_platforms) > 0:
        ratio_per_platform = 1.0 / len(custom_platforms)
        for p in custom_platforms:
            mapped_p = platform_map.get(p, p)
            # If multiple custom platforms map to the same base (unlikely but possible), accumulate ratio
            platform_ratios[mapped_p] = platform_ratios.get(mapped_p, 0) + ratio_per_platform
    else:
        plan_name_upper = req.get("plan_name", "").upper()
        if "ENTERPRISE" in plan_name_upper or "PRO" in plan_name_upper or "GROWTH" in plan_name_upper:
            platform_ratios = {
                "Groq": 0.30,
                "Cartesia (TTS)": 0.25,
                "Deepgram (STT & TTS)": 0.25,
                "Vobiz (Telecom)": 0.10,
                "OpenRouter": 0.10
            }
        elif "ESSENTIAL" in plan_name_upper:
            platform_ratios = {
                "Vobiz (Telecom)": 0.60,
                "OpenRouter": 0.40
            }
        else:
            platform_ratios = {
                "Vobiz (Telecom)": 1.0
            }

    # 1. Update Organization Budget and Active Plan
    inc_query = {"total_tokens": price, "available_tokens": price}
    for platform, ratio in platform_ratios.items():
        inc_query[f"platform_balances.{platform}"] = price * ratio

    current_plan_str = current_org.get("active_plan", "") if current_org else ""
    new_plan_str = req.get("plan_name", "Unknown Plan")

    set_query = {}
    
    # Append the new plan if it isn't already active
    if new_plan_str not in current_plan_str:
        if current_plan_str:
            set_query["active_plan"] = f"{current_plan_str}, {new_plan_str}"
        else:
            set_query["active_plan"] = new_plan_str

    update_query = {"$inc": inc_query}
    if set_query:
        update_query["$set"] = set_query

    organizations_collection.update_one(
        {"_id": ObjectId(org_id)},
        update_query
    )
    
    # 2. Mark request approved
    plan_requests_collection.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "approved"}}
    )
    
    target_wallets = list(platform_wallets_collection.find({"platform": {"$in": list(platform_ratios.keys())}}))
    if target_wallets:
        for w in target_wallets:
            ratio = platform_ratios.get(w["platform"], 0)
            deduction = price * ratio
            if deduction > 0:
                platform_wallets_collection.update_one(
                    {"_id": w["_id"]},
                    {"$inc": {"balance": -deduction}}
                )
        
    return {"message": "Plan approved and wallet funded!"}
