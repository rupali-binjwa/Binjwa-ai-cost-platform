from pymongo import MongoClient

def run():
    client = MongoClient("mongodb://localhost:27017")
    db = client["binjwa_ai_cost"]
    
    models = list(db.ai_models.find())
    print(f"Count: {len(models)}")
    for m in models:
        print(m.get("model_name"))

if __name__ == "__main__":
    run()
