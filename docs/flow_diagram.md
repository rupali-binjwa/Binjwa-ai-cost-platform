# Flow Diagrams

This document contains Mermaid diagrams illustrating the fundamental workflows within the **Binjwa AI Cost Platform**.

## 1. User Hierarchy & Token Allocation Flow

```mermaid
graph TD
    SA[Super Admin] -->|Creates/Manages| CA[Client Admin / Organization]
    SA -->|Adds System Wide| AM[AI Models]
    
    CA -->|Creates/Manages| E[Employees]
    CA -->|Purchases/Allocates| T[Tokens for AI Models]
    
    E -->|Uses| AI[AI Chat / Tools]
    AI -->|Consumes| T
    
    T -->|Updates Usage| DB[(MongoDB)]
```

## 2. API Request Flow

```mermaid
sequenceDiagram
    participant C as Client (Frontend/Postman)
    participant F as FastAPI (Router)
    participant S as Pydantic (Schema)
    participant DB as MongoDB (Database)

    C->>F: POST /tokens/create {data}
    F->>S: Validate Request Payload
    alt Invalid Payload
        S-->>C: 422 Unprocessable Entity
    else Valid Payload
        S->>F: Data OK
        F->>DB: Check if Model & Org Exists
        alt Missing Data
            DB-->>F: Not Found
            F-->>C: 404 Not Found Exception
        else Found
            F->>DB: tokens_collection.insert_one(token_data)
            DB-->>F: Object ID returned
            F-->>C: 200 OK + Token ID
        end
    end
```
