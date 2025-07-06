<h1 align="center" style="background-color:#1e1e2e; padding: 12px 0; border-radius: 12px;">
  <img src="https://raw.githubusercontent.com/ryu-ryuk/exam-whisperer/main/docs/assets/whisper.png" width="480" alt="Whisper Banner" />
  <br/>
  <span style="color:#cdd6f4; font-size: 28px;">Whisper</span>
</h1>

<h6 align="center" style="color:#5c5f77; margin-top: -12px;">
  a real-time, ai-powered exam revision assistant.
</h6>

<p align="center">
  <a href="https://github.com/ryu-ryuk/exam-whisperer/stargazers">
    <img src="https://img.shields.io/github/stars/ryu-ryuk/exam-whisperer?colorA=1e1e2e&colorB=cba6f7&style=for-the-badge&logo=github&logoColor=cdd6f4">
  </a>
  <a href="https://github.com/ryu-ryuk/exam-whisperer/issues">
    <img src="https://img.shields.io/github/issues/ryu-ryuk/exam-whisperer?colorA=1e1e2e&colorB=f38ba8&style=for-the-badge&logo=github&logoColor=cdd6f4">
  </a>
  <a href="https://github.com/ryu-ryuk/exam-whisperer/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-a6e3a1?style=for-the-badge&logo=openaccess&logoColor=1e1e2e&colorA=1e1e2e">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-Backend-89b4fa?style=for-the-badge&logo=fastapi&logoColor=white&colorA=1e1e2e" />
  <img src="https://img.shields.io/badge/PostgreSQL-DB-b4befe?style=for-the-badge&logo=postgresql&logoColor=white&colorA=1e1e2e" />
  <img src="https://img.shields.io/badge/Pathway-Real_Time-cba6f7?style=for-the-badge&logo=databricks&logoColor=white&colorA=1e1e2e" />
  <img src="https://img.shields.io/badge/LLM-OpenAI/Ollama/Gemini-74c7ec?style=for-the-badge&logo=openai&logoColor=white&colorA=1e1e2e" />
</p>

<p align="center" style="color:#bac2de; font-size: 14.5px; line-height: 1.6; max-width: 700px; margin: auto;">
  <strong style="color:#cdd6f4;">Whisper</strong> is a real-time exam revision agent that helps you <em>learn</em>, not just get answers.<br/>
  it explains concepts, quizzes you, and tracks topic mastery using <span style="color:#89b4fa;">LLMs</span> and <span style="color:#cba6f7;">Pathway</span> in a continuous feedback loop.<br/><br/>
  <em style="color:#f38ba8;">not a chatbot, but a learning engine.</em>
</p>

---

## features

- explain any concept in simple language  
- generate topic-specific quizzes (MCQ, short answers)  
- track your scores and mastery per topic  
- real-time adaptive learning using Pathway  
- switchable model support: OpenAI, Gemini, Ollama, local models  
- beautiful and responsive UI (Next.js + Tailwind)  
- user auth with email/password or OAuth login  
- fully documented API in [`docs/api.md`](docs/api.md)

---

## how it helps you learn

traditional llm tools give you answers.  
whisper helps you build understanding.

- monitors your progress by topic  
- adapts questions based on performance  
- suggests revisions when needed  
- real-time feedback loop (no cron jobs or polling)

---

## architecture

**core backend**
- `fastapi` — api framework  
- `pathway` — stream computation (topic mastery tracking)  
- `postgres` — persistent store  
- `ollama`, `openai`, `gemini` — interchangeable llm backends  

**frontend**
- `next.js` with `tailwindcss`  
- login + protected routes  
- clean, minimal ux focused on learning flow

---

## quickstart

```bash
# from backend/
make rebuild
make up

# run adaptive learning flow
python3 src/pathway_flow/pathway_main.py
