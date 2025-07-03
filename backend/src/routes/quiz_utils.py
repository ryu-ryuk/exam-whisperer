#
# import json
# import logging
# from pathlib import Path
# from cachetools import TTLCache
# from services.llm import llm_judge_score
#
# from services.tracker import get_user_context
# from pathway_flow.stream import stream_topic_event
#
# logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
# cache = TTLCache(maxsize=1000, ttl=3600)
#
# class LLMProviderError(Exception):
#     pass
#
# async def generate_quiz(topic: str, difficulty: str = "medium", num_questions: int = 3) -> dict:
#     """Generate a user-controlled number of MCQ quiz questions with explanations."""
#     if not topic.strip():
#         raise ValueError("Topic cannot be empty.")
#     if difficulty.lower() not in ["easy", "medium", "hard"]:
#         raise ValueError("Difficulty must be 'easy', 'medium', or 'hard'.")
#     if not (1 <= num_questions <= 20):
#         raise ValueError("num_questions must be between 1 and 20.")
#
#     cache_key = (topic, difficulty, num_questions)
#     if cache_key in cache:
#         logging.info(f"Cache hit for quiz: {cache_key}")
#         return cache[cache_key]
#
#     prompt = (
#         f"Generate a {difficulty} level multiple choice quiz on the topic: {topic}.\n"
#         f"Return exactly {num_questions} questions in this format:\n\n"
#         "Question: <question text>\n"
#         "- a: <option a>\n- b: <option b>\n- c: <option c>\n- d: <option d>\n"
#         "Answer: <0/1/2/3>\n"
#         "Explanations:\n"
#         "- a: <why a is correct or incorrect>\n"
#         "- b: <why b is correct or incorrect>\n"
#         "- c: <why c is correct or incorrect>\n"
#         "- d: <why d is correct or incorrect>\n\n"
#         "NO additional formatting. Plain text only."
#     )
#     from services.llm import _call_llm
#     try:
#         raw = await _call_llm(prompt)
#         quiz_data = parse_quiz_text(raw)
#         cache[cache_key] = quiz_data
#         logging.info(f"Generated quiz for topic: {topic}, difficulty: {difficulty}, num_questions: {num_questions}")
#         return quiz_data
#     except LLMProviderError as e:
#         logging.error(f"Quiz generation error: {str(e)}")
#         return {"error": str(e), "questions": []}
#
# def parse_quiz_text(raw: str) -> dict:
#     """Convert LLM's plain text quiz into structured dict."""
#     questions = []
#     current_question = {}
#     current_explanations = {}
#     lines = raw.strip().split("\n")
#     i = 0
#
#     while i < len(lines):
#         line = lines[i].strip()
#         if line.startswith("Question:"):
#             if current_question:
#                 current_question["explanations"] = current_explanations
#                 questions.append(current_question)
#             current_question = {"text": line[9:].strip(), "options": [], "answer": None}
#             current_explanations = {}
#         elif line.startswith("- a:") or line.startswith("- b:") or line.startswith("- c:") or line.startswith("- d:"):
#             option_key = line[2:3]
#             option_text = line[4:].strip()
#             current_question["options"].append(option_text)
#             if i + 1 < len(lines) and not lines[i + 1].startswith("-") and not lines[i + 1].startswith("Answer:"):
#                 explanation_line = lines[i + 1].strip()
#                 current_explanations[option_key] = explanation_line[4:].strip() if explanation_line.startswith("-") else explanation_line
#                 i += 1
#             else:
#                 current_explanations[option_key] = ""
#         elif line.startswith("Answer:"):
#             current_question["answer"] = int(line[7:].strip())
#         elif line.startswith("Explanations:"):
#             pass  # skip
#         i += 1
#
#     if current_question:
#         current_question["explanations"] = current_explanations
#         questions.append(current_question)
#
#     return {"questions": questions}
#
# async def evaluate_quiz_answer(
#     user_id: str,
#     topic: str,
#     question_index: int,
#     user_answer: int,
#     question: dict,
#     num_questions: int = 1,
#     difficulty: str = "medium"
# ) -> dict:
#     """
#     Evaluate a single question's answer and return correctness + feedback. Also logs to Pathway for real-time adaptation.
#     Accepts a single question object and quiz context.
#     """
#     correct_answer = question.get("answer")
#     options = question.get("options", [])
#     if correct_answer is None or not options:
#         raise ValueError("Invalid question object: missing answer or options.")
#     if not (0 <= user_answer < len(options)):
#         raise ValueError("user_answer index out of range.")
#     user_context = get_user_context(user_id, topic)
#
#     feedback_prompt = (
#         f"Topic: {topic}\n"
#         f"Question: {question['text']}\n"
#         f"User's answer: {chr(97 + user_answer)} ({options[user_answer]})\n"
#         f"Correct answer: {chr(97 + correct_answer)} ({options[correct_answer]})\n"
#         f"User context: {json.dumps(user_context, indent=2) or '[No context available]'}\n\n"
#         "Explain why the user's answer is incorrect and why the correct answer is correct. "
#         "Use user context if helpful. Keep it concise (50-100 words)."
#     )
#     from services.llm import _call_llm
#     try:
#         feedback = await _call_llm(feedback_prompt)
#         # append quiz performance to local jsonl
#         with Path("data/topic_attempts.jsonl").open("a", encoding="utf-8") as f:
#             f.write(json.dumps({
#                 "user_id": user_id,
#                 "type": "quiz_history",
#                 "topic": topic,
#                 "performance": {
#                     "question": question["text"],
#                     "correct": user_answer == correct_answer,
#                     "user_answer": user_answer,
#                     "correct_answer": correct_answer
#                 }
#             }) + "\n")
#         # log to Pathway using LLM-judged score
#         score = await llm_judge_score(
#             question=question["text"],
#             correct_answer=options[correct_answer],
#             user_answer=options[user_answer],
#             context=user_context
#         )
#         stream_topic_event(user_id, topic, score)
#         return {
#             "correct": user_answer == correct_answer,
#             "feedback": feedback.strip(),
#             "correct_answer": {
#                 "index": correct_answer,
#                 "text": options[correct_answer]
#             },
#             "user_answer": {
#                 "index": user_answer,
#                 "text": options[user_answer]
#             }
#         }
#     except LLMProviderError as e:
#         logging.error(f"Feedback generation error: {str(e)}")
#         return {"error": str(e), "correct": False}
#
# async def get_quiz_question(topic: str, difficulty: str = "medium", num_questions: int = 3, question_index: int = 0) -> dict:
#     """Fetch a single quiz question by index for a given topic, difficulty, and total number of questions."""
#     quiz_data = await generate_quiz(topic, difficulty, num_questions)
#     questions = quiz_data.get("questions", [])
#     if not questions:
#         raise ValueError("No questions available for this topic.")
#     if not (0 <= question_index < len(questions)):
#         raise ValueError(f"question_index must be between 0 and {len(questions)-1}.")
#     return questions[question_index]
