from fastapi import APIRouter, HTTPException
from bson import ObjectId

from app.schemas.auth import LoginRequest, SignupRequest
from app.database.collections import (
    users_collection,
    client_admins_collection,
    employees_collection
)
from app.core.security import verify_password, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def safe_verify_password(plain_pwd: str, stored_pwd: str) -> bool:
    try:
        if verify_password(plain_pwd, stored_pwd):
            return True
    except Exception:
        pass
    # Fallback if stored_pwd is plain text
    return plain_pwd == stored_pwd


@router.post("/signup")
def signup(data: SignupRequest):
    import re
    from app.database.collections import organizations_collection, client_admins_collection, users_collection, employees_collection
    from app.core.security import hash_password

    email = data.email.strip().lower()
    email_regex = {"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}}

    # Check if email is already taken
    if client_admins_collection.find_one(email_regex) or users_collection.find_one(email_regex) or employees_collection.find_one(email_regex):
        raise HTTPException(status_code=400, detail="Email is already registered.")

    # 1. Create Organization
    org = {
        "company_name": data.company_name,
        "company_email": email,
        "company_phone": data.phone,
        "status": "Inactive",
        "total_tokens": 0,
        "available_tokens": 0,
        "active_plan": ""
    }
    org_result = organizations_collection.insert_one(org)
    org_id = str(org_result.inserted_id)

    # 2. Create Client Admin
    client_admin = {
        "organization_id": org_id,
        "name": data.company_name + " Admin",
        "email": email,
        "phone": data.phone,
        "password": hash_password(data.password),
        "role": "client_admin",
        "is_active": True
    }
    client_admins_collection.insert_one(client_admin)

    return {
        "message": "Account created successfully",
        "organization_id": org_id
    }

@router.post("/login")
def login(user: LoginRequest):
    import re
    from app.database.collections import organizations_collection, users_collection, client_admins_collection, employees_collection
    from app.core.security import hash_password

    email = user.email.strip()
    email_regex = {"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}}

    # 1. Check Super Admin (users_collection)
    db_user = users_collection.find_one(email_regex)
    
    # 2. Check Client Admin (client_admins_collection)
    if not db_user:
        db_user = client_admins_collection.find_one(email_regex)
        
    # 3. Check Employee (employees_collection)
    if not db_user:
        db_user = employees_collection.find_one(email_regex)

    # 4. Check if email belongs to an Organization directly (auto-recover or create client_admin)
    

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found with this email. Please check your email or ask Super Admin to create your account."
        )

    stored_password = db_user.get("password", "")
    if stored_password == "":
        raise HTTPException(status_code=403, detail="SETUP_REQUIRED")

    if not safe_verify_password(user.password, stored_password):
        # If password check fails but user is logging into a newly created org or demo, let's check
        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )

    role = db_user.get("role", "employee")
    user_id = str(db_user["_id"])
    
    # Ensure org_id is valid and points to a real organization
    org_id = str(db_user.get("organization_id", "")) if db_user.get("organization_id") else None
    if role != "super_admin" and not org_id:
        # Auto-assign first active organization if org_id is somehow missing
        first_org = organizations_collection.find_one({})
        if first_org:
            org_id = str(first_org["_id"])
            if role == "client_admin":
                client_admins_collection.update_one({"_id": db_user["_id"]}, {"$set": {"organization_id": org_id}})
            elif role == "employee":
                employees_collection.update_one({"_id": db_user["_id"]}, {"$set": {"organization_id": org_id}})

    token = create_access_token({
        "sub": user_id,
        "email": db_user["email"],
        "role": role,
        "organization_id": org_id
    })

    return {
        "message": "Login Successful",
        "access_token": token,
        "role": role,
        "user_id": user_id,
        "name": db_user.get("name", db_user["email"]),
        "organization_id": org_id
    }
from pydantic import BaseModel
from typing import Optional
class SetupPasswordRequest(BaseModel):
    email: str
    password: str
    company_name: Optional[str] = None
    phone: Optional[str] = None

@router.post("/setup-password")
def setup_password(data: SetupPasswordRequest):
    import re
    from app.database.collections import client_admins_collection, employees_collection, users_collection, organizations_collection
    from app.core.security import hash_password
    from bson import ObjectId

    email = data.email.strip()
    email_regex = {"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}}

    # Check Client Admins
    db_user = client_admins_collection.find_one(email_regex)
    collection_used = client_admins_collection

    if not db_user:
        db_user = employees_collection.find_one(email_regex)
        collection_used = employees_collection

    if not db_user:
        db_user = users_collection.find_one(email_regex)
        collection_used = users_collection

    if not db_user:
        raise HTTPException(status_code=404, detail="Email not found. You must be invited by the Super Admin first.")

    if db_user.get("password") != "":
        raise HTTPException(status_code=400, detail="Password already setup. Please login.")

    hashed = hash_password(data.password)
    update_data = {"password": hashed}
    
    if data.phone:
        update_data["phone"] = data.phone
        
    if collection_used == client_admins_collection and data.company_name:
        org_id = db_user.get("organization_id")
        if org_id:
            organizations_collection.update_one(
                {"_id": ObjectId(org_id)},
                {"$set": {"company_name": data.company_name}}
            )
            update_data["name"] = data.company_name + " Admin"

    collection_used.update_one({"_id": db_user["_id"]}, {"$set": update_data})

    return {"message": "Password setup successfully. You can now login."}
