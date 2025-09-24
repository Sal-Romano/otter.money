#!/usr/bin/env python3
"""
Script to extract all data from Supabase tables for migration to PostgreSQL
"""
import os
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def extract_supabase_data():
    """Extract all data from Supabase tables"""
    print("Connecting to Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # Tables to extract
    tables = [
        "om_user_simplefin_tokens",
        "om_user_accounts",
        "om_user_settings"
    ]

    extracted_data = {}

    for table_name in tables:
        print(f"Extracting data from {table_name}...")
        try:
            # Get all data from table
            response = supabase.schema("public").table(table_name).select("*").execute()
            extracted_data[table_name] = response.data
            print(f"  → Extracted {len(response.data)} records from {table_name}")
        except Exception as e:
            print(f"  → Error extracting from {table_name}: {str(e)}")
            extracted_data[table_name] = []

    # Save extracted data to JSON file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"supabase_data_export_{timestamp}.json"

    with open(filename, 'w') as f:
        json.dump(extracted_data, f, indent=2, default=str)

    print(f"\nData extraction complete. Saved to: {filename}")

    # Print summary
    print("\nExtraction Summary:")
    for table_name, data in extracted_data.items():
        print(f"  {table_name}: {len(data)} records")

    return extracted_data, filename

if __name__ == "__main__":
    data, filename = extract_supabase_data()