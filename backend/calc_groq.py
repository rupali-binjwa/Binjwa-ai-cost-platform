import sys
sys.path.append('d:\\Token_Comparision\\Binjwa-ai-cost-platform\\backend')
from app.database.mongodb import db

for model in db['ai_models'].find():
    if 'Groq' in model.get('provider', '') or 'llama' in model.get('name', '').lower():
        input_cost = model.get('input_cost_per_1k', 0)
        output_cost = model.get('output_cost_per_1k', 0)
        avg_cost_per_1k = (input_cost + output_cost) / 2
        avg_cost_per_token = avg_cost_per_1k / 1000
        
        print(f"Name: {model.get('name')}, Provider: {model.get('provider')}")
        print(f"Avg cost per 1k: ${avg_cost_per_1k:.5f}")
        
        if avg_cost_per_token > 0:
            tokens_per_1000_dollars = 1000 / avg_cost_per_token
            print(f"Tokens for $1000: {tokens_per_1000_dollars:,.0f}\n")
