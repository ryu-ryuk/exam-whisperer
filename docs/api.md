# Core Endpoints & Their Purpose

## `/explain` (POST)
- **Purpose:** Get a clear, concise explanation for a user’s question.
- **Input:**  
  - `question` (str)  
  - `user_id` (str)  
  - `topic` (optional, str) — as form data
- **Output:** JSON with explanation, topic, related_topics, etc.
- **Frontend:** Used in chat/ask-anything.

## `/quiz` (POST)
- **Purpose:** Generate a quiz for a given topic/difficulty.
- **Input:** (Check your code, likely `topic`, `difficulty`)
- **Output:** JSON with quiz questions.
- **Frontend:** Used in quiz mode.

## `/quiz/evaluate` (POST)
- **Purpose:** Evaluate quiz answers.
- **Input:** User’s answers.
- **Output:** JSON with results/score.
- **Frontend:** Used after quiz submission.

## `/progress` (GET)
- **Purpose:** Get user’s learning progress.
- **Input:** (Likely via `user_id` in query or session)
- **Output:** JSON with progress data.
- **Frontend:** Used in tracker/progress dashboard.

## `/reminders` (GET)
- **Purpose:** Get study reminders for the user.
- **Input:** (Likely via `user_id` in query or session)
- **Output:** JSON with reminders.
- **Frontend:** Used in reminders/notifications.

## `/syllabus` (POST)
- **Purpose:** Upload a syllabus PDF and extract topics.
- **Input:** PDF file, `user_id` (form data)
- **Output:** JSON with extracted topics.
- **Frontend:** Used when user uploads a syllabus.

## `/upload` (POST)
- **Purpose:** Upload other files (if supported).
- **Input:** File, metadata.
- **Output:** JSON with upload status.
- **Frontend:** Used for document uploads.

## `/tts` (POST)
- **Purpose:** Convert text to speech (currently not using Omnidimension).
- **Input:**  
  ```json
  { "text": "..." }
  ```
- **Output:**  
  ```json
  { "audio": "" }
  ```
- **Frontend:** Used for “Read Aloud” button.

# Typical User Flow

1. **User logs in/opens app.**
2. **User asks a question:**
   - Frontend calls `/explain` → shows answer in chat.
3. **User uploads a syllabus:**
   - Frontend calls `/syllabus` → extracted topics shown/used for context.
4. **User takes a quiz:**
   - Frontend calls `/quiz` to get questions, `/quiz/evaluate` to check answers.
5. **User checks progress:**
   - Frontend calls `/progress` to show dashboard.
6. **User gets reminders:**
   - Frontend calls `/reminders`.
7. **User clicks “Read Aloud”:**
   - Frontend calls `/tts` with answer text, plays returned audio.
