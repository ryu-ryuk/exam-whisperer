import json
import logging
from pathlib import Path
from cachetools import TTLCache
from typing import Optional
from services.llm import llm_judge_score, _call_llm, BackendLLMConfig, LLMProviderError
from services.tracker import get_user_context
from services.event_logger import log_user_event
from pathway_flow.stream import stream_topic_event

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
cache = TTLCache(maxsize=1000, ttl=3600)

async def evaluate_quiz_answer(
    user_id: str,
    topic: str,
    question_index: int,
    user_answer: str,
    question: dict,
    num_questions: int = 1,
    difficulty: str = "medium",
    llm_config: Optional[BackendLLMConfig] = None
) -> dict:
    """
    Evaluate a single question's answer and return correctness + feedback.
    Also logs to Pathway for real-time adaptation.
    """
    correct_answer_id = question.get("correctAnswerId")
    options = question.get("options", [])
    
    # Map correct answer ID to text for judging
    correct_answer_text = next((opt['text'] for opt in options if opt['id'] == correct_answer_id), None)
    user_answer_text = next((opt['text'] for opt in options if opt['id'] == user_answer), None)

    if correct_answer_id is None or not options or correct_answer_text is None:
        raise ValueError("Invalid question object: missing correct answer ID or options.")
    if user_answer_text is None:
        raise ValueError("User answer ID not found in options.")

    is_correct = (user_answer == correct_answer_id)
    user_context = get_user_context(username=user_id, topic=topic)

    # Use LLM to generate more nuanced feedback if needed, passing llm_config
    feedback_prompt = (
        f"Topic: {topic}\n"
        f"Question: {question['question']}\n" # Use 'question' key from structured question
        f"User's answer: {user_answer_text}\n"
        f"Correct answer: {correct_answer_text}\n"
        f"User context: {json.dumps(user_context, indent=2) or '[No context available]'}\n\n"
        "Explain why the user's answer is incorrect and why the correct answer is correct. "
        "Use user context if helpful. Keep it concise (50-100 words)."
    )
    
    try:
        feedback = await _call_llm(feedback_prompt, llm_config=llm_config, temperature=0.7, max_tokens=200) # Use LLM Config for feedback
        
        score = await llm_judge_score(
            question=question["question"], # Use 'question' key from structured question
            correct_answer=correct_answer_text,
            user_answer=user_answer_text,
            context=user_context,
            llm_config=llm_config
        )
        
        # Log to Pathway for real-time adaptation
        await stream_topic_event(user_id, topic, score)
        # Log user event for quiz evaluation
        log_user_event(user_id, "quiz_evaluate", topic, {
            "question": question["question"],
            "user_answer": user_answer_text,
            "correct_answer": correct_answer_text,
            "is_correct": is_correct,
            "score": score,
            "feedback": feedback.strip(),
            "question_index": question_index,
            "difficulty": difficulty
        })

        return {
            "correct": is_correct,
            "feedback": feedback.strip(),
            "correct_answer": {
                "id": correct_answer_id,
                "text": correct_answer_text
            },
            "user_answer": {
                "id": user_answer,
                "text": user_answer_text
            }
        }
    except LLMProviderError as e:
        logging.error(f"Feedback/Judging generation error: {str(e)}")
        # Provide a fallback feedback if LLM fails
        return {
            "correct": is_correct,
            "feedback": f"Could not generate detailed feedback. Error: {str(e)}",
            "correct_answer": {
                "id": correct_answer_id,
                "text": correct_answer_text
            },
            "user_answer": {
                "id": user_answer,
                "text": user_answer_text
            }
        }
    except Exception as e:
        logging.exception(f"Unexpected error in evaluate_quiz_answer: {e}")
        raise
