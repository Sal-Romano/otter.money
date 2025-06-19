import os
import logging
from fastapi import FastAPI, Header, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from supabase import create_client, Client
import requests
from dotenv import load_dotenv
from jose import jwt, JWTError
from typing import List, Optional

load_dotenv(override=True)

# Logging setup
os.makedirs('logs', exist_ok=True)
logging.basicConfig(
    filename='logs/api.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)

SUPABASE_URL = "https://wugxksuspovhmnpnkusk.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
API_KEY = os.getenv("API_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# Initialize Supabase client with the correct schema
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

def get_table(table_name: str):
    # Use public_ottermoney schema explicitly
    return supabase.schema("public").table(table_name)

def verify_jwt(token: str):
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"  # <-- add this line
        )
        #logging.info(f"Decoded JWT payload: {payload}")
        return payload.get("sub")  # sub is the user_id
    except JWTError as e:
        logging.warning(f"JWT verification failed: {str(e)}")
        return None

@app.get("/api/v1/accounts")
def get_accounts(
    user_id: str = Query(None),
    secret: str = Header(None),
    authorization: str = Header(None)
):
    # logging.info(f"Authorization header: {authorization}")
    # Prefer API key if present
    if secret == API_KEY:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required with API key")
        logging.info(f"/api/v1/accounts called with API key for user_id={user_id}")
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        logging.info(f"First 40 chars of JWT: {token[:40]}")
        user_id_from_jwt = verify_jwt(token)
        logging.info(f"user_id_from_jwt: {user_id_from_jwt}")
        if not user_id_from_jwt:
            raise HTTPException(status_code=401, detail="Invalid JWT token")
        user_id = user_id_from_jwt
        logging.info(f"/api/v1/accounts called with JWT for user_id={user_id}")
    else:
        logging.warning("Unauthorized access attempt: missing or invalid API key/JWT")
        raise HTTPException(status_code=401, detail="Missing or invalid API key or JWT")

    # Lookup user in Supabase
    user_resp = get_table("om_user_simplefin_tokens").select("simplefin_token, user_id").eq("user_id", user_id).single().execute()
    if not user_resp.data or not user_resp.data.get("simplefin_token"):
        logging.error(f"User or token not found for user_id={user_id}")
        raise HTTPException(status_code=404, detail="User or token not found")

    access_url = user_resp.data["simplefin_token"]
    if not access_url.rstrip('/').endswith('/accounts'):
        access_url = access_url.rstrip('/') + '/accounts'

    try:
        resp = requests.get(access_url)
        if resp.status_code != 200:
            logging.error(f"SimpleFIN error for user_id={user_id}: {resp.status_code} {resp.text}")
            return JSONResponse(status_code=resp.status_code, content={"error": resp.text})
        logging.info(f"SimpleFIN success for user_id={user_id}")
        return resp.json()
    except Exception as e:
        logging.exception(f"Exception fetching SimpleFIN data for user_id={user_id}")
        raise HTTPException(status_code=500, detail=str(e))

def upsert_user_accounts(user_id: str, accounts: List[dict], source: str = "simplefin-bridge"):
    # Prepare data for upsert
    upsert_data = []
    for acc in accounts:
        upsert_data.append({
            "user_id": user_id,
            "sf_account_id": acc.get("id") or acc.get("sf_account_id"),
            "sf_account_name": acc.get("name") or acc.get("sf_account_name"),
            "sf_name": acc.get("org", {}).get("name") if acc.get("org") else acc.get("sf_name"),
            "balance": acc.get("balance") or acc.get("sf_balance") or acc.get("balance"),
            "sf_balance_date": acc.get("balance-date") or acc.get("sf_balance_date"),
            "source": source,
            "hidden": acc.get("hidden", False)
        })
    # Upsert into user_accounts
    try:
        resp = get_table("om_user_accounts").upsert(upsert_data, on_conflict="user_id,sf_account_id").execute()
        logging.info(f"Successfully upserted accounts for user_id={user_id}")
        return resp
    except Exception as e:
        logging.error(f"Error upserting om_user_accounts: {str(e)}")
        raise e

@app.get("/api/v1/user_accounts")
def get_user_accounts(
    user_id: str = Query(None),
    secret: str = Header(None),
    authorization: str = Header(None),
    show_hidden: bool = Query(False)
):
    # Auth logic (reuse from get_accounts)
    # logging.info(f"Authorization header: {authorization}")
    if secret == API_KEY:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required with API key")
        logging.info(f"/api/v1/user_accounts called with API key for user_id={user_id}")
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        user_id_from_jwt = verify_jwt(token)
        if not user_id_from_jwt:
            raise HTTPException(status_code=401, detail="Invalid JWT token")
        user_id = user_id_from_jwt
        logging.info(f"/api/v1/user_accounts called with JWT for user_id={user_id}")
    else:
        raise HTTPException(status_code=401, detail="Missing or invalid API key or JWT")

    # Always return all accounts from user_accounts, but filter hidden unless show_hidden is True
    query = get_table("om_user_accounts").select("sf_account_id, sf_account_name, sf_name, balance, sf_balance_date, category, display_name, source, hidden").eq("user_id", user_id)
    if not show_hidden:
        query = query.or_("hidden.is.null,hidden.eq.false")
    resp = query.execute()
    if resp.data and len(resp.data) > 0:
        return {"accounts": resp.data}

    # If not cached, fetch from SimpleFIN and cache
    user_resp = get_table("om_user_simplefin_tokens").select("simplefin_token, user_id").eq("user_id", user_id).single().execute()
    if not user_resp.data or not user_resp.data.get("simplefin_token"):
        raise HTTPException(status_code=404, detail="User or token not found")
    access_url = user_resp.data["simplefin_token"]
    if not access_url.rstrip('/').endswith('/accounts'):
        access_url = access_url.rstrip('/') + '/accounts'
    try:
        resp_sf = requests.get(access_url)
        if resp_sf.status_code != 200:
            return JSONResponse(status_code=resp_sf.status_code, content={"error": resp_sf.text})
        accounts = resp_sf.json().get("accounts", [])
        upsert_user_accounts(user_id, accounts, source="simplefin-bridge")
        # Return the upserted data
        query = get_table("om_user_accounts").select("sf_account_id, sf_account_name, sf_name, balance, sf_balance_date, category, display_name,source, hidden").eq("user_id", user_id)
        if not show_hidden:
            query = query.or_("hidden.is.null,hidden.eq.false")
        resp = query.execute()
        return {"accounts": resp.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/user_accounts")
def add_manual_account(
    account: dict,
    user_id: str = Query(...),
    secret: str = Header(None),
    authorization: str = Header(None)
):
    # Auth logic (reuse from get_accounts)
    if secret == API_KEY:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required with API key")
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        user_id_from_jwt = verify_jwt(token)
        if not user_id_from_jwt:
            raise HTTPException(status_code=401, detail="Invalid JWT token")
        user_id = user_id_from_jwt
    else:
        raise HTTPException(status_code=401, detail="Missing or invalid API key or JWT")
    # Upsert manual account
    upsert_user_accounts(user_id, [account], source="manual")
    return {"status": "success"}

@app.patch("/api/v1/user_accounts/{account_id}/hide")
def hide_account(
    account_id: str,
    hidden: bool = Query(...),
    user_id: str = Query(None),
    secret: str = Header(None),
    authorization: str = Header(None)
):
    # Auth logic (reuse from get_accounts)
    if secret == API_KEY:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required with API key")
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        user_id_from_jwt = verify_jwt(token)
        if not user_id_from_jwt:
            raise HTTPException(status_code=401, detail="Invalid JWT token")
        user_id = user_id_from_jwt
    else:
        raise HTTPException(status_code=401, detail="Missing or invalid API key or JWT")
    # Only allow update for this user's account
    resp = get_table("om_user_accounts").update({"hidden": hidden}).eq("sf_account_id", account_id).eq("user_id", user_id).execute()
    if resp.data is not None:
        return {"status": "success", "hidden": hidden}
    else:
        raise HTTPException(status_code=404, detail="Account not found or not updated")

# Import and include sync router
try:
    import sys
    import os
    sys.path.append(os.path.dirname(__file__))
    from routers.sync import router as sync_router
    app.include_router(sync_router, prefix="/api/v1")
    logging.info("Sync router loaded successfully")
except ImportError as e:
    logging.warning(f"Failed to load sync router: {e}")

if __name__ == "__main__":
    import sys
    import threading
    from watchdog.observers import Observer
    from watchdog.events import PatternMatchingEventHandler
    import uvicorn

    def restart_on_change():
        class RestartHandler(PatternMatchingEventHandler):
            def __init__(self):
                super().__init__(patterns=["*.py"], ignore_directories=False)
            def on_modified(self, event):
                print(f"File changed: {event.src_path}. Restarting...")
                os.execv(sys.executable, [sys.executable] + sys.argv)
        event_handler = RestartHandler()
        observer = Observer()
        observer.schedule(event_handler, path=".", recursive=True)
        observer.start()
        try:
            while True:
                pass
        except KeyboardInterrupt:
            observer.stop()
        observer.join()

    threading.Thread(target=restart_on_change, daemon=True).start()
    uvicorn.run("api:app", host="0.0.0.0", port=8000) 