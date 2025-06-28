# from fastapi import FastAPI, UploadFile
# app = FastAPI()

# @app.post("/voice_ask")
# async def voice_ask_route(file: UploadFile, user_id: str, topic: str = ""):
#     audio_data = await file.read()
#     return await voice_ask(audio_data, user_id, topic)