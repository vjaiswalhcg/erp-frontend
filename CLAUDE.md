# Working with Claude Code - ERP Project Guide

## Overview
This document provides guidance for using Claude Code (or any AI assistant) effectively when working on this ERP project.

## 🔴 CRITICAL: Development Workflow Rules

### Rule #1: Git is the Source of Truth
**ALWAYS follow this workflow:**

```
1. Make changes in LOCAL files
2. Commit to Git
3. Push to GitHub
4. Pull in Cloud Shell
5. Deploy from Cloud Shell
```

**NEVER:**
- ❌ Edit files directly in Cloud Shell
- ❌ Make changes in Cloud Run
- ❌ Skip Git commits
- ❌ Make changes without pushing to GitHub first

### Rule #2: Claude Should Work Locally
When Claude (or any AI assistant) needs to make code changes:

1. **Read from local files** (not Cloud Shell)
2. **Edit local files** using Edit tool
3. **Commit changes** using Bash (git commands)
4. **Push to GitHub** using Bash
5. **Give you commands** to pull and deploy in Cloud Shell

**Example Workflow:**
```
User: "Fix the API URL in client.ts"

Claude:
1. Reads frontend/lib/api/client.ts (LOCAL)
2. Edits the file locally
3. Runs: git add, git commit, git push
4. Tells user: "Now run 'git pull' in Cloud Shell"
```

### Rule #3: Validate Local First
Before asking user to run commands in Cloud Shell:
- ✅ Check if file exists locally
- ✅ Read local file content
- ✅ Make changes locally if needed
- ❌ Don't ask user to cat/grep in Cloud Shell

## Project Context

### What This Project Is
A full-stack ERP (Enterprise Resource Planning) system with:
- **Backend**: FastAPI (Python) + PostgreSQL
- **Frontend**: Next.js 14 (TypeScript) + shadcn/ui
- **Deployment**: Google Cloud Run + Cloud SQL
- **Repository**: Monorepo structure on GitHub

### Current Modules
1. ✅ Customers - Customer management
2. ✅ Products - Product catalog
3. ✅ Orders - Sales orders with **multiple line items**
4. ✅ Invoices - Invoicing with **multiple line items**, optional order linking
5. ✅ Payments - Payment tracking with invoice application
6. ✅ Dashboard - Analytics, metrics, recent activity
7. ✅ Role-Based UI - Hide/show buttons based on user role

## Architecture Patterns to Follow

### Frontend Patterns

#### 1. File Structure for New Modules
When adding a new module (e.g., "Vendors"), follow this structure:

```
frontend/
├── lib/
│   ├── types/
│   │   └── vendor.ts           # TypeScript interfaces
│   └── api/
│       └── vendors.ts           # API client functions
├── components/
│   └── vendors/
│       ├── VendorTable.tsx      # List view component
│       └── VendorDialog.tsx     # Create/edit form
└── app/
    └── dashboard/
        └── vendors/
            └── page.tsx         # Page route
```

#### 2. Type Definition Pattern
```typescript
// lib/types/entity.ts
export interface Entity {
  id: string;                    // Primary key (UUID)
  external_ref: string | null;   // External reference
  created_at?: string;           // Timestamps
  updated_at?: string;
  // ... other fields
}

export interface EntityCreate {
  // All fields except id and timestamps
  // Use optional (?) for fields with defaults
}

export interface EntityUpdate {
  // Only updatable fields, all optional
}
```

#### 3. API Client Pattern
```typescript
// lib/api/entities.ts
import apiClient from "./client";
import { Entity, EntityCreate, EntityUpdate } from "@/lib/types/entity";

export const entitiesApi = {
  list: async (): Promise<Entity[]> => {
    const { data } = await apiClient.get<Entity[]>("/entities/");
    return data;
  },

  get: async (id: string): Promise<Entity> => {
    const { data } = await apiClient.get<Entity>(`/entities/${id}`);
    return data;
  },

  create: async (entity: EntityCreate): Promise<Entity> => {
    const { data } = await apiClient.post<Entity>("/entities/", entity);
    return data;
  },

  update: async (id: string, entity: EntityUpdate): Promise<Entity> => {
    const { data } = await apiClient.put<Entity>(`/entities/${id}`, entity);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/entities/${id}`);
  },
};
```

#### 4. Table Component Pattern (with Permissions)
```typescript
// components/entities/EntityTable.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entitiesApi } from "@/lib/api/entities";
import { Entity } from "@/lib/types/entity";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";

export function EntityTable() {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entities, isLoading } = useQuery({
    queryKey: ["entities"],
    queryFn: entitiesApi.list,
  });

  // ... handlers and render
  // Use canCreate, canEdit, canDelete to show/hide buttons
}
```

#### 5. Dialog with Multiple Line Items
```typescript
// Use useFieldArray for dynamic line items
import { useFieldArray } from "react-hook-form";

const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: "lines",
});

// Add line: append({ product_id: "", quantity: 1, unit_price: 0 })
// Remove line: remove(index)
```

### Backend Patterns

#### 1. Model Pattern (SQLAlchemy)
```python
# backend/app/models/entity.py
from sqlalchemy import Column, String, DateTime
from app.database import Base
import uuid
from datetime import datetime

class Entity(Base):
    __tablename__ = "entities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    external_ref = Column(String, nullable=True, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

#### 2. Schema Pattern (Pydantic)
```python
# backend/app/schemas/entity.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EntityBase(BaseModel):
    external_ref: Optional[str] = None

class EntityCreate(EntityBase):
    pass

class EntityUpdate(BaseModel):
    external_ref: Optional[str] = None

class Entity(EntityBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

## Common Issues and Solutions

### Issue: "Network Error" on frontend
**Cause**: Frontend calling wrong backend URL
**Solution**: Check `next.config.js` has correct production URL:
```javascript
NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://erp-backend-fb7fdd6n4a-uc.a.run.app/api/v1'
```

### Issue: CORS errors
**Solution**: Backend must include frontend URL in CORS origins
```python
CORS_ORIGINS=https://erp-frontend-377784510062.us-central1.run.app
```

### Issue: TypeScript null check errors
**Solution**: Use proper null checking:
```typescript
// Bad:
const lines = order.lines?.length > 0

// Good:
const lines = (order.lines && order.lines.length > 0)
```

### Issue: Container fails to start
**Solution**: Check Cloud Run logs:
```bash
gcloud run services logs read SERVICE_NAME --region=us-central1 --limit=30
```
Common causes: missing DATABASE_URL, import errors

### Issue: Environment variable not working in Next.js
**Cause**: `NEXT_PUBLIC_*` vars are baked at build time
**Solution**: Configure in `next.config.js`, not Cloud Run env vars

## File References

### Frontend Key Files (`frontend/`)
- Type definitions: `lib/types/*.ts`
- API clients: `lib/api/*.ts`
- Components: `components/**/*.tsx`
- Pages: `app/dashboard/**/page.tsx`
- Layout: `components/layout/DashboardLayout.tsx`
- Sidebar: `components/layout/Sidebar.tsx`
- Auth: `lib/auth.ts`, `hooks/use-auth.ts`
- Permissions: `hooks/use-permissions.ts`
- Config: `next.config.js` (production API URL here!)

### Backend Key Files (`backend/`)
- Models: `app/models/*.py`
- Schemas: `app/schemas/*.py`
- Endpoints: `app/api/v1/endpoints/*.py`
- Main app: `app/main.py`
- Auth: `app/core/auth.py`
- Config: `app/core/config.py`

## Deployment Commands

### Backend
```bash
cd ~/erp-monorepo/backend
git pull origin main
gcloud run deploy erp-backend --source . --region us-central1 \
  --update-env-vars="CORS_ORIGINS=https://erp-frontend-377784510062.us-central1.run.app"
```

### Frontend
```bash
cd ~/erp-monorepo/frontend
git pull origin main
gcloud run deploy erp-frontend --source . --region us-central1 \
  --platform managed --allow-unauthenticated
```

## Remember

- ✅ Follow existing patterns
- ✅ Test locally before committing (`npm run build`)
- ✅ Use TypeScript strictly
- ✅ Add proper error handling
- ✅ Include loading states
- ✅ Show user feedback (toasts)
- ✅ Use `usePermissions` for role-based UI
- ❌ Don't mix patterns from different modules
- ❌ Don't skip validation
- ❌ Don't hardcode values in components (use config)
- ❌ Don't ignore TypeScript errors

---

*Last Updated: November 30, 2024*
