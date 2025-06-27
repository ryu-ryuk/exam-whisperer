"""
entry point for the fastapi app.

- mounts all routers from routes/
- sets up middleware (if needed)
- runs the api with uvicorn
"""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from routes import ask, quiz, progress, reminders, syllabus

app = FastAPI()
from db import Base, engine
import db_models

# mounting routers
app.include_router(ask.router)
app.include_router(quiz.router)
app.include_router(progress.router)
app.include_router(reminders.router)
app.include_router(syllabus.router)  # opt for now 

@app.get("/")
def root():
    return {"msg": "exam whisperer backend running"}

Base.metadata.create_all(bind=engine)