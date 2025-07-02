import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy import select
from sqlalchemy.orm import Session, session

from utils.jwt import create_access_token
from db import SessionLocal
from db_models import User

router = APIRouter(prefix="/oauth")

class GoogleAuthRequest(BaseModel):
    token: str

@router.post("/google")
def signin_with_google(payload: GoogleAuthRequest):
    try:
        # Verify the token
        id_info = id_token.verify_oauth2_token(
            payload.token,
            requests.Request(),
            audience=os.environ.get("GOOGLE_CLIENT_ID")  # This must match exactly
        )
        email = id_info.get("email")

        
        stmt = select(User).where(User.email==email)
        session = SessionLocal()
        user = session.execute(stmt).scalar_one_or_none()
        if not user: 
            user = User(email=email)
            session.add(user)
            session.commit()
            session.refresh(user)

        user_id = user.id
        token = create_access_token({"id":user_id})
        return { "token" : token }


    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

