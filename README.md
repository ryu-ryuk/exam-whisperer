# exam whisperer

a smart ai-powered exam revision assistant that explains concepts, quizzes you, and tracks your topic mastery in real time.

---

## usage 

- from inside backend/

1. install deps 
```sh
uv pip install -r requirements.txt
```

2. to run the sever/ 
```sh
uvicorn main:app --reload
```

3. to test WhisperCLI
```sh
python cli/main.py
```

4. to test pathway 
```sh
python pathway_flow/topic_flow.py
```
---

## testing

use the fastapi swagger docs if you want: http://localhost:8000/docs

---

## preview 

![img](/docs/assets/quiz.png)

---

## why build this?

i am frustrated with LLMs that only *answer* questions, but don’t *help you learn*. when revising, if only there was something that:

* explains doubts clearly and quickly
* generates real quizzes, not random questions
* tracks my learning progress topic-wise
* suggests what to revise next — based on how i’m actually performing

so calls the need for **exam whisperer**.

---

## what it does

* **ask anything**: get clean, concise and student-level explanations for any topic
* **quiz mode**: generate topic-based mcqs or short-answer questions
* **learning tracker**: see where you're improving, and where you’re still weak
* **voice optional**: speak your question and hear the answer (via whisper)
* way more!!
---

## how it works

### backend stack

* `fastapi` – main api framework
* `pathway` – real-time dataflow engine for tracking topic performance
* `openai` or `ollama` – for explanation + quiz generation
* `postgres` – stores question attempts + user logs

### optional modules

* `whisper` – for speech-to-text

---

## how adaptive feedback works

every quiz you take or question you ask gets streamed to `pathway`, which:

* updates your score trends per topic
* detects weak areas and improvement patterns
* lets the app adapt and suggest what to revise next

**example:**

> you take 3 quizzes in modern physics → 40%, 60%, 70%
>
> pathway shows trend: 📉 improving, but not yet mastered
>
> app suggests: “review photoelectric effect again”

---

## file structure

```
exam_whisperer/
├── main.py                # fastapi app entry
├── routes/
│   ├── ask.py            # /ask endpoint → explanation
│   ├── quiz.py           # /quiz, /answer
│   └── progress.py       # /progress → learning stats
├── services/
│   ├── llm.py            # openai/ollama prompt logic
│   └── tracker.py        # sends events to pathway
├── pathway_flow.py       # runs topic mastery tracking
├── models.py             # pydantic schemas
├── db.py                 # database init + access
├── utils.py              # quiz scoring etc
├── voice_modules/        # optional voice features
│   ├── stt.py            # whisper module
│   └── tts.py            # text-to-speech (optional)
├── requirements.txt      # all deps
└── readme.md             # you're reading it
```

---

## api endpoints

| method | endpoint    | description                       |
| ------ | ----------- | --------------------------------- |
| post   | `/ask`      | ask any concept-based question    |
| post   | `/quiz`     | generate quiz by topic/difficulty |
| post   | `/answer`   | submit answers, log performance   |
| get    | `/progress` | see topic-wise mastery            |

---

## setup

```bash
git clone https://github.com/ryu-ryuk/exam-whisperer
cd exam-whisperer
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
uvicorn main:app --reload
```

(optional) to run pathway in a separate process:

```bash
python pathway_flow.py
```

---

## todo

* [ ] leaderboard of students (gamified)
* [ ] spaced repetition suggestion engine
* [ ] frontend

---

## license

