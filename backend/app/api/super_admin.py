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
        "total_tokens": 1000000,
        "available_tokens": 1000000,
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
        "password": hash_password("Admin@123"),
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