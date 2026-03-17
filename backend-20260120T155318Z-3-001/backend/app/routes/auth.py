from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.db import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.core.auth import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from app.core.email import send_email # Import email utility
from pydantic import BaseModel
from typing import Optional

router = APIRouter()  # REMOVE prefix="/auth" here!

security = HTTPBearer(auto_error=False)

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# Keep OPTIONS handler
@router.options("/{path:path}")
async def options_handler(path: str):
    from fastapi import Response
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Update the dependency to use credentials.credentials
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), 
    db: Session = Depends(get_db)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token = credentials.credentials  # FIX: use .credentials attribute
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/register", response_model=UserOut)
def register(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_pwd,
        full_name=user_data.full_name,
        age=user_data.age,
        gender=user_data.gender,
        height_cm=user_data.height_cm,
        weight_kg=user_data.weight_kg,
        activity_level=user_data.activity_level
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send Welcome Email
    subject = "Welcome to AI Gym Pro! 🚀"
    html_content = f"""
    <h1>Welcome, {new_user.full_name}!</h1>
    <p>We are thrilled to have you join AI Gym Pro - The Ultimate Fitness Ecosystem.</p>
    <p>Get ready to crush your goals with our AI-powered diet plans and workout tracking.</p>
    <br>
    <p>Stay Hard,</p>
    <p><b>AI Gym Team</b></p>
    """
    background_tasks.add_task(send_email, new_user.email, subject, html_content)
    
    return new_user

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email})

    # Send Login Notification
    subject = "New Login Detected 🔐"
    html_content = f"""
    <p>Hello {user.full_name},</p>
    <p>We detected a new login to your AI Gym Pro account just now.</p>
    <p>If this was you, keep crushing it! 💪</p>
    <p>If not, please contact support immediately.</p>
    """
    background_tasks.add_task(send_email, user.email, subject, html_content)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut.from_orm(user)
    }

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user