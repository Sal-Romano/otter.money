# Otter Money

A personal finance management system that helps track accounts, transactions, and financial status.

## Current Status

Early development phase with basic frontend infrastructure in place:
- Dashboard view with account summary and recent transactions
- Account listing page (in progress)
- Transaction history view (in progress)

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Chakra UI for components
- React Query for data fetching
- React Router for navigation
- Axios for API communication

### Backend (In Progress)
- FastAPI
- PostgreSQL
- SQLAlchemy ORM
- SimpleFIN bridge for financial institution connections

## Development Setup

### Prerequisites
- Node.js (v18+)
- Python 3.8+
- PostgreSQL

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

The development server will start at `http://localhost:5173`
- API endpoints at `/api/v1`

## Project Structure

```
.
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── layouts/      # Layout components
│   │   ├── services/     # API services
│   │   └── theme.ts      # Chakra UI theme configuration
│   └── vite.config.ts    # Vite configuration
├── api/                   # FastAPI backend (in progress)
└── requirements.txt       # Python dependencies
```

## Next Steps
- Implement backend API endpoints
- Add account creation and management
- Integrate SimpleFIN for bank connections
- Add transaction categorization
- Implement data visualization for spending patterns

## License
Private project - All rights reserved
