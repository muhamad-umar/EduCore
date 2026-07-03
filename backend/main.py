import os
import pathlib
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from supabase import create_client, Client
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Student Management System API")

class ChatRequest(BaseModel):
    message: str

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# Initialize Supabase client if credentials exist
supabase: Client = None
if url and key:
    supabase = create_client(url, key)

@app.post("/api/chat")
async def chat_with_bot(req: ChatRequest):
    # Dummy logic to simulate an AI response
    user_msg = req.message.lower()
    reply = "I'm your AI assistant! (This is a placeholder response. Connect me to an LLM API!)"
    
    if "student" in user_msg:
        reply = "You can manage students by navigating to the Students tab. Need me to look someone up?"
    elif "course" in user_msg:
        reply = "I see you're asking about courses. You can add or edit courses in the Courses tab."
    elif "hello" in user_msg or "hi" in user_msg:
        reply = "Hello there! How can I assist you with EduCore today?"

    import asyncio
    await asyncio.sleep(0.5) # Simulate network delay
    return {"reply": reply}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "supabase_connected": supabase is not None}

# Get the absolute path to the frontend directory
frontend_dir = pathlib.Path(__file__).parent.parent / "frontend"

# Mount the frontend directory at the root so it serves HTML, CSS, and JS files
app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
