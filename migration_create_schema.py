#!/usr/bin/env python3
"""
Script to create PostgreSQL schema and tables for Otter Money migration
"""
import os
import json
import bcrypt
from datetime import datetime
from sqlalchemy import create_engine, text, Column, String, DateTime, Boolean, Integer, Numeric, JSON, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# PostgreSQL configuration
POSTGRES_HOST = os.getenv("POSTGRES_SERVER")
POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_PORT = os.getenv("POSTGRES_PORT")

DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

Base = declarative_base()

# Define table models
class User(Base):
    __tablename__ = 'users'
    __table_args__ = {'schema': 'ottermoney'}

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserSimplefinToken(Base):
    __tablename__ = 'user_simplefin_tokens'
    __table_args__ = {'schema': 'ottermoney'}

    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    simplefin_token = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserAccount(Base):
    __tablename__ = 'user_accounts'
    __table_args__ = {'schema': 'ottermoney'}

    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    sf_account_id = Column(String, nullable=False)
    sf_account_name = Column(String)
    sf_name = Column(String)
    balance = Column(Numeric(precision=10, scale=2))
    sf_balance_date = Column(Integer)
    inserted_at = Column(DateTime, default=datetime.utcnow)
    source = Column(String)
    category = Column(String)
    display_name = Column(String)
    hidden = Column(Boolean, default=False)

class UserSetting(Base):
    __tablename__ = 'user_settings'
    __table_args__ = {'schema': 'ottermoney'}

    id = Column(String, primary_key=True)
    dark_mode = Column(Boolean, default=False)
    categories = Column(JSON)
    sf_last_sync = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def create_schema_and_tables():
    """Create the ottermoney schema and all tables"""
    print("Connecting to PostgreSQL...")
    engine = create_engine(DATABASE_URL)

    print("Creating ottermoney schema...")
    with engine.connect() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS ottermoney"))
        conn.commit()

    print("Creating tables...")
    Base.metadata.create_all(engine, checkfirst=True)

    print("Tables created successfully!")
    return engine

def create_initial_user(engine):
    """Create the initial user account"""
    print("Creating initial user account...")

    # Hash the password
    password = "applepie21"
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Check if user already exists
        existing_user = session.query(User).filter_by(id="6a4ec63f-5468-40aa-b09d-f39120f7281b").first()
        if existing_user:
            print("User already exists, skipping creation.")
            return

        # Create new user
        user = User(
            id="6a4ec63f-5468-40aa-b09d-f39120f7281b",
            email="sal@sromano.net",
            password_hash=password_hash
        )

        session.add(user)
        session.commit()
        print(f"Created user: sal@sromano.net")

    except Exception as e:
        print(f"Error creating user: {str(e)}")
        session.rollback()
    finally:
        session.close()

def import_supabase_data(engine, json_file):
    """Import data from the Supabase export"""
    print(f"Importing data from {json_file}...")

    with open(json_file, 'r') as f:
        data = json.load(f)

    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Import SimpleFIN tokens
        print("Importing SimpleFIN tokens...")
        for record in data['om_user_simplefin_tokens']:
            token = UserSimplefinToken(
                id=record['id'],
                user_id=record['user_id'],
                simplefin_token=record['simplefin_token'],
                created_at=datetime.fromisoformat(record['created_at'].replace('Z', '+00:00'))
            )
            session.merge(token)

        # Import user accounts
        print("Importing user accounts...")
        for record in data['om_user_accounts']:
            account = UserAccount(
                id=record['id'],
                user_id=record['user_id'],
                sf_account_id=record['sf_account_id'],
                sf_account_name=record['sf_account_name'],
                sf_name=record['sf_name'],
                balance=record['balance'],
                sf_balance_date=record['sf_balance_date'],
                inserted_at=datetime.fromisoformat(record['inserted_at'].replace('Z', '+00:00')),
                source=record['source'],
                category=record['category'],
                display_name=record['display_name'],
                hidden=record['hidden']
            )
            session.merge(account)

        # Import user settings
        print("Importing user settings...")
        for record in data['om_user_settings']:
            settings = UserSetting(
                id=record['id'],
                dark_mode=record['dark_mode'],
                categories=record['categories'],
                sf_last_sync=datetime.fromisoformat(record['sf_last_sync'].replace('Z', '+00:00')),
                created_at=datetime.fromisoformat(record['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(record['updated_at'].replace('Z', '+00:00'))
            )
            session.merge(settings)

        session.commit()
        print("Data import completed successfully!")

        # Print summary
        print("\nImport Summary:")
        print(f"  SimpleFIN tokens: {len(data['om_user_simplefin_tokens'])}")
        print(f"  User accounts: {len(data['om_user_accounts'])}")
        print(f"  User settings: {len(data['om_user_settings'])}")

    except Exception as e:
        print(f"Error importing data: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    engine = create_schema_and_tables()
    create_initial_user(engine)
    import_supabase_data(engine, "supabase_data_export_20250923_163304.json")
    print("Migration completed successfully!")