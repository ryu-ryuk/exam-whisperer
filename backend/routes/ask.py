"""
handles the /ask endpoint.

- receives a concept-based question from the user
- queries the llm to generate a clear explanation
- detects the topic from the question
- logs the interaction (user, topic, timestamp)
- streams the event to pathway for topic tracking
"""

from fastapi import APIRouter 
from services.llm import explain_concept
from services.tracker import log_topic_attempt
from models import AskRequest, AskResponse

router = APIRouter()

@router.post("/ask", response_model=AskResponse)
async def ask_question(req: AskRequest):
    explanation, topic = await explain_concept(req.question, req.user_id, req.topic)
    await log_topic_attempt(user_id=req.user_id, topic=topic, source="ask")
    return AskResponse(explanation=explanation, topic=topic)
