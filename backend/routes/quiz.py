"""
handles quiz-related endpoints:

- /quiz: generate a quiz for a given topic and difficulty
- /answer:  evaluate the submitted quiz answers
            log performance and update topic stats via pathway
"""

from fastapi import APIRouter
from services.llm import generate_quiz
from services.tracker import update_topic_stats
from models import QuizRequest, QuizResponse, AnswerRequest, AnswerResponse
from services.quiz_utils import score_quiz
from services.tracker import log_topic_attempt


router = APIRouter()

@router.post("/quiz", response_model=QuizResponse)
async def get_quiz(req: QuizRequest):
    questions = await generate_quiz(req.topic, req.difficulty)
    if not questions:
        print("⚠️  failed to generate quiz")
        return QuizResponse(questions=[])
    return QuizResponse(questions=questions)

@router.post("/answer", response_model=AnswerResponse)
async def submit_answer(req: AnswerRequest):
    score = score_quiz(req.questions, req.answers)
    await log_topic_attempt(user_id=req.user_id, topic=req.topic, score=score, source="quiz")
    return AnswerResponse(score=score)