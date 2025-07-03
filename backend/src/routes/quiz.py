from fastapi import APIRouter, HTTPException, Body, Request
from services.quiz_utils import evaluate_quiz_answer
from services.event_logger import log_user_event
import logging
import json

from services.llm import generate_quiz as llm_generate_quiz, LLMProviderError
from src.models import QuizCreateRequest, QuizEvaluateRequest, BackendLLMConfig

router = APIRouter()

@router.post("/quiz")
async def create_quiz_question(request_data: QuizCreateRequest):
    """
    Generate a single, LLM-driven quiz question for a given topic and difficulty.
    """
    try:
        topic_for_llm = request_data.topic if request_data.topic is not None else ""
        
        if not isinstance(request_data.llm_config, BackendLLMConfig):
            logging.error(f"Invalid llm_config received: {request_data.llm_config}")
            raise HTTPException(status_code=400, detail="Invalid LLM configuration format.")

        quiz_question_response = await llm_generate_quiz(
            topic=topic_for_llm,
            difficulty=request_data.difficulty,
            llm_config=request_data.llm_config,
        )
        log_user_event(request_data.username, "quiz_question_generated", request_data.topic, {
            "difficulty": request_data.difficulty,
            "question": quiz_question_response.get("question", "N/A"),
            "llm_provider": request_data.llm_config.provider
        })
        return quiz_question_response
    except LLMProviderError as e:
        detail_msg = str(e)
        status_code = 500
        if "API Key is missing" in detail_msg or "authentication" in detail_msg or "invalid_api_key" in detail_msg.lower():
            status_code = 401
        raise HTTPException(status_code=status_code, detail=detail_msg)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.exception(f"Error generating quiz question: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error generating quiz: {str(e)}")


@router.post("/quiz/evaluate")
async def evaluate_answer(request_data: QuizEvaluateRequest):
    """
    Evaluate a single quiz question's answer using optional LLM evaluation.
    """
    try:
        
        return await evaluate_quiz_answer(
            username=request_data.username,
            topic=request_data.topic,
            question_index=request_data.question_index,
            user_answer=request_data.user_answer,
            question=request_data.question,
            num_questions=request_data.num_questions,
            difficulty=request_data.difficulty,
            llm_config=request_data.llm_config
        )
    except Exception as e:
        logging.exception(f"Error evaluating quiz answer: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error evaluating quiz: {str(e)}")