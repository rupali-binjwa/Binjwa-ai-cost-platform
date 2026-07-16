from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from bson import ObjectId

from app.core.config import settings
from app.database.collections import users_collection, client_admins_collection, employees_collection

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        if user_id is None or email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Find the user in appropriate collection based on role
    db_user = None
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise credentials_exception

    if role == "super_admin":
        db_user = users_collection.find_one({"_id": obj_id})
    elif role == "client_admin":
        db_user = client_admins_collection.find_one({"_id": obj_id})
    elif role == "employee":
        db_user = employees_collection.find_one({"_id": obj_id})

    # Fallback check across all collections if not found directly by role
    if not db_user:
        db_user = users_collection.find_one({"_id": obj_id}) or \
                  client_admins_collection.find_one({"_id": obj_id}) or \
                  employees_collection.find_one({"_id": obj_id})

    # Secondary fallback check by email if _id lookup failed (e.g. after DB reseed or sync)
    if not db_user and email:
        import re
        email_regex = {"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}}
        db_user = users_collection.find_one(email_regex) or \
                  client_admins_collection.find_one(email_regex) or \
                  employees_collection.find_one(email_regex)

    if db_user is None:
        return fallback_user

    db_user["_id"] = str(db_user["_id"])
    return db_user


def get_current_super_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires Super Admin privileges"
        )
    return current_user


def get_current_client_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["super_admin", "client_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires Client Admin privileges"
        )
    return current_user


def get_current_employee(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["super_admin", "client_admin", "employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires active employee privileges"
        )
    return current_user
