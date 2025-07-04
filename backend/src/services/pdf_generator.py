import logging
import os
import asyncio
from fpdf import FPDF
from services.llm import get_summary 
from services.quiz_utils import generate_quiz
from services.tracker import get_user_context

async def create_topic_pdf(user_id: str, topic: str) -> str:
    """Generate a revision capsule PDF with user notes, summary, quiz, and recommendations."""
    try:
        # 1. Build the context
        context = get_user_context(user_id, topic)
        
        # 2. Fetch summary and generate quiz concurrently
        summary_task = get_summary(topic, context)
        quiz_task = generate_quiz(topic, difficulty="medium", num_questions=5)
        summary, quiz = await asyncio.gather(summary_task, quiz_task)

        # 3. Initialize PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=14, style='B')
        pdf.cell(0, 10, f"Revision Capsule: {topic}", ln=True, align='C')

        # 4. Notes section
        pdf.ln(5)
        pdf.set_font("Arial", 'B', size=12)
        pdf.cell(0, 8, "Your Notes:", ln=True)
        pdf.set_font("Arial", size=11)
        notes = context.get("notes", "").strip() or "[No personal notes]"
        pdf.multi_cell(0, 8, notes)

        # 5. LLM Summary
        pdf.ln(3)
        pdf.set_font("Arial", 'B', size=12)
        pdf.cell(0, 8, "AI‑Generated Summary:", ln=True)
        pdf.set_font("Arial", size=11)
        pdf.multi_cell(0, 8, summary or "Summary generation failed.")

        # 6. Quiz History (past attempts)
        history = context.get("quiz_history", [])
        if history:
            pdf.ln(3)
            pdf.set_font("Arial", 'B', size=12)
            pdf.cell(0, 8, "Past Quiz Attempts:", ln=True)
            pdf.set_font("Arial", size=11)
            for idx, entry in enumerate(history[-5:], 1):
                score = entry.get("score", "N/A")
                ts = entry.get("timestamp", "")
                pdf.cell(0, 7, f"{idx}. Score: {score}  |  At: {ts}", ln=True)

        # 7. Latest Quiz Questions from generate_quiz
        if quiz and "questions" in quiz:
            pdf.ln(3)
            pdf.set_font("Arial", 'B', size=12)
            pdf.cell(0, 8, "Practice Quiz:", ln=True)
            pdf.set_font("Arial", size=11)
            
            for i, q_data in enumerate(quiz["questions"], 1):
                question = q_data.get("question", f"Question {i}")
                options = q_data.get("options", [])
                explanation = q_data.get("explanation", "")
                
                pdf.ln(3)
                pdf.cell(0, 7, f"{i}. {question}", ln=True)
                for idx, option in enumerate(options):
                    pdf.cell(0, 7, f"- {chr(97 + idx)}. {option}", ln=True)
                pdf.cell(0, 7, f"Explanation: {explanation}", ln=True)

        # 8. Related Topics Suggestions
        prefs = context.get("preferences", {})
        related = prefs.get("related_topics", [])
        if related:
            pdf.ln(3)
            pdf.set_font("Arial", 'B', size=12)
            pdf.cell(0, 8, "Suggested Related Topics:", ln=True)
            pdf.set_font("Arial", size=11)
            for t in related:
                pdf.cell(0, 7, f"- {t}", ln=True)

        # 9. Save PDF to disk
        out_dir = "data/pdfs"
        os.makedirs(out_dir, exist_ok=True)
        safe_topic = topic.replace(" ", "_")
        pdf_path = os.path.join(out_dir, f"{user_id}_{safe_topic}.pdf")
        pdf.output(pdf_path)
        
        return pdf_path

    except Exception as e:
        logging.error(f"PDF generation failed: {str(e)}")
        raise

# Example usage:
# asyncio.run(create_topic_pdf("user123", "Quantum Computing"))
