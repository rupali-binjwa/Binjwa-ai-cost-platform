from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.super_admin import router as super_admin_router
from app.api.client_admin import router as client_admin_router
from app.api.employee import router as employee_router
from app.api.models import router as models_router
from app.services.seed_service import create_super_admin
from app.api.token import router as token_router
from app.api.usage_log import router as usage_log_router
from app.api.recommendation import router as recommendation_router

app = FastAPI(
    title="Binjwa AI Cost Platform",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(super_admin_router)
app.include_router(client_admin_router)
app.include_router(employee_router)
app.include_router(models_router)
app.include_router(token_router)
app.include_router(usage_log_router)
app.include_router(recommendation_router)


# Startup Event
@app.on_event("startup")
def startup():
    create_super_admin()


# Home API
@app.get("/")
def home():
    return {
        "message": "Welcome to Binjwa AI Cost Platform 🚀"
    }


# Health API
@app.get("/health")
def health():
    return {
        "status": "Running Successfully"
    }