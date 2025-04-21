from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Otter Money",
    description="Personal Finance Management System",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"https://{os.getenv('DOMAIN')}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Otter Money API"}

# Import and include API routers
from api.routers import accounts
app.include_router(accounts.router, prefix="/api/v1")

# Import and include API routers
# from api.routers import transactions, etc. 