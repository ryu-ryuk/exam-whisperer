"""
handles the /progress endpoint.

- fetches user’s topic-wise performance
- returns mastery level, improvement trends, and last interaction
"""
from fastapi import APIRouter, HTTPException
from services.tracker import get_user_progress_from_db
from models import ProgressResponse

router = APIRouter()



@router.get("/progress", response_model=ProgressResponse)
async def get_progress(user_id: str):
    data = get_user_progress_from_db(user_id)
    if data["topics"] == []:
        raise HTTPException(status_code=404, detail="No progress found")
        pass
    return data
