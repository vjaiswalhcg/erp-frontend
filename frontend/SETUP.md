# Frontend Setup Instructions

## 📦 Install Dependencies

Open terminal in the `frontend/` directory and run:

```bash
cd C:\VickyJaiswal\VickyWork_2025\PERSONAL\Projects\EDW\frontend

# Install dependencies
npm install

# This will install all packages from package.json
```

## 🎨 UI Components

All required shadcn/ui components have been created manually in the `components/ui/` directory. No additional installation needed.

## 🚀 Run Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

## 📁 Project Structure Created

```
frontend/
├── app/
│   ├── dashboard/
│   │   ├── customers/
│   │   │   └── page.tsx         ✅ Customer list page
│   │   ├── products/
│   │   │   └── page.tsx         ✅ Product list page
│   │   ├── layout.tsx           ✅ Dashboard layout
│   │   └── page.tsx             ✅ Dashboard home
│   ├── globals.css              ✅ Global styles
│   ├── layout.tsx               ✅ Root layout
│   ├── page.tsx                 ✅ Home page (redirects to dashboard)
│   └── providers.tsx            ✅ React Query provider
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          ✅ Navigation sidebar
│   │   └── DashboardLayout.tsx  ✅ Dashboard wrapper
│   ├── customers/
│   │   ├── CustomerTable.tsx    ✅ Customer data table
│   │   └── CustomerDialog.tsx   ✅ Create/Edit customer form
│   ├── products/
│   │   ├── ProductTable.tsx     ✅ Product data table
│   │   └── ProductDialog.tsx    ✅ Create/Edit product form
│   └── ui/
│       ├── button.tsx           ✅ Button component
│       ├── input.tsx            ✅ Input component
│       ├── label.tsx            ✅ Label component
│       ├── form.tsx             ✅ Form components
│       ├── dialog.tsx           ✅ Dialog/Modal component
│       ├── table.tsx            ✅ Table components
│       ├── badge.tsx            ✅ Badge component
│       ├── toast.tsx            ✅ Toast notification
│       └── toaster.tsx          ✅ Toast container
├── hooks/
│   └── use-toast.ts             ✅ Toast hook
├── lib/
│   ├── api/
│   │   ├── client.ts            ✅ Axios client with auth
│   │   ├── customers.ts         ✅ Customer API functions
│   │   └── products.ts          ✅ Product API functions
│   ├── types/
│   │   ├── customer.ts          ✅ Customer TypeScript types
│   │   └── product.ts           ✅ Product TypeScript types
│   └── utils.ts                 ✅ Utility functions
├── package.json                 ✅ Dependencies
├── tsconfig.json                ✅ TypeScript config
├── tailwind.config.ts           ✅ Tailwind config
├── next.config.js               ✅ Next.js config
├── .env.local                   ✅ Environment variables
└── .gitignore                   ✅ Git ignore
```

## ✨ Features Implemented

### Pages
- **Dashboard Home** (`/dashboard`) - Overview with placeholder metrics
- **Customer Management** (`/dashboard/customers`) - Full CRUD operations
- **Product Management** (`/dashboard/products`) - Full CRUD operations

### Features
- Full-featured data tables with edit/delete actions
- Create and edit forms with validation (React Hook Form + Zod)
- Toast notifications for success/error messages
- Responsive sidebar navigation
- API integration with authentication
- TypeScript for type safety
- Tailwind CSS for styling

## ⏭️ Next Steps

After running the development server:
1. **Customer Management**: Create, view, edit, and delete customers
2. **Product Management**: Create, view, edit, and delete products
3. **Future Pages**: Orders, Invoices, and Payments (placeholders in navigation)

## 🔗 API Connection

The frontend connects to your deployed backend at:
```
https://erp-backend-377784510062.us-central1.run.app/api/v1
```

API Key is configured in [.env.local](.env.local)

## 🐛 Troubleshooting

### If npm install fails:
```bash
# Clear cache and try again
npm cache clean --force
npm install
```

### If port 3000 is in use:
```bash
# Run on different port
npm run dev -- -p 3001
```

## ✅ Verification

After setup, verify everything works:

```bash
# Build the project
npm run build

# Should complete without errors
```
