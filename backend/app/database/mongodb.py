from pymongo import MongoClient
from app.core.config import settings

client = MongoClient(settings.MONGODB_URI)
db = client[settings.DATABASE_NAME]

# organizations_collection = db["organizations"]
# client_admin_collection = db["client_admins"]