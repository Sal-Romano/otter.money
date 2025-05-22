from fastapi import APIRouter, HTTPException, Query, Header
import requests
import os
import logging
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from jose import jwt, JWTError

router = APIRouter(
    prefix="/sync",
    tags=["sync"],
    responses={404: {"description": "Not found"}},
)

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
API_KEY = os.getenv("API_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_table(table_name: str):
    # Use public schema explicitly
    return supabase.schema("public").table(table_name)

def verify_jwt(token: str):
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload.get("sub")  # sub is the user_id
    except JWTError as e:
        logging.warning(f"JWT verification failed: {str(e)}")
        return None

@router.get("/")
async def get_accounts(
    user_id: str = Query(None),
    secret: str = Header(None),
    authorization: str = Header(None)
):
    """
    Fetch accounts from SimpleFIN for a specific user and update balances
    """
    # Authentication logic
    if secret == API_KEY:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required with API key")
        logging.info(f"/api/v1/sync called with API key for user_id={user_id}")
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        user_id_from_jwt = verify_jwt(token)
        if not user_id_from_jwt:
            raise HTTPException(status_code=401, detail="Invalid JWT token")
        user_id = user_id_from_jwt
        logging.info(f"/api/v1/sync called with JWT for user_id={user_id}")
    else:
        logging.warning("Unauthorized access attempt: missing or invalid API key/JWT")
        raise HTTPException(status_code=401, detail="Missing or invalid API key or JWT")

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    # Lookup user's SimpleFIN token from database
    try:
        user_resp = get_table("om_user_simplefin_tokens").select("simplefin_token, user_id").eq("user_id", user_id).single().execute()
        if not user_resp.data or not user_resp.data.get("simplefin_token"):
            raise HTTPException(
                status_code=404, 
                detail="User or SimpleFIN token not found. Please configure your SimpleFIN access token."
            )
        
        simplefin_token = user_resp.data["simplefin_token"]
        
        # Ensure the URL ends with /accounts
        if not simplefin_token.rstrip('/').endswith('/accounts'):
            simplefin_token = simplefin_token.rstrip('/') + '/accounts'
            
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error looking up user SimpleFIN token: {str(e)}"
        )
    
    try:
        # Fetch accounts from SimpleFIN
        response = requests.get(simplefin_token)
        response.raise_for_status()
        
        simplefin_data = response.json()
        accounts = simplefin_data.get("accounts", [])
        
        # Update account balances in the database using upsert
        logging.info(f"Processing {len(accounts)} accounts for user {user_id}")
        
        upsert_data = []
        for account in accounts:
            account_id = account.get("id")
            balance = account.get("balance")
            balance_date = account.get("balance-date")
            
            if account_id and balance is not None:
                logging.info(f"Processing account {account_id} with balance {balance}")
                
                upsert_data.append({
                    "user_id": user_id,
                    "sf_account_id": account_id,
                    "sf_account_name": account.get("name"),
                    "sf_name": account.get("org", {}).get("name") if account.get("org") else None,
                    "balance": str(balance),
                    "sf_balance_date": balance_date,
                    "source": "simplefin-bridge"
                })
        
        # Upsert all accounts at once
        if upsert_data:
            try:
                resp = get_table("om_user_accounts").upsert(upsert_data, on_conflict="user_id,sf_account_id").execute()
                logging.info(f"Successfully upserted {len(upsert_data)} accounts for user_id={user_id}")
            except Exception as e:
                logging.error(f"Error upserting accounts for user {user_id}: {str(e)}")
                # Don't fail the entire request
        
        # Update the last sync timestamp in user settings
        try:
            current_time = datetime.utcnow().isoformat()
            get_table("om_user_settings").upsert({
                "id": user_id,
                "sf_last_sync": current_time,
                "updated_at": current_time
            }).execute()
        except Exception as e:
            # Log the error but don't fail the entire request
            logging.warning(f"Failed to update last sync time for user {user_id}: {str(e)}")
        
        return simplefin_data
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching accounts from SimpleFIN: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error: {str(e)}"
        ) 