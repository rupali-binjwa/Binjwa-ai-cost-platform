from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from app.schemas.client_admin import (
    ClientAdminCreate,
    ClientAdminUpdate
)

from app.database.collections import (
    organizations_collection,
    client_admins_collection
)
from app.core.security import hash_password
from app.api.dependencies import get_current_super_admin, get_current_client_admin

router = APIRouter(
    prefix="/client-admin",
    tags=["Client Admin"]
)


# ==========================
# Create Client Admin
# ==========================

@router.post("/create", dependencies=[Depends(get_current_super_admin)])
def create_client_admin(data: ClientAdminCreate):

    organization = organizations_collection.find_one(
        {"_id": ObjectId(data.organization_id)}
    )

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found"
        )

    existing = client_admins_collection.find_one(
        {"email": data.email}
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    client_admin = {
        "organization_id": data.organization_id,
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "password": hash_password(data.password),
        "role": "client_admin",
        "is_active": True
    }

    result = client_admins_collection.insert_one(client_admin)

    return {
        "message": "Client Admin Created Successfully",
        "client_admin_id": str(result.inserted_id)
    }


# ==========================
# Get All Client Admins
# ==========================

@router.get("/all", dependencies=[Depends(get_current_super_admin)])
def get_all_client_admins():

    client_admins = list(client_admins_collection.find())

    for admin in client_admins:
        admin["_id"] = str(admin["_id"])

    return {
        "total": len(client_admins),
        "client_admins": client_admins
    }


from pydantic import BaseModel
from typing import Optional

class PlanRequest(BaseModel):
    plan_name: str
    plan_price: float
    custom_platforms: Optional[list] = None

@router.post("/request-plan")
def request_plan(data: PlanRequest, current_user: dict = Depends(get_current_client_admin)):
    from app.database.collections import plan_requests_collection, organizations_collection
    from datetime import datetime
    
    print(f"DEBUG request_plan: current_user={current_user}")
    
    org_id = current_user.get("organization_id")
    if not org_id:
        if current_user.get("role") == "super_admin":
            org_id = "000000000000000000000000"
            company_name = "Super Admin Test Org"
        else:
            raise HTTPException(status_code=400, detail="User does not belong to an organization")
    else:
        org = organizations_collection.find_one({"_id": ObjectId(org_id)})
        company_name = org.get("company_name", "Unknown") if org else "Unknown"

    request_doc = {
        "organization_id": str(org_id),
        "company_name": company_name,
        "requested_by": current_user["email"],
        "plan_name": data.plan_name,
        "plan_price": data.plan_price,
        "custom_platforms": data.custom_platforms,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    plan_requests_collection.insert_one(request_doc)
    return {"message": "Plan request submitted successfully"}

@router.get("/my-plan-request")
def get_my_plan_request(current_user: dict = Depends(get_current_client_admin)):
    from app.database.collections import plan_requests_collection
    org_id = current_user.get("organization_id")
    # Get the most recent pending request
    req = plan_requests_collection.find_one(
        {"organization_id": org_id, "status": "pending"},
        sort=[("created_at", -1)]
    )
    if not req:
        return {"status": "none"}
    return {"status": "pending", "plan_name": req["plan_name"]}


@router.get("/dashboard")
def get_dashboard(current_user: dict = Depends(get_current_client_admin)):
    try:
        from app.database.collections import organizations_collection, client_admins_collection
        from fastapi.encoders import jsonable_encoder
        from bson import ObjectId
        
        org_id = current_user.get("organization_id")
        if not org_id:
            if current_user.get("role") == "super_admin":
                org_id = "000000000000000000000000"
            else:
                raise HTTPException(status_code=400, detail="No organization assigned to this admin")
            
        if org_id == "000000000000000000000000":
            org = {"_id": org_id, "company_name": "Super Admin Test Org", "available_tokens": 0, "total_tokens": 0}
        else:
            org = organizations_collection.find_one({"_id": ObjectId(org_id)})
            if not org:
                raise HTTPException(status_code=404, detail="Organization not found")
            
        # Find all admins for this org
        admins = list(client_admins_collection.find({"organization_id": org_id}, {"password": 0}))
        
        # Manually convert ObjectIds to strings to avoid serialization issues
        if org and "_id" in org:
            org["_id"] = str(org["_id"])
        
        for a in admins:
            if "_id" in a:
                a["_id"] = str(a["_id"])
            if "organization_id" in a and isinstance(a["organization_id"], ObjectId):
                a["organization_id"] = str(a["organization_id"])
                
        return jsonable_encoder({
            "organization": org,
            "admins": admins,
            "available_tokens": org.get("available_tokens", 0),
            "total_tokens": org.get("total_tokens", 0)
        })
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"{str(e)} - {traceback.format_exc()}")


# ==========================
# Get Client Admin By ID
# ==========================

@router.get("/{client_admin_id}", dependencies=[Depends(get_current_super_admin)])
def get_client_admin(client_admin_id: str):

    client_admin = client_admins_collection.find_one(
        {"_id": ObjectId(client_admin_id)}
    )

    if not client_admin:
        raise HTTPException(
            status_code=404,
            detail="Client Admin not found"
        )

    client_admin["_id"] = str(client_admin["_id"])

    return client_admin


# ==========================
# Update Client Admin
# ==========================

@router.put("/{client_admin_id}", dependencies=[Depends(get_current_super_admin)])
def update_client_admin(
    client_admin_id: str,
    data: ClientAdminUpdate
):

    client_admin = client_admins_collection.find_one(
        {"_id": ObjectId(client_admin_id)}
    )

    if not client_admin:
        raise HTTPException(
            status_code=404,
            detail="Client Admin not found"
        )

    client_admins_collection.update_one(
        {"_id": ObjectId(client_admin_id)},
        {
            "$set": {
                "name": data.name,
                "email": data.email,
                "phone": data.phone,
                "password": hash_password(data.password) if data.password else client_admin.get("password"),
                "is_active": data.is_active
            }
        }
    )

    return {
        "message": "Client Admin Updated Successfully"
    }

@router.delete("/{client_admin_id}", dependencies=[Depends(get_current_super_admin)])
def delete_client_admin(client_admin_id: str):

    client_admin = client_admins_collection.find_one(
        {"_id": ObjectId(client_admin_id)}
    )

    if not client_admin:
        raise HTTPException(
            status_code=404,
            detail="Client Admin not found"
        )

    client_admins_collection.delete_one(
        {"_id": ObjectId(client_admin_id)}
    )

    return {
        "message": "Client Admin Deleted Successfully"
    }

from pydantic import BaseModel

class PlanRequest(BaseModel):
    plan_name: str
    plan_price: float

