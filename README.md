

# whisper

a smart, ai-powered revision assistant that **explains concepts**, **quizzes you**, and **tracks your mastery** in real time. built for serious exam prep — not just casual chatting.

---

## usage

from inside `backend/`:

```bash

# build the containers
make rebuild

# run the server
make up

# run pathway knowledge and progress flow
python3 backend/src/pathway_flow/pathway_main.py

```

---

🌐 preview




---

💭 why build this?

existing llm tools just answer questions — they don’t help you learn.

whisper was born out of this frustration. when you're actually revising, you need something that:

explains doubts cleanly

asks meaningful quizzes

tracks performance by topic

recommends what to revise next



---

## what it does

`/ask` → get clean, concise explanations (via llm)

`/quiz` → generate topic-based mcqs or short-answer sets

`/answer` → log your attempts and compute your scores

`/progress` → see topic-wise mastery in real time

`voice` ![] → speak your doubts and hear responses via whisper



---

⚙ how it works

backend stack

fastapi — lightweight api framework

pathway — stream-based engine for real-time learning analytics

openai or ollama — for answers + quizzes

postgres — stores user attempts, logs, and trends


optional modules

whisper — convert voice input to text

tts — read out responses to the user



---

📊 adaptive feedback

all your actions stream into pathway, which updates your learning model:

computes trends (e.g. score improvement, stagnation)

flags weak spots automatically

recommends next-best topics to revise


example:

> quiz attempts in vectors → scores: 40%, 60%, 70%
→ not mastered yet, app suggests: “revise dot product again”




---

📂 file structure
```
backend/
├── main.py                  # fastapi entrypoint
├── routes/                  # api endpoints
│   ├── ask.py
│   ├── quiz.py
│   └── progress.py
├── services/                # core logic
│   ├── llm.py               # model prompt formatting
│   └── tracker.py           # stream updates to pathway
├── pathway_flow/
│   └── topic_flow.py        # pathway app (runs separately)
├── models.py                # pydantic schemas
├── db.py                    # db session + init
├── utils.py                 # misc utils (e.g., scoring)
├── voice_modules/
│   ├── stt.py               # whisper-based voice input
│   └── tts.py               # optional voice output
├── cli/
│   └── main.py              # whispercli interface
├── requirements.txt
└── readme.md                # this file
```

---

🧪 testing

api docs: http://localhost:8000/docs


---

🌐 api endpoints

method	endpoint	description

POST	/ask	ask anything, get explanation
POST	/quiz	get a quiz on a given topic
POST	/answer	submit answers and track score
GET	/progress	topic-wise performance stats



---

🧱 docker setup (optional)

if you're deploying:

docker compose up --build

add ENV vars in .env:

SERVER_PORT=8000
POSTGRES_USER=dev
POSTGRES_PASSWORD=dev
POSTGRES_DB=dev

open port 8000 on your vm or reverse proxy via traefik/nginx.


---

🔮 todo

[ ] frontend (vite/next)

[ ] gamified leaderboard (ranked students)

[ ] spaced repetition engine



---

📜 license

MIT — built with ♥ by zen
