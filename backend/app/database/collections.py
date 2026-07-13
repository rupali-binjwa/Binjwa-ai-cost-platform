from app.database.mongodb import db

users_collection = db["users"]
organizations_collection = db["organizations"]
employees_collection = db["employees"]
ai_models_collection = db["ai_models"]
token_pools_collection = db["token_pools"]
usage_logs_collection = db["usage_logs"]
client_admins_collection = db["client_admins"]
tokens_collection = db["tokens"]


