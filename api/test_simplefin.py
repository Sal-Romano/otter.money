import os
import requests
from dotenv import load_dotenv

load_dotenv()

def test_simplefin_connection():
    simplefin_url = os.getenv("SIMPLEFIN_ACCESS_URL")
    
    if not simplefin_url:
        print("Error: Missing SimpleFIN access URL in .env file")
        return
    
    try:
        # Use the access URL directly - it already contains the credentials
        accounts_url = f"{simplefin_url}/accounts"
        print(f"Testing connection to: {accounts_url}")
        response = requests.get(accounts_url)
        
        if response.status_code == 200:
            print("\nSuccessfully connected to SimpleFIN!")
            data = response.json()
            
            # Print account information
            print("\nAccounts found:")
            for account in data.get('accounts', []):
                print(f"\nAccount: {account.get('name')}")
                print(f"Balance: {account.get('balance')}")
                if account.get('transactions'):
                    print("Recent transactions:")
                    for tx in account.get('transactions', [])[:3]:
                        print(f"  - {tx.get('description')}: {tx.get('amount')}")
        else:
            print(f"\nError: Received status code {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_simplefin_connection() 