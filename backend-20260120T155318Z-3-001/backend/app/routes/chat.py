from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.ai_services import generate_ai_reply
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter()  # REMOVE prefix here since it's set in main.py

class ChatRequest(BaseModel):
    message: str

@router.post("/ask")
async def ask_chatbot(request: ChatRequest, user: User = Depends(get_current_user)):
    print(f"CHAT REQUEST from {user.email}: {request.message}")
    
    # Generate AI reply
    reply = generate_ai_reply(f"User ({user.email}) asks: {request.message}")
    
    return {"reply": reply, "user": user.email}