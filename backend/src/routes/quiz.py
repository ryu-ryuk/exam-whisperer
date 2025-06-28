"""
handles quiz-related endpoints:

- /quiz: generate a quiz for a given topic and difficulty
- /answer:  evaluate the submitted quiz answers
            log performance and update topic stats via pathway
"""

from fastapi import APIRouter, HTTPException
from services.quiz_utils import generate_quiz, evaluate_quiz_answer

router = APIRouter()

@router.post("/quiz")
async def create_quiz(topic: str, difficulty: str = "medium"):
    try:
        return await generate_quiz(topic, difficulty)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/quiz/evaluate")
async def evaluate_answer(user_id: str, topic: str, question_index: int, user_answer: int, quiz_data: dict):
    try:
        return await evaluate_quiz_answer(user_id, topic, question_index, user_answer, quiz_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")