"""
handles /reminders endpoint.

- calculates time since last user interaction per topic
- identifies topics due for revision
- returns gentle reminders for those topics
"""

from fastapi import APIRouter
from services.tracker import get_due_reminders
from models import ReminderResponse

router = APIRouter()

@router.get("/reminders", response_model=ReminderResponse)
async def get_reminders(user_id: str):
    reminders = await get_due_reminders(user_id)
    return ReminderResponse(reminders=reminders)
