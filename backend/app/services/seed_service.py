from app.database.collections import users_collection
from app.core.security import hash_password


def create_super_admin():

    existing_admin = users_collection.find_one(
        {"role": "super_admin"}
    )

    if existing_admin:
        print("✅ Super Admin already exists.")
        return

    super_admin = {
        "name": "Binjwa Super Admin",
        "email": "admin@binjwa.com",
        "password": hash_password("Admin@123"),
        "role": "super_admin",
        "organization_id": None,
        "is_active": True
    }

    users_collection.insert_one(super_admin)

    print("✅ Super Admin Created Successfully.")