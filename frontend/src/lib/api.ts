// API utility for backend integration
// Update BASE_URL if your backend runs on a different host/port
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function askAnything(question: string, userId: string, topic: string = "") {
  const formData = new FormData();
  formData.append("question", question);
  formData.append("user_id", userId);
  if (topic) formData.append("topic", topic);

  const res = await fetch(`${BASE_URL}/explain`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to get explanation");
  return res.json();
}


export async function getProgress() {
  const res = await fetch(`${BASE_URL}/progress`);
  if (!res.ok) throw new Error("Failed to get progress");
  return res.json();
}

export async function getReminders() {
  const res = await fetch(`${BASE_URL}/reminders`);
  if (!res.ok) throw new Error("Failed to get reminders");
  return res.json();
}

export async function submitQuiz(data: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit quiz");
  return res.json();
}

export async function quizAsk({ topic, difficulty, num_questions, question_index }: { topic: string, difficulty: string, num_questions: number, question_index: number }) {
  const res = await fetch(`${BASE_URL}/quiz/ask?topic=${encodeURIComponent(topic)}&difficulty=${difficulty}&num_questions=${num_questions}&question_index=${question_index}`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to get quiz question");
  return res.json();
}

export async function quizEvaluate({ user_id, topic, question_index, user_answer, num_questions, difficulty, question }: { user_id: string, topic: string, question_index: number, user_answer: number, num_questions: number, difficulty: string, question: unknown }) {
  if (Array.isArray(question)) {
    throw new Error("quizEvaluate: question must be a single object, not an array");
  }
  const res = await fetch(`${BASE_URL}/quiz/evaluate?user_id=${encodeURIComponent(user_id)}&topic=${encodeURIComponent(topic)}&question_index=${question_index}&user_answer=${user_answer}&num_questions=${num_questions}&difficulty=${difficulty}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
  if (!res.ok) throw new Error("Failed to evaluate quiz");
  return res.json();
}

export async function getUserTopics(userId: string): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/topics/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to fetch topics");
  return res.json();
}

// Add more functions for other endpoints as needed
