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
1. Reads c:/VickyJaiswal/.../client.ts (LOCAL)
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

**Example:**
```
Bad:  "Run 'cat app/main.py' in Cloud Shell"
Good: Read c:/VickyJaiswal/.../app/main.py directly
```

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
3. ✅ Orders - Sales orders with line items
4. ✅ Invoices - Invoicing with optional order linking
5. ✅ Payments - Payment tracking with invoice application

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

#### 4. Table Component Pattern
```typescript
// components/entities/EntityTable.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entitiesApi } from "@/lib/api/entities";
import { Entity } from "@/lib/types/entity";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { EntityDialog } from "./EntityDialog";
import { useToast } from "@/hooks/use-toast";

export function EntityTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entities, isLoading } = useQuery({
    queryKey: ["entities"],
    queryFn: entitiesApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: entitiesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      toast({ title: "Success", description: "Entity deleted" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete",
        variant: "destructive",
      });
    },
  });

  // ... handlers and render
}
```

#### 5. Dialog Component Pattern
```typescript
// components/entities/EntityDialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { entitiesApi } from "@/lib/api/entities";
import { EntityCreate } from "@/lib/types/entity";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const entitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  // ... other fields with validation
});

type EntityFormValues = z.infer<typeof entitySchema>;

export function EntityDialog({ entity, open, onOpenChange }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entitySchema),
    defaultValues: { /* ... */ },
  });

  const createMutation = useMutation({
    mutationFn: entitiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      toast({ title: "Success", description: "Entity created" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create",
        variant: "destructive",
      });
    },
  });

  // ... form and render
}
```

### Backend Patterns

#### 1. Model Pattern (SQLAlchemy)
```python
# backend/app/models/entity.py
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime

class Entity(Base):
    __tablename__ = "entities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    external_ref = Column(String, nullable=True, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # ... other columns
```

#### 2. Schema Pattern (Pydantic)
```python
# backend/app/schemas/entity.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EntityBase(BaseModel):
    external_ref: Optional[str] = None
    # ... other fields

class EntityCreate(EntityBase):
    # Required fields for creation
    pass

class EntityUpdate(BaseModel):
    # All fields optional for updates
    external_ref: Optional[str] = None
    # ... other fields

class Entity(EntityBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

#### 3. Router Pattern (FastAPI)
```python
# backend/app/routers/entities.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import entity as models
from app.schemas import entity as schemas

router = APIRouter(prefix="/entities", tags=["entities"])

@router.get("/", response_model=list[schemas.Entity])
def list_entities(db: Session = Depends(get_db)):
    return db.query(models.Entity).all()

@router.get("/{id}", response_model=schemas.Entity)
def get_entity(id: str, db: Session = Depends(get_db)):
    entity = db.query(models.Entity).filter(models.Entity.id == id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity

@router.post("/", response_model=schemas.Entity, status_code=201)
def create_entity(entity: schemas.EntityCreate, db: Session = Depends(get_db)):
    db_entity = models.Entity(**entity.dict())
    db.add(db_entity)
    db.commit()
    db.refresh(db_entity)
    return db_entity

@router.put("/{id}", response_model=schemas.Entity)
def update_entity(id: str, entity: schemas.EntityUpdate, db: Session = Depends(get_db)):
    db_entity = db.query(models.Entity).filter(models.Entity.id == id).first()
    if not db_entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    for key, value in entity.dict(exclude_unset=True).items():
        setattr(db_entity, key, value)
    db.commit()
    db.refresh(db_entity)
    return db_entity

@router.delete("/{id}", status_code=204)
def delete_entity(id: str, db: Session = Depends(get_db)):
    db_entity = db.query(models.Entity).filter(models.Entity.id == id).first()
    if not db_entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    db.delete(db_entity)
    db.commit()
```

## Common Prompts for Claude Code

### Adding a New Module
```
I need to add a new module called "Vendors" to the ERP system. Follow the same pattern as the existing Orders, Invoices, and Payments modules.

Requirements:
- Vendor entity should have: name, email, phone, address, notes
- Full CRUD operations
- Table view with search
- Create/edit dialog form

Please:
1. Create TypeScript types in lib/types/vendor.ts
2. Create API client in lib/api/vendors.ts
3. Create VendorTable component
4. Create VendorDialog component
5. Create page at app/dashboard/vendors/page.tsx
6. Add navigation link to Sidebar.tsx

Follow the exact patterns used in the Orders module.
```

### Fixing a Bug
```
I'm getting an error when trying to create an order:

[paste error message]

The issue seems to be in components/orders/OrderDialog.tsx at line 123.

Please help me debug and fix this issue while maintaining the existing pattern.
```

### Adding a Feature
```
I need to add a "Print Invoice" button to the InvoiceTable component that generates a PDF.

Requirements:
- Button should appear in the actions column
- Use react-pdf library for PDF generation
- Include company logo, invoice details, line items, and totals
- Follow existing UI patterns

Please implement this feature.
```

## Tips for Working with Claude

### 1. Always Provide Context
When asking for help, include:
- Which module you're working on
- What you're trying to achieve
- Any error messages (full stack trace)
- Relevant code snippets

### 2. Reference Existing Patterns
Say things like:
- "Follow the same pattern as OrderTable"
- "Use the same validation approach as CustomerDialog"
- "Match the styling of the Products page"

### 3. Be Specific About Technology
This project uses specific versions:
- Next.js 14 (App Router, not Pages Router)
- React Query v5 (not v4)
- shadcn/ui components
- Zod validation

Always mention these when asking for code.

### 4. Request Explanations
Ask Claude to:
- Explain why it chose a particular approach
- Document any non-obvious logic
- Highlight potential issues or edge cases

### 5. Incremental Changes
Instead of asking for everything at once:
```
❌ Bad: "Add vendors, warehouses, and shipping modules"
✅ Good: "Add the vendors module first, then we'll do warehouses"
```

## Common Issues and Solutions

### Issue: "Module not found" errors
**Solution**: Check import paths use `@/` prefix
```typescript
import { Customer } from "@/lib/types/customer";  // ✅ Correct
import { Customer } from "../types/customer";     // ❌ Wrong
```

### Issue: React Query not refetching
**Solution**: Ensure you're invalidating queries correctly
```typescript
queryClient.invalidateQueries({ queryKey: ["customers"] });
```

### Issue: Form validation not working
**Solution**: Check Zod schema matches form fields
```typescript
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});
```

### Issue: CORS errors
**Solution**: Backend must include frontend URL in CORS origins
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.run.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## File References

When working with Claude, you can reference specific files:

### Frontend Key Files (in `frontend/frontend/`)
- Type definitions: `lib/types/*.ts`
- API clients: `lib/api/*.ts`
- Components: `components/**/*.tsx`
- Pages: `app/dashboard/**/page.tsx`
- Layout: `components/layout/DashboardLayout.tsx`
- Sidebar: `components/layout/Sidebar.tsx`
- Auth: `lib/auth.ts`, `hooks/use-auth.ts`

### Backend Key Files (in `frontend/backend/`)
- Models: `app/models/*.py`
- Schemas: `app/schemas/*.py`
- Endpoints: `app/api/v1/endpoints/*.py`
- Main app: `app/main.py`
- Auth: `app/core/auth.py`
- Config: `app/core/config.py`

> **Note:** The active backend is in `frontend/backend/`, not the root `backend/` folder (which is deprecated).

## Development Workflow

See the main [README.md](README.md) for the recommended development workflow.

## Questions?

If you're stuck, ask Claude:
1. "What pattern should I follow for [task]?"
2. "Show me an example from the existing codebase"
3. "What's the best practice for [scenario] in Next.js 14?"
4. "Review this code and suggest improvements"

## Remember

- ✅ Follow existing patterns
- ✅ Test locally before committing
- ✅ Use TypeScript strictly
- ✅ Add proper error handling
- ✅ Include loading states
- ✅ Show user feedback (toasts)
- ❌ Don't mix patterns from different modules
- ❌ Don't skip validation
- ❌ Don't hardcode values
- ❌ Don't ignore errors

---

Last Updated: November 29, 2024
