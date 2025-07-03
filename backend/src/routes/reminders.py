"""
handles /reminders endpoint.

- calculates time since last user interaction per topic
- identifies topics due for revision
- returns gentle reminders for those topics
"""

from fastapi import APIRouter
from services.tracker import get_due_reminders
from services.event_logger import log_user_event
from models import ReminderResponse

router = APIRouter()

@router.get("/reminders", response_model=ReminderResponse)
async def get_reminders(username: str):
    log_user_event(username, "reminders_view", None)
    reminders = await get_due_reminders(username)
    return ReminderResponse(reminders=reminders)
