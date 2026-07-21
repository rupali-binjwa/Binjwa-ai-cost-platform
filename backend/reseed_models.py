import sys
import os
sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.services.seed_service import create_super_admin
from app.database.collections import ai_models_collection

def run():
    print(f"Models count before: {ai_models_collection.count_documents({})}")
    ai_models_collection.delete_many({})
    print(f"Models count after delete: {ai_models_collection.count_documents({})}")
    create_super_admin()
    print(f"Models count after seed: {ai_models_collection.count_documents({})}")

if __name__ == "__main__":
    run()
