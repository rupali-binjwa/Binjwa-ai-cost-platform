from fastapi import APIRouter, HTTPException
from bson import ObjectId

from app.schemas.client_admin import (
    ClientAdminCreate,
    ClientAdminUpdate
)

from app.database.collections import (
    organizations_collection,
    client_admins_collection
)

router = APIRouter(
    prefix="/client-admin",
    tags=["Client Admin"]
)


# ==========================
# Create Client Admin
# ==========================

@router.post("/create")
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
        "password": data.password,
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

@router.get("/all")
def get_all_client_admins():

    client_admins = list(client_admins_collection.find())

    for admin in client_admins:
        admin["_id"] = str(admin["_id"])

    return {
        "total": len(client_admins),
        "client_admins": client_admins
    }


# ==========================
# Get Client Admin By ID
# ==========================

@router.get("/{client_admin_id}")
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

@router.put("/{client_admin_id}")
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
                "password": data.password,
                "is_active": data.is_active
            }
        }
    )

    return {
        "message": "Client Admin Updated Successfully"
    }
@router.delete("/{client_admin_id}")
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