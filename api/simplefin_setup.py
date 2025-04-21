import os
import base64
import requests
from dotenv import load_dotenv
import urllib.parse

load_dotenv()

def get_simplefin_access_url():
    setup_token = os.getenv('SIMPLEFIN_SETUP_TOKEN')
    if not setup_token:
        print("Error: SIMPLEFIN_SETUP_TOKEN not found in .env file")
        return

    try:
        # 1. Decode the setup token to get the claim URL
        claim_url = base64.b64decode(setup_token).decode('utf-8')
        print(f"Claim URL: {claim_url}")
        
        # 2. Make a POST request to claim the access URL
        response = requests.post(claim_url, headers={"Content-Length": "0"})
        if response.status_code != 200:
            print(f"Error: Received status code {response.status_code}")
            print(response.text)
            return
            
        access_url = response.text.strip()
        print(f"\nAccess URL: {access_url}")
        
        # 3. Parse the access URL to get credentials
        parsed_url = urllib.parse.urlparse(access_url)
        auth = parsed_url.netloc.split('@')[0]
        username, password = auth.split(':')
        
        # 4. Test the connection by fetching accounts
        accounts_url = f"{parsed_url.scheme}://{parsed_url.netloc.split('@')[1]}/accounts"
        response = requests.get(accounts_url, auth=(username, password))
        
        if response.status_code == 200:
            print("\nSuccessfully connected to SimpleFIN!")
            print("\nPlease add these to your .env file:")
            print(f"SIMPLEFIN_ACCESS_URL={access_url}")
            print(f"SIMPLEFIN_USERNAME={username}")
            print(f"SIMPLEFIN_PASSWORD={password}")
            
            # Print a sample of the accounts data
            data = response.json()
            print("\nSample accounts data:")
            for account in data.get('accounts', [])[:2]:  # Show first 2 accounts
                print(f"\nAccount: {account.get('name')}")
                print(f"Balance: {account.get('balance')}")
                if account.get('transactions'):
                    print("Recent transactions:")
                    for tx in account.get('transactions', [])[:3]:  # Show first 3 transactions
                        print(f"  - {tx.get('description')}: {tx.get('amount')}")
        else:
            print(f"Error testing connection: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    get_simplefin_access_url() 