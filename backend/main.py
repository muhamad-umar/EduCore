import os
from fastapi import FastAPI
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Student Management System API")

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# Initialize Supabase client if credentials exist
supabase: Client = None
if url and key:
    supabase = create_client(url, key)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Student Management System API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "supabase_connected": supabase is not None}
