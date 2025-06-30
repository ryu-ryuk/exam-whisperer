"""
entry point for the fastapi app.

- mounts all routers from routes/
- sets up middleware (if needed)
- runs the api with uvicorn
"""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from routes import ask, quiz, progress, reminders, syllabus, upload, topics
import threading
from src.services.jsonl_uploader import run_uploader
import os 
app = FastAPI()
from db import Base, engine
from db_models import UserSyllabus, UserTopicActivity

Base.metadata.create_all(bind=engine)
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")

from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory="static"), name="static")
# mounting routers
app.include_router(ask.router)
app.include_router(quiz.router)
app.include_router(progress.router)
app.include_router(reminders.router)
app.include_router(syllabus.router)  # opt for now 
app.include_router(upload.router)  
app.include_router(topics.router)
# app.include_router(voices.router)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"msg": "exam whisperer backend running"}
# 
# import threading
# import subprocess

# def run_pathway_pipeline():
#     subprocess.Popen(
#         ["python", "pathway_flow/user_topic_stats_flow.py"],
#         cwd="src",
#     )

# Start Pathway analytics pipeline in background
# threading.Thread(target=run_pathway_pipeline, daemon=True).start()


@app.on_event("startup")
def start_jsonl_uploader():
    t = threading.Thread(target=run_uploader, daemon=True)
    t.start()
