# Binjwa AI Cost Platform

Binjwa AI Cost Platform is a robust backend system designed to manage, monitor, and optimize AI model token usage and costs across different organizations and employees.

## 🚀 Features
- **User Management**: Hierarchical role-based access control for Super Admins, Client Admins, and Employees.
- **AI Model Management**: Configure and track different AI models.
- **Token Management**: Allocate, update, and monitor token usage for organizations.
- **Cost Tracking**: Ensure optimized use of resources across platforms.

## 🛠️ Tech Stack
- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **Validation**: Pydantic
- **Server**: Uvicorn

## 📂 Project Structure
- `backend/`: Core FastAPI application and API routes.
- `frontend/`: (Upcoming) User Interface.
- `database/`: Database configuration and scripts.
- `docs/`: System architecture, API documentation, and flow diagrams.

## ⚙️ How to Run Locally
1. Navigate to the backend directory: `cd backend`
2. Activate the virtual environment: `.\venv\Scripts\activate` (Windows)
3. Install dependencies: `pip install -r requirements.txt`
4. Run the server: `uvicorn app.main:app --reload`
5. Visit API Docs: `http://localhost:8000/docs`
