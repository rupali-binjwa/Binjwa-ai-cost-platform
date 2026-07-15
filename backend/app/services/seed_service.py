from app.database.collections import (
    users_collection,
    ai_models_collection,
    organizations_collection,
    client_admins_collection,
    employees_collection,
    tokens_collection,
    usage_logs_collection
)
from app.core.security import hash_password
from datetime import datetime
from bson import ObjectId

def create_super_admin():
    # 1. Ensure Super Admin exists with valid password
    hashed_pwd = hash_password("Admin@123")
    
    super_admin = users_collection.find_one({"email": "admin@binjwa.com"})
    if not super_admin:
        users_collection.insert_one({
            "name": "Binjwa Super Admin",
            "email": "admin@binjwa.com",
            "password": hashed_pwd,
            "role": "super_admin",
            "organization_id": None,
            "is_active": True
        })
        print("✅ Super Admin Created Successfully.")
    else:
        users_collection.update_one(
            {"email": "admin@binjwa.com"},
            {"$set": {"password": hashed_pwd, "is_active": True, "role": "super_admin"}}
        )
        print("✅ Super Admin password ensured as Admin@123.")

    # 2. Seed Default AI Models if empty
    if ai_models_collection.count_documents({}) == 0:
        default_models = [
            {
                "model_name": "GPT-4o (OpenAI)",
                "provider": "OpenAI",
                "input_cost_per_1k": 0.005,
                "output_cost_per_1k": 0.015,
                "is_active": True
            },
            {
                "model_name": "Claude 3.5 Sonnet",
                "provider": "Anthropic",
                "input_cost_per_1k": 0.003,
                "output_cost_per_1k": 0.015,
                "is_active": True
            },
            {
                "model_name": "Claude 3 Haiku",
                "provider": "Anthropic",
                "input_cost_per_1k": 0.00025,
                "output_cost_per_1k": 0.00125,
                "is_active": True
            },
            {
                "model_name": "ElevenLabs Voice AI Agent",
                "provider": "ElevenLabs",
                "input_cost_per_1k": 0.008,
                "output_cost_per_1k": 0.024,
                "is_active": True
            },
            {
                "model_name": "Llama 3 70B (OpenRouter)",
                "provider": "Meta / OpenRouter",
                "input_cost_per_1k": 0.0007,
                "output_cost_per_1k": 0.0008,
                "is_active": True
            }
        ]
        ai_models_collection.insert_many(default_models)
        print("✅ Seeded Default AI Models.")

    # 3. Ensure Sample Organization exists
    org = organizations_collection.find_one({"company_email": "contact@acmecorp.com"})
    if not org:
        org_data = {
            "company_name": "Acme Voice & Chatbot Corp",
            "company_email": "contact@acmecorp.com",
            "company_phone": "+91 9876543210",
            "address": "Tech Park, Indore",
            "total_tokens": 5000000,
            "available_tokens": 3800000,
            "status": True
        }
        org_result = organizations_collection.insert_one(org_data)
        org_id = str(org_result.inserted_id)
    else:
        org_id = str(org["_id"])

    # 4. Ensure Client Admin exists with valid password
    client_admin = client_admins_collection.find_one({"email": "clientadmin@binjwa.com"})
    if not client_admin:
        ca_result = client_admins_collection.insert_one({
            "organization_id": org_id,
            "name": "Acme Client Admin",
            "email": "clientadmin@binjwa.com",
            "phone": "+91 9876543211",
            "password": hashed_pwd,
            "role": "client_admin",
            "is_active": True
        })
        ca_id = str(ca_result.inserted_id)
        print("✅ Client Admin Created Successfully.")
    else:
        client_admins_collection.update_one(
            {"email": "clientadmin@binjwa.com"},
            {"$set": {"password": hashed_pwd, "organization_id": org_id, "is_active": True, "role": "client_admin"}}
        )
        ca_id = str(client_admin["_id"])
        print("✅ Client Admin password ensured as Admin@123.")

    # 5. Ensure Employee exists with valid password
    employee = employees_collection.find_one({"email": "employee@binjwa.com"})
    if not employee:
        emp_result = employees_collection.insert_one({
            "organization_id": org_id,
            "client_admin_id": ca_id,
            "name": "Rahul Sharma (AI Agent Engineer)",
            "email": "employee@binjwa.com",
            "phone": "+91 9876543212",
            "password": hashed_pwd,
            "role": "employee",
            "is_active": True
        })
        emp_id = str(emp_result.inserted_id)
        print("✅ Employee Created Successfully.")
    else:
        employees_collection.update_one(
            {"email": "employee@binjwa.com"},
            {"$set": {"password": hashed_pwd, "organization_id": org_id, "is_active": True, "role": "employee"}}
        )
        emp_id = str(employee["_id"])
        print("✅ Employee password ensured as Admin@123.")

    # Create some sample usage logs if none exist for this organization
    if usage_logs_collection.count_documents({"organization_id": org_id}) == 0:
        models = list(ai_models_collection.find())
        if models:
            sample_logs = [
                {
                    "organization_id": org_id,
                    "employee_id": emp_id,
                    "model_id": str(models[3]["_id"]) if len(models) > 3 else str(models[0]["_id"]),
                    "task_type": "Voice Calling Agent - Customer Support Session",
                    "input_tokens": 1200,
                    "output_tokens": 450,
                    "total_tokens": 1650,
                    "total_cost": 0.0204,
                    "date_and_time": datetime.utcnow()
                },
                {
                    "organization_id": org_id,
                    "employee_id": emp_id,
                    "model_id": str(models[0]["_id"]),
                    "task_type": "LangChain Lead Qualification Chatbot Webhook",
                    "input_tokens": 850,
                    "output_tokens": 320,
                    "total_tokens": 1170,
                    "total_cost": 0.00905,
                    "date_and_time": datetime.utcnow()
                },
                {
                    "organization_id": org_id,
                    "employee_id": emp_id,
                    "model_id": str(models[1]["_id"]) if len(models) > 1 else str(models[0]["_id"]),
                    "task_type": "Automated Document Extraction API",
                    "input_tokens": 2400,
                    "output_tokens": 600,
                    "total_tokens": 3000,
                    "total_cost": 0.0162,
                    "date_and_time": datetime.utcnow()
                }
            ]
            usage_logs_collection.insert_many(sample_logs)

    print("✅ Seeded Sample Organization, Client Admin, Employee, and Integration Telemetry.")