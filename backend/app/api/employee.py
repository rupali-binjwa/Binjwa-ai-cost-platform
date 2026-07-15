from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate
)

from app.database.collections import (
    organizations_collection,
    client_admins_collection,
    employees_collection
)
from app.core.security import hash_password
from app.api.dependencies import get_current_client_admin, get_current_employee

router = APIRouter(
    prefix="/employee",
    tags=["Employee"]
)


@router.post("/create", dependencies=[Depends(get_current_client_admin)])
def create_employee(data: EmployeeCreate):
    from app.database.collections import users_collection

    try:
        organization = organizations_collection.find_one(
            {"_id": ObjectId(data.organization_id)}
        )
    except Exception:
        organization = None

    if not organization:
        organization = organizations_collection.find_one({})
        if not organization:
            raise HTTPException(
                status_code=404,
                detail="Organization not found. Please create an organization first from Super Admin."
            )
    
    org_id = str(organization["_id"])

    client_admin = None
    try:
        client_admin = client_admins_collection.find_one(
            {"_id": ObjectId(data.client_admin_id)}
        )
    except Exception:
        pass

    if not client_admin:
        client_admin = client_admins_collection.find_one({"organization_id": org_id})
    if not client_admin:
        client_admin = users_collection.find_one({"_id": ObjectId(data.client_admin_id)}) if ObjectId.is_valid(data.client_admin_id) else None

    admin_id = str(client_admin["_id"]) if client_admin else data.client_admin_id

    existing = employees_collection.find_one(
        {"email": data.email}
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Employee email already exists"
        )

    employee = {
        "organization_id": org_id,
        "client_admin_id": admin_id,
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "password": hash_password(data.password),
        "role": "employee",
        "is_active": True
    }

    result = employees_collection.insert_one(employee)

    return {
        "message": "Employee Created Successfully",
        "employee_id": str(result.inserted_id)
    }
@router.get("/all", dependencies=[Depends(get_current_employee)])
def get_all_employees():

    employees = list(employees_collection.find())

    for employee in employees:
        employee["_id"] = str(employee["_id"])

    return {
        "total": len(employees),
        "employees": employees
    }
 
@router.get("/{employee_id}", dependencies=[Depends(get_current_employee)])
def get_employee(employee_id: str):

    employee = employees_collection.find_one(
        {"_id": ObjectId(employee_id)}
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employee["_id"] = str(employee["_id"])

    return employee
    
@router.put("/{employee_id}", dependencies=[Depends(get_current_client_admin)])
def update_employee(employee_id: str, data: EmployeeUpdate):

    employee = employees_collection.find_one(
        {"_id": ObjectId(employee_id)}
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employees_collection.update_one(
        {"_id": ObjectId(employee_id)},
        {
            "$set": {
                "name": data.name,
                "email": data.email,
                "phone": data.phone,
                "password": hash_password(data.password) if data.password else employee.get("password"),
                "is_active": data.is_active
            }
        }
    )

    return {
        "message": "Employee Updated Successfully"
    }
    
@router.delete("/{employee_id}", dependencies=[Depends(get_current_client_admin)])
def delete_employee(employee_id: str):

    employee = employees_collection.find_one(
        {"_id": ObjectId(employee_id)}
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employees_collection.delete_one(
        {"_id": ObjectId(employee_id)}
    )

    return {
        "message": "Employee Deleted Successfully"
    }