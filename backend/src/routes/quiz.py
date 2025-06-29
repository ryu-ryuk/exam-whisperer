"""
handles quiz-related endpoints:

- /quiz: generate a quiz for a given topic and difficulty
- /answer:  evaluate the submitted quiz answers
            log performance and update topic stats via pathway
"""

from fastapi import APIRouter, HTTPException, Body, Request
from services.quiz_utils import generate_quiz, evaluate_quiz_answer, get_quiz_question
from services.event_logger import log_user_event
import logging
import json

router = APIRouter()

@router.post("/quiz")
async def create_quiz(topic: str, difficulty: str = "medium", num_questions: int = 3):
    log_user_event("anonymous", "quiz_create", topic, {"difficulty": difficulty, "num_questions": num_questions})
    """
    Generate a quiz for a given topic, difficulty, and number of questions.
    The topic must be chosen by the user (not LLM-inferred).
    """
    try:
        return await generate_quiz(topic, difficulty, num_questions)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/quiz/evaluate")
async def evaluate_answer(
    request: Request,
    user_id: str,
    topic: str,
    question_index: int,
    user_answer: int,
    num_questions: int = 1,
    difficulty: str = "medium"
):
    log_user_event(user_id, "quiz_evaluate", topic, {"question_index": question_index, "user_answer": user_answer, "difficulty": difficulty})
    """
    Evaluate a single quiz question's answer. Accepts a single question object and quiz context.
    """
    try:
        # Parse only the 'question' object from the request body, ignore extra data
        body = await request.json()
        question = body["question"] if isinstance(body, dict) and "question" in body else None
        logging.info(f"/quiz/evaluate received question: {json.dumps(question)}")
        if not question:
            raise ValueError("Missing 'question' in request body.")
        return await evaluate_quiz_answer(
            user_id=user_id,
            topic=topic,
            question_index=question_index,
            user_answer=user_answer,
            question=question,
            num_questions=num_questions,
            difficulty=difficulty
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/quiz/ask")
async def ask_quiz_question(
    topic: str,
    difficulty: str = "medium",
    num_questions: int = 3,
    question_index: int = 0
):
    log_user_event("anonymous", "quiz_ask", topic, {"difficulty": difficulty, "num_questions": num_questions, "question_index": question_index})
    """
    Serve a single quiz question by index for a given topic, difficulty, and total number of questions.
    The topic and number of questions must be user-selected and validated.
    """
    try:
        question = await get_quiz_question(topic, difficulty, num_questions, question_index)
        return {"question": question, "question_index": question_index, "num_questions": num_questions, "topic": topic, "difficulty": difficulty}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")