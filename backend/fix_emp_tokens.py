import sys
sys.path.append('d:\\Token_Comparision\\Binjwa-ai-cost-platform\\backend')
from app.database.mongodb import db
from bson import ObjectId

for emp in db['employees'].find():
    if not emp.get("platform_allocations"): continue
    
    updated_allocations = {}
    for platform, data in emp["platform_allocations"].items():
        model = None
        for m in db["ai_models"].find():
            m_prov = m.get("provider", "")
            if platform.lower() in m_prov.lower() or platform.split(' ')[0].lower() in m_prov.lower():
                model = m
                break
                
        allocated_val = data.get("allocated", 0)
        available_val = data.get("available", 0)
        
        # If the value is suspicious (like under 50,000) it might be a dollar value
        if allocated_val < 50000 and allocated_val > 0:
            tokens_allocated = allocated_val
            tokens_available = available_val
            
            if model:
                input_cost = model.get("input_cost_per_1k", 0)
                output_cost = model.get("output_cost_per_1k", 0)
                avg_cost_per_token = ((input_cost + output_cost) / 2) / 1000.0
                if avg_cost_per_token > 0:
                    tokens_allocated = int(allocated_val / avg_cost_per_token)
                    tokens_available = int(available_val / avg_cost_per_token)
            else:
                tokens_allocated = int(allocated_val * 100000)
                tokens_available = int(available_val * 100000)
                
            updated_allocations[platform] = {
                "allocated": tokens_allocated,
                "available": tokens_available
            }
            
    if updated_allocations:
        db['employees'].update_one(
            {"_id": emp["_id"]},
            {"$set": {f"platform_allocations.{p}": v for p, v in updated_allocations.items()}}
        )
        print(f"Updated {emp['email']}")
