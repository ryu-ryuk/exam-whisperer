"""
handles the /progress endpoint.

- fetches user’s topic-wise performance
- returns mastery level, improvement trends, and last interaction
"""
from fastapi import APIRouter
from services.tracker import get_user_progress_from_pathway
from models import ProgressResponse

router = APIRouter()

@router.get("/progress", response_model=ProgressResponse)
async def get_progress(user_id: str):
    progress = get_user_progress_from_pathway(user_id)
    return progress