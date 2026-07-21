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

    if data.allocated_tokens > 0:
        if organization.get("available_tokens", 0) < data.allocated_tokens:
            raise HTTPException(
                status_code=400,
                detail="Organization does not have enough available tokens for this allocation."
            )
        organizations_collection.update_one(
            {"_id": ObjectId(org_id)},
            {"$inc": {"available_tokens": -data.allocated_tokens}}
        )

    employee = {
        "organization_id": org_id,
        "client_admin_id": admin_id,
        "name": data.name,
        "email": data.email.strip().lower(),
        "phone": data.phone,
        "password": hash_password(data.password),
        "role": "employee",
        "allocated_tokens": data.allocated_tokens,
        "available_tokens": data.allocated_tokens,
        "is_active": True
    }

    result = employees_collection.insert_one(employee)

    return {
        "message": "Employee Created Successfully",
        "employee_id": str(result.inserted_id)
    }
@router.get("/all")
def get_all_employees(current_user: dict = Depends(get_current_employee)):
    if current_user.get("role") == "super_admin":
        employees = list(employees_collection.find())
    else:
        org_id = current_user.get("organization_id")
        employees = list(employees_collection.find({"organization_id": org_id}))

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
        
    org_id = employee.get("organization_id")

    # Handle token addition
    if data.add_tokens and data.add_tokens > 0 and data.platform:
        organization = organizations_collection.find_one({"_id": ObjectId(org_id)})
        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")
            
        platform = data.platform
        platform_balances = organization.get("platform_balances", {})
        
        if platform_balances.get(platform, 0) < data.add_tokens:
            raise HTTPException(
                status_code=400,
                detail=f"Organization does not have enough available tokens for platform {platform}."
            )
            
        # Convert dollar budget (add_tokens) into raw tokens based on platform cost
        from app.database.mongodb import db
        model = None
        for m in db["ai_models"].find():
            m_prov = m.get("provider", "")
            if platform.lower() in m_prov.lower() or platform.split(' ')[0].lower() in m_prov.lower():
                model = m
                break
                
        tokens_to_add = data.add_tokens
        if model:
            input_cost = model.get("input_cost_per_1k", 0)
            output_cost = model.get("output_cost_per_1k", 0)
            avg_cost_per_token = ((input_cost + output_cost) / 2) / 1000.0
            if avg_cost_per_token > 0:
                tokens_to_add = int(data.add_tokens / avg_cost_per_token)
        else:
            # Fallback for unknown platforms: assume 1 dollar = 100,000 tokens
            tokens_to_add = int(data.add_tokens * 100000)

        # Deduct from organization platform balance
        organizations_collection.update_one(
            {"_id": ObjectId(org_id)},
            {"$inc": {f"platform_balances.{platform}": -data.add_tokens}}
        )
        
        # Add actual RAW TOKENS to employee platform allocations
        employees_collection.update_one(
            {"_id": ObjectId(employee_id)},
            {"$inc": {
                f"platform_allocations.{platform}.available": tokens_to_add,
                f"platform_allocations.{platform}.allocated": tokens_to_add
            }}
        )

    # Handle other fields
    update_data = {}
    if data.name is not None: update_data["name"] = data.name
    if data.email is not None: update_data["email"] = data.email
    if data.phone is not None: update_data["phone"] = data.phone
    if data.password is not None: update_data["password"] = hash_password(data.password)
    if data.is_active is not None: update_data["is_active"] = data.is_active

    if update_data:
        employees_collection.update_one(
            {"_id": ObjectId(employee_id)},
            {"$set": update_data}
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