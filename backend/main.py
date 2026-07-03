import os
import pathlib
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
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

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "supabase_connected": supabase is not None}

# Get the absolute path to the frontend directory
frontend_dir = pathlib.Path(__file__).parent.parent / "frontend"

# Mount the frontend directory at the root so it serves HTML, CSS, and JS files
app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
