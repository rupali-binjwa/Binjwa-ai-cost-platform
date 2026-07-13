from fastapi import APIRouter, HTTPException

from app.schemas.auth import LoginRequest
from app.database.collections import users_collection
from app.core.security import verify_password, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/login")
def login(user: LoginRequest):

    db_user = users_collection.find_one(
        {"email": user.email}
    )

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not verify_password(
        user.password,
        db_user["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )

    token = create_access_token({
        "email": db_user["email"],
        "role": db_user["role"]
    })

    return {
        "message": "Login Successful",
        "access_token": token,
        "role": db_user["role"]
    }