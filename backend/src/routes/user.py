from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from db import SessionLocal
from db_models import User, UserSyllabus, UserTopicProgress
from sqlalchemy.exc import SQLAlchemyError
import logging
from src.utils.jwt import hash_password, verify_password

router = APIRouter()

class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    api_key: str = ""

class UserLoginRequest(BaseModel):
    name: str
    password: str

@router.get("/health")
def root():
    return {"msg": "exam whisperer backend running"}

@router.post("/user/register")
def register_user(req: UserCreateRequest):
    db = SessionLocal()
    try:
        logging.info(f"Attempting to register user: name={req.name}, email={req.email}")
        if db.query(User).filter(User.username == req.name).first():
            logging.warning(f"Registration failed: Username already registered: {req.name}")
            raise HTTPException(status_code=400, detail="Username already registered.")
        if db.query(User).filter(User.email == req.email).first():
            logging.warning(f"Registration failed: Email already registered: {req.email}")
            raise HTTPException(status_code=400, detail="Email already registered.")
        user = User(
            username=req.name,
            email=req.email,
            password_hash=hash_password(req.password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logging.info(f"User registered successfully: id={user.id}, username={user.username}, email={user.email}")
        return {"id": user.id, "username": user.username, "email": user.email}
    except SQLAlchemyError as e:
        db.rollback()
        logging.error(f"DB error during registration: {e}")
        raise HTTPException(status_code=500, detail=f"DB error: {e}")
    except Exception as e:
        db.rollback()
        logging.error(f"Unexpected error during registration: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
    finally:
        db.close()

@router.post("/user/login")
def login_user(req: UserLoginRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == req.name).first()
        if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
            logging.warning(f"Login failed for username: {req.name}")
            raise HTTPException(status_code=401, detail="Invalid username or password.")
        logging.info(f"User logged in: id={user.id}, username={user.username}")
        return {"id": user.id, "username": user.username, "email": user.email}
    except Exception as e:
        logging.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Login error: {e}")
    finally:
        db.close()

@router.post("/user/config")
def update_user_config(username: str, llm_provider: str = None, llm_api_key: str = None, llm_model: str = None):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        if llm_provider is not None:
            user.llm_provider = llm_provider
        if llm_api_key is not None:
            user.llm_api_key = llm_api_key
        if llm_model is not None:
            user.llm_model = llm_model
        db.commit()
        db.refresh(user)
        return {"id": user.id, "username": user.username, "email": user.email, "llm_provider": user.llm_provider, "llm_model": user.llm_model}
    finally:
        db.close()

@router.get("/user/{username}")
def get_user(username: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        # Fetch topics and progress
        syllabus = db.query(UserSyllabus).filter(UserSyllabus.username == username).first()
        progress = db.query(UserTopicProgress).filter(UserTopicProgress.username == username).all()
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "llm_provider": user.llm_provider,
            "llm_model": user.llm_model,
            "topics": syllabus.topics_text if syllabus else None,
            "progress": [
                {"topic": p.topic, "latest_score": p.latest_score, "average_score": p.average_score, "last_attempt": p.last_attempt.isoformat(), "trend": p.trend, "status": p.status}
                for p in progress
            ]
        }
    finally:
        db.close()
