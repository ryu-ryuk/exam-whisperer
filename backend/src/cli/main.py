from textual.app import App, ComposeResult
from textual.widgets import Input, Header, Footer, Static
from rich.markdown import Markdown
import httpx
import asyncio

API_URL = "http://localhost:8000"


class OutputBox(Static):
    def update_output(self, explanation: str, topic: str):
        content = f"**Topic:** {topic}\n\n**Explanation:**\n{explanation}" if explanation.strip() else "No explanation available."
        self.update(Markdown(content))

    def show_quiz(self, questions):
        quiz_md = "\n\n".join([
            f"Q{i+1}. {q['question']}\n\n" + "\n".join([f"- [{j+1}] {opt}" for j, opt in enumerate(q['options'])])
            for i, q in enumerate(questions)
        ])
        self.update(Markdown(f"**Quiz:**\n\n{quiz_md}"))


    def show_quiz_result(self, score: float):
        self.update(Markdown(f"**Quiz Score:** {score * 100:.0f}%"))

MOCHA = {
    "base": "#1e1e2e",
    "mantle": "#181825",
    "crust": "#11111b",
    "surface0": "#313244",
    "surface1": "#45475a",
    "surface2": "#585b70",
    "overlay0": "#6c7086",
    "overlay1": "#7f849c",
    "overlay2": "#9399b2",
    "text": "#cdd6f4",
    "subtext0": "#a6adc8",
    "subtext1": "#bac2de",
    "rosewater": "#f5e0dc",
    "flamingo": "#f2cdcd",
    "pink": "#f5c2e7",
    "mauve": "#cba6f7",
    "red": "#f38ba8",
    "maroon": "#eba0ac",
    "peach": "#fab387",
    "yellow": "#f9e2af",
    "green": "#a6e3a1",
    "teal": "#94e2d5",
    "sky": "#89dceb",
    "sapphire": "#74c7ec",
    "blue": "#89b4fa",
    "lavender": "#b4befe"
}

class WhisperCLI(App):
    CSS = f"""
    Screen {{
        background: {MOCHA['base']};
        color: {MOCHA['text']};
    }}
    Header, Footer {{
        background: {MOCHA['mantle']};
        color: {MOCHA['text']};
        border: none;
    }}
    Input {{
        background: {MOCHA['surface0']};
        color: {MOCHA['text']};
        border: solid {MOCHA['overlay1']};
    }}
    Input:focus {{
        border: solid {MOCHA['lavender']};
        color: {MOCHA['text']};
    }}
    #output {{
        background: {MOCHA['mantle']};
        color: {MOCHA['text']};
        border: solid {MOCHA['surface1']};
        padding: 1;
        margin: 1;
    }}
    Button {{
        background: {MOCHA['surface1']};
        color: {MOCHA['text']};
        border: solid {MOCHA['blue']};
    }}
    Button:hover {{
        background: {MOCHA['blue']};
        color: {MOCHA['mantle']};
    }}
    """
    
    
    topic = ""
    explanation = ""
    user_id = "test"
    quiz_questions = []
    quiz_mode = False

    def compose(self) -> ComposeResult:
        yield Header()
        yield Input(placeholder="Ask anything... (type 'quiz' for a quiz)", id="input")
        yield OutputBox(id="output")
        yield Footer()

    async def on_input_submitted(self, event: Input.Submitted):
        question = event.value.strip()
        if not question:
            return

        out = self.query_one(OutputBox)
        event.input.value = ""

        if self.quiz_mode:
            try:
                ans = int(question)
                self.user_answers.append(ans)
                if len(self.user_answers) < len(self.quiz_questions):
                    q = self.quiz_questions[len(self.user_answers)]
                    quiz_md = f"Q{len(self.user_answers)+1}. {q['question']}\n\n" + "\n".join([f"- [{idx + 1}] {opt}" for idx, opt in enumerate(q['options'])])
                    out.update(Markdown(f"**Quiz:**\n\n{quiz_md}"))

                else:
                    out.update_output("Submitting answers...", self.topic)
                    try:
                        async with httpx.AsyncClient() as client:
                            submit_res = await client.post(
                                f"{API_URL}/answer",
                                json={
                                    "user_id": self.user_id,
                                    "topic": self.topic,
                                    "questions": self.quiz_questions,
                                    "answers": self.user_answers
                                }
                            )
                            score = submit_res.json().get("score", 0)
                            out.show_quiz_result(score)
                    except Exception as e:
                        out.update_output(f"Error submitting quiz: {str(e)}", self.topic)
                    finally:
                        self.quiz_mode = False
            except Exception:
                out.update_output("Please enter a valid answer index (0-3)", self.topic)
            return

        if question.lower() == "quiz":
            if not self.topic:
                out.update_output("Ask a question first to set the topic!", "quiz")
                return

            out.update_output("Generating quiz...", self.topic)
            try:
                async with httpx.AsyncClient() as client:
                    quiz_res = await client.post(
                        f"{API_URL}/quiz",
                        json={
                            "user_id": self.user_id,
                            "topic": self.topic,
                            "difficulty": "easy"
                        }
                    )
                    self.quiz_questions = quiz_res.json().get("questions", [])
                    if not self.quiz_questions:
                        out.update_output("Quiz failed or returned empty questions", self.topic)
                        return

                    self.user_answers = []
                    self.quiz_mode = True
                    q = self.quiz_questions[0]
                    quiz_md = f"Q1. {q['question']}\n\n" + "\n".join([f"- [{idx + 1}] {opt}" for idx, opt in enumerate(q['options'])])
                    out.update(Markdown(f"**Quiz:**\n\n{quiz_md}"))
            except Exception as e:
                out.update_output(f"Quiz error: {str(e)}", self.topic)
            return

        out.update_output("Loading...", "...")
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    f"{API_URL}/ask",
                    json={"user_id": self.user_id, "question": question}
                )
                data = res.json()
                self.topic = data.get("topic", "Unknown")
                self.explanation = data.get("explanation", "No explanation available.")
                out.update_output(self.explanation, self.topic)
        except Exception as e:
            out.update_output(f"Error: {str(e)}", "error")

if __name__ == "__main__":
    asyncio.run(WhisperCLI().run_async())
