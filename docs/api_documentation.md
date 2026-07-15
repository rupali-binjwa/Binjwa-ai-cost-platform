# API Documentation

This document provides an overview of the REST APIs available in the **Binjwa AI Cost Platform**.

Base URL: `/` (Default localhost: `http://localhost:8000`)
Interactive Docs: `/docs` (Swagger UI)

## 1. Authentication (`/auth`)
- **POST `/auth/login`**: Authenticates users (Super Admin, Client Admin, Employee) and returns a JWT token.

## 2. Super Admin (`/super-admin`)
- **POST `/super-admin/create`**: Create a new super admin.
- **GET `/super-admin/all`**: Get all super admins.

## 3. Client Admin (`/client-admin`)
- **POST `/client-admin/create`**: Create a new client admin organization.
- **GET `/client-admin/all`**: Retrieve a list of all client admins.
- **GET `/client-admin/{admin_id}`**: Get specific client admin details.
- **PUT `/client-admin/{admin_id}`**: Update client admin.
- **DELETE `/client-admin/{admin_id}`**: Remove client admin.

## 4. Employee (`/employee`)
- **POST `/employee/create`**: Add an employee to an organization.
- **GET `/employee/all`**: View all employees.
- **GET `/employee/{emp_id}`**: View specific employee details.
- **PUT `/employee/{emp_id}`**: Update employee data.
- **DELETE `/employee/{emp_id}`**: Delete employee.

## 5. AI Models (`/models`)
- **POST `/models/create`**: Add a new AI model to the system.
- **GET `/models/all`**: List all supported AI models.
- **GET `/models/{model_id}`**: Get AI model details.
- **PUT `/models/{model_id}`**: Update AI model configuration.
- **DELETE `/models/{model_id}`**: Remove an AI model.

## 6. Tokens (`/tokens`)
- **POST `/tokens/create`**: Allocate tokens for a specific model and organization.
- **GET `/tokens/all`**: List all token allocations.
- **GET `/tokens/{token_id}`**: Get specific token usage details.
- **PUT `/tokens/{token_id}`**: Update remaining/used tokens.
- **DELETE `/tokens/{token_id}`**: Delete a token allocation.
