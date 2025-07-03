// src/lib/api.ts

// API utility for backend integration
// Update BASE_URL if your backend runs on a different host/port
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; // Export BASE_URL
// --- New Interfaces for LLM Configuration ---

/**
 * Defines the configuration for the Large Language Model to be used for a request.
 */
export interface LLMConfig {
	provider: string; // e.g., 'gemini', 'openai', 'anthropic'
	apiKey: string;   // The user's API key for the chosen provider
	model: string;    // The specific model name, e.g., 'gemini-pro', 'gpt-4o'
}

/**
 * Represents a standard response from the AI chat, usually text.
 */
export interface ChatResponse {
	content: string;
	// Potentially add metadata about the response, e.g., 'source_documents', 'tokens_used'
}

/**
 * Represents a structured quiz question response from the AI.
 * This is what your backend would return when asked to generate a quiz.
 */
export interface QuizQuestionResponse {
	question: string;
	options: { id: string; text: string }[];
	correctAnswerId: string; // The ID of the correct option
	feedback: string;        // Explanation for the correct answer
}

// --- Modified and New API Functions ---

/**
 * Sends a general "ask anything" question to the AI backend.
 * Now includes full LLM configuration for personalized AI responses.
 */
export async function askAnything(
	question: string,
	userId: string,
	topic: string = "",
	systemPrompt: string, // From Context & Settings
	temperature: number,   // From Context & Settings
	maxTokens: number,     // From Context & Settings
	llmConfig: LLMConfig   // User's chosen LLM config
): Promise<ChatResponse> {
	// Using JSON body instead of FormData for easier handling of complex objects like llmConfig
	const res = await fetch(`${BASE_URL}/explain`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			question,
			user_id: userId,
			topic,
			system_prompt: systemPrompt, // Match backend expected name if different
			temperature,
			max_tokens: maxTokens,       // Match backend expected name if different
			llm_config: {                // Pass LLM config
				provider: llmConfig.provider,
				api_key: llmConfig.apiKey,
				model: llmConfig.model,
			},
		}),
	});

	if (!res.ok) {
		const errorData = await res.json();
		const errorMessage = errorData.message || "Failed to get explanation from AI.";
		throw new Error(errorMessage);
	}
	return res.json();
}

/**
 * Requests a new quiz question from the backend, using LLM configuration.
 * This is designed to generate the entire quiz question, options, and correct answer via the LLM.
 */
export async function getQuizQuestion(
	topic: string,
	difficulty: string, // You might want to make this configurable in UI
	userId: string,
	llmConfig: LLMConfig
): Promise<QuizQuestionResponse> {
	// This endpoint should be designed in your backend to generate a quiz question
	// using the specified topic, difficulty, and LLM configuration.
	const res = await fetch(`${BASE_URL}/quiz`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			topic,
			difficulty,
			user_id: userId, // Pass user_id for personalization/tracking
			llm_config: {
				provider: llmConfig.provider,
				api_key: llmConfig.apiKey,
				model: llmConfig.model,
			},
		}),
	});

	if (!res.ok) {
		let errorText = await res.text();
		// Try to extract JSON from code block if present
		let match = errorText.match(/```json([\s\S]*?)```/);
		if (match) {
			try {
				return JSON.parse(match[1]);
			} catch (e) {
				throw new Error("Quiz LLM returned invalid JSON. Preview: " + match[1]);
			}
		}
		try {
			const errorData = JSON.parse(errorText);
			const errorMessage = errorData.message || "Failed to generate quiz question.";
			throw new Error(errorMessage);
		} catch {
			throw new Error("Failed to generate quiz question. Raw: " + errorText);
		}
	}
	return res.json();
}


/**
 * Sends text to a backend TTS endpoint to get audio.
 * This would replace the frontend fetch("/api/tts") in the ChatPage.
 */
export async function textToSpeech(text: string): Promise<{ audio: string }> {
	const res = await fetch(`${BASE_URL}/tts`, { // Assuming a /tts endpoint on your backend
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ text }),
	});

	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.message || "Failed to convert text to speech.");
	}
	return res.json();
}


// --- Original API functions (modified if necessary for consistency) ---

// No change needed for getProgress
export async function getProgress() {
	const res = await fetch(`${BASE_URL}/progress`);
	if (!res.ok) throw new Error("Failed to get progress");
	return res.json();
}

// No change needed for getReminders
export async function getReminders() {
	const res = await fetch(`${BASE_URL}/reminders`);
	if (!res.ok) throw new Error("Failed to get reminders");
}

// submitQuiz might need llmConfig if the backend uses it for evaluation
export async function submitQuiz(data: Record<string, unknown>, llmConfig?: LLMConfig) {
	const body: Record<string, unknown> = { ...data };
	if (llmConfig) {
		body.llm_config = {
			provider: llmConfig.provider,
			api_key: llmConfig.apiKey,
			model: llmConfig.model,
		};
	}

	const res = await fetch(`${BASE_URL}/quiz`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error("Failed to submit quiz");
	return res.json();
}

// quizAsk (original name) is now largely superseded by getQuizQuestion which uses LLM directly.
// If your backend has a pre-generated quiz system separate from LLMs, keep this.
// For a fully LLM-driven platform, getQuizQuestion is more aligned.
// I'm deprecating this in favor of getQuizQuestion above, which gives more control.
// If you still need it, ensure it also takes LLMConfig if it uses LLMs.
/*
export async function quizAsk({ topic, difficulty, num_questions, question_index }: { topic: string, difficulty: string, num_questions: number, question_index: number }) {
    const res = await fetch(`${BASE_URL}/quiz/ask?topic=${encodeURIComponent(topic)}&difficulty=${difficulty}&num_questions=${num_questions}&question_index=${question_index}`, {
	method: "POST"
    });
    if (!res.ok) throw new Error("Failed to get quiz question");
    return res.json();
}
*/

// quizEvaluate - ensure it's compatible with new QuizQuestionResponse structure if quiz data comes from LLM
// Also, passing LLM config might be useful for evaluation if evaluation is LLM-driven
export async function quizEvaluate({ user_id, topic, question_index, user_answer, num_questions, difficulty, question, llmConfig }: {
	user_id: string,
	topic: string,
	question_index: number,
	user_answer: string, // Changed to string to match option.id
	num_questions: number,
	difficulty: string,
	question: unknown, // This 'question' parameter might need refinement based on your backend.
	llmConfig?: LLMConfig // Optional LLM config for evaluation
}) {
	// Ensure question is structured as expected by your backend for evaluation
	// If it's the QuizQuestionResponse from getQuizQuestion, ensure serialization is correct.
	const body: Record<string, unknown> = {
		question, // This should be the full question object, including correct answer for backend evaluation
		user_id,
		topic,
		question_index,
		user_answer,
		num_questions,
		difficulty,
	};
	if (llmConfig) {
		body.llm_config = {
			provider: llmConfig.provider,
			api_key: llmConfig.apiKey,
			model: llmConfig.model,
		};
	}

	const res = await fetch(`${BASE_URL}/quiz/evaluate`, // Changed to POST with body for more data
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body)
		});
	if (!res.ok) throw new Error("Failed to evaluate quiz");
	return res.json();
}


// No change needed for getUserTopics
export async function getUserTopics(userId: string): Promise<string[]> {
	const res = await fetch(`${BASE_URL}/topics/${encodeURIComponent(userId)}`);
	if (!res.ok) throw new Error("Failed to fetch topics");
	return res.json();
}

// Add a topic for a user
export async function addUserTopic(userId: string, topic: string): Promise<void> {
	const res = await fetch(`${BASE_URL}/topics/${encodeURIComponent(userId)}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ topic }),
	});
	if (!res.ok) throw new Error("Failed to add topic");
}

// Note: The `uploadSyllabus` function is typically in `api-syllabus.ts`.
// Ensure its interface matches if you modify it to pass LLM config as well for processing.
