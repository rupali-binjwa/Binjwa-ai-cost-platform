# Placeholder
from fastapi import APIRouter, HTTPException
from bson import ObjectId

from app.database.collections import organizations_collection
from app.schemas.organization import OrganizationCreate

router = APIRouter(
    prefix="/super-admin",
    tags=["Super Admin"]
)


@router.post("/organization")
def create_organization(data: OrganizationCreate):

    existing = organizations_collection.find_one(
        {"company_email": data.company_email}
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Organization already exists."
        )

    organization = {
        "company_name": data.company_name,
        "company_email": data.company_email,
        "company_phone": data.company_phone,
        "address": data.address,
        "total_tokens": 0,
        "available_tokens": 0,
        "status": True
    }

    result = organizations_collection.insert_one(
        organization
    )

    return {
        "message": "Organization Created Successfully",
        "organization_id": str(result.inserted_id)
    }


@router.get("/organizations")
def get_all_organizations():

    organizations = []

    for org in organizations_collection.find():

        org["_id"] = str(org["_id"])

        organizations.append(org)

    return organizations  

@router.get("/organization/{organization_id}")
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

@router.put("/organization/{organization_id}")
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

@router.delete("/organization/{organization_id}")
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