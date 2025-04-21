from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import requests
import os
from dotenv import load_dotenv

from ...database import get_db

router = APIRouter(
    prefix="/accounts",
    tags=["accounts"],
    responses={404: {"description": "Not found"}},
)

load_dotenv()

@router.get("/")
async def get_accounts():
    """
    Fetch accounts from SimpleFIN
    """
    simplefin_url = os.getenv("SIMPLEFIN_ACCESS_URL")
    if not simplefin_url:
        raise HTTPException(
            status_code=500, 
            detail="SimpleFIN access URL not configured. Please check your .env file."
        )
    
    try:
        # Use the access URL directly - it already contains the credentials
        response = requests.get(f"{simplefin_url}/accounts")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching accounts from SimpleFIN: {str(e)}"
        ) 