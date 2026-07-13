from fastapi import APIRouter, HTTPException
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

router = APIRouter(
    prefix="/employee",
    tags=["Employee"]
)


@router.post("/create")
def create_employee(data: EmployeeCreate):

    organization = organizations_collection.find_one(
        {"_id": ObjectId(data.organization_id)}
    )

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found"
        )

    client_admin = client_admins_collection.find_one(
        {"_id": ObjectId(data.client_admin_id)}
    )

    if not client_admin:
        raise HTTPException(
            status_code=404,
            detail="Client Admin not found"
        )

    existing = employees_collection.find_one(
        {"email": data.email}
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Employee email already exists"
        )

    employee = {
        "organization_id": data.organization_id,
        "client_admin_id": data.client_admin_id,
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "password": data.password,
        "role": "employee",
        "is_active": True
    }

    result = employees_collection.insert_one(employee)

    return {
        "message": "Employee Created Successfully",
        "employee_id": str(result.inserted_id)
    }
@router.get("/all")
def get_all_employees():

    employees = list(employees_collection.find())

    for employee in employees:
        employee["_id"] = str(employee["_id"])

    return {
        "total": len(employees),
        "employees": employees
    }
 
@router.get("/{employee_id}")
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
    
@router.put("/{employee_id}")
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
                "password": data.password,
                "is_active": data.is_active
            }
        }
    )

    return {
        "message": "Employee Updated Successfully"
    }
    
@router.delete("/{employee_id}")
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