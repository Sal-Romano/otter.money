# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend Development
```bash
cd frontend
npm install
npm run dev          # Start development server on http://localhost:5173
npm run build        # Build for production (uses increased memory allocation)
npm run lint         # Run ESLint with TypeScript support
npm run preview      # Preview production build
```

### Backend Development
```bash
# From project root
pip install -r requirements.txt
cd api
uvicorn api:app --reload --host 0.0.0.0 --port 8000  # Start FastAPI server
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript, Vite, Chakra UI, React Query, React Router
- **Backend**: FastAPI, PostgreSQL, SQLAlchemy, Supabase Auth
- **Data Integration**: SimpleFIN bridge for financial institution connections

### Application Structure

This is a personal finance management system with a React frontend and FastAPI backend. The frontend communicates with the backend via `/api` proxy routes configured in Vite.

#### Frontend Architecture (`frontend/src/`)
- **Pages**: Route-level components in `pages/`
- **Components**: Reusable UI components in `components/`
- **Layouts**: Layout wrappers in `layouts/`
- **Services**: API communication layer in `services/`
- **Contexts**: React context providers for auth and theming
- **Hooks**: Custom React hooks in `hooks/`
- **Theme**: Chakra UI theme configuration in `theme.ts`

#### Backend Architecture (`api/`)
- **Main API**: `api.py` contains FastAPI application with Supabase integration
- **Authentication**: JWT-based auth using Supabase with custom verification
- **Database**: PostgreSQL accessed via Supabase client with `public` schema
- **Routers**: Modular route handlers in `routers/`

### Key Technical Details

#### Authentication Flow
- Frontend uses Supabase client for auth UI and token management
- Backend verifies JWT tokens with Supabase JWT secret
- API endpoints protected with JWT verification middleware

#### Database Schema
- Uses Supabase PostgreSQL with explicit `public` schema access
- Tables accessed via `supabase.schema("public").table(table_name)`

#### API Proxy Configuration
- Vite dev server proxies `/api` requests to `http://localhost:8000`
- Production builds require separate deployment of frontend and backend

#### Build Optimizations
- Memory-optimized build process with `--max-old-space-size=1024`
- Manual chunking disabled to prevent initialization errors
- esbuild used for faster builds instead of terser

### Development Environment
- Node.js v18+ required for frontend
- Python 3.8+ required for backend
- Environment variables managed via `.env` file
- Supabase integration requires `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET`

### Project Status
Early development phase focusing on:
- Account authorization and management
- Dashboard with account summaries and transactions
- Transaction history and categorization
- Integration with financial institutions via SimpleFIN