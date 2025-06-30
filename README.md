<h1 align="center">
  <img src="https://raw.githubusercontent.com/ryu-ryuk/exam-whisperer/main/docs/assets/whisper.png" width="800" alt="Whisper Banner"/>
  <img src="https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/misc/transparent.png" height="16" width="0px"/>
  
  <span style="color:#4c4f69;">Whisper</span>
</h1>

<h6 align="center" style="color:#5c5f77;">
  a real-time, ai-powered exam revision assistant.
</h6>

<p align="center">
  <a href="https://github.com/ryu-ryuk/exam-whisperer/stargazers">
    <img src="https://img.shields.io/github/stars/ryu-ryuk/exam-whisperer?colorA=eff1f5&colorB=dc8a78&style=for-the-badge&logo=github&logoColor=4c4f69">
  </a>
  <a href="https://github.com/ryu-ryuk/exam-whisperer/issues">
    <img src="https://img.shields.io/github/issues/ryu-ryuk/exam-whisperer?colorA=eff1f5&colorB=d20f39&style=for-the-badge&logo=github&logoColor=4c4f69">
  </a>
  <a href="https://github.com/ryu-ryuk/exam-whisperer/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-40a02b?style=for-the-badge&logo=openaccess&logoColor=eff1f5&colorA=eff1f5">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-Backend-209fb5?style=for-the-badge&logo=fastapi&logoColor=white&colorA=eff1f5" />
  <img src="https://img.shields.io/badge/PostgreSQL-Storage-7287fd?style=for-the-badge&logo=postgresql&logoColor=white&colorA=eff1f5" />
  <img src="https://img.shields.io/badge/Pathway-Real_Time_Analytics-8839ef?style=for-the-badge&logo=data&logoColor=white&colorA=eff1f5" />
  <img src="https://img.shields.io/badge/LLM-OpenAI/Ollama-1e66f5?style=for-the-badge&logo=openai&logoColor=white&colorA=eff1f5" />
  <img src="https://img.shields.io/badge/Speech-Whisper+TTS-e64553?style=for-the-badge&logo=voicemod&logoColor=white&colorA=eff1f5" />
</p>

<p align="center" style="color:#6c6f85; font-size: 14.5px; line-height: 1.6; max-width: 700px; margin: auto;">
  <strong style="color:#4c4f69;">Whisper</strong> is a real-time exam revision agent that helps you learn, not just get answers.<br/>
  It explains concepts, quizzes you, and tracks topic mastery using <span style="color:#1e66f5;">LLMs</span> and <span style="color:#8839ef;">Pathway</span>, all in one feedback loop.<br/><br/>
  <em style="color:#d20f39;">Built with learning, feedback, and mastery in mind — not just chat.</em>
</p>
---

## why whisper?

llm tools answer questions, but they don't **help you learn**.  
whisper does.

- explains doubts clearly  
- quizzes meaningfully by topic  
- tracks learning progress  
- suggests what to revise next  

---

## features

| endpoint | purpose |
|----------|---------|
| `POST /ask`      | clean explanation of any concept |
| `POST /quiz`     | generates mcqs or short-answer sets |
| `POST /answer`   | logs attempts and scores |
| `GET /progress`  | real-time topic mastery tracking |
| `voice support`  | speak your doubts, hear answers (via whisper + tts) |

---

## tech stack

**core backend**
- `fastapi` — web api
- `pathway` — real-time stream processor (learning analytics)
- `postgres` — persistence
- `openai` or `ollama` — model backend (explanations, quizzes)

**optional**
- `whisper` — speech-to-text
- `tts` — voice replies

---

## 🔁 adaptive learning

your actions stream into pathway, which builds a live topic profile:

- score trends (improving, plateauing)
- weak topic detection
- revision suggestions

> **example**  
> vectors quiz scores: 40% → 60% → 70%  
> result: not mastered → "revise dot product again"

---

## 📦 usage

run from the `backend/` folder:

```bash
# build containers
make rebuild

# run server
make up

# run knowledge flow (pathway)
python3 src/pathway_flow/pathway_main.py
```

- open [swagger](http://localhost:8000/docs) for api docs.

## 🐳 docker setup 

- for production 

```sh 
docker compose up --build
```
add your `.env`

```ini
SERVER_PORT=8000
POSTGRES_USER=dev
POSTGRES_PASSWORD=dev
POSTGRES_DB=dev
```

## todo

* enhance and minimalize frontend
* leaderboard & gamification
* spaced repetition engine

## 🖼preview
![preview](docs/assets/quiz.png)

## 📜 license
[MIT](LICENSE) — built by zen with a lot of stress (๑•́‿•̀๑)
