// ChatPage: Exam Whisperer's grand chat UI for personalized study.
// Features dynamic knowledge blocks (text, quiz), integrated LLM configuration,
// syllabus upload, and a seamless topic management system.

"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Send, User, ArrowLeft, Settings, Upload, FileText, X, Trash2, Volume2, MessageCircle, Lightbulb, Power, ChevronDown, WifiOff } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"
import { askAnything, getQuizQuestion, textToSpeech, getUserTopics, LLMConfig, QuizQuestionResponse, BASE_URL, addUserTopic } from "@/lib/api"
import { uploadSyllabus } from "@/lib/api-syllabus"

// --- LLM Configuration Interface (re-exported from api.ts) ---
// export interface LLMConfig { ... }

// --- Quiz Question Interface (matches QuizQuestionResponse from api.ts) ---
interface QuizQuestion {
	question: string;
	options: { text: string; id: string }[];
	correctAnswerId: string;
	userAnswerId?: string;
	feedback?: string;
	submitted?: boolean;
}

// --- Message Interface for Dynamic Content ---
interface Message {
	id: string;
	content?: string; // For text messages
	quiz?: QuizQuestion; // For quiz messages
	role: "user" | "assistant";
	timestamp: Date;
	type: "text" | "quiz"; // Differentiates message display
}

// --- Quiz Card Component (Displayed INLINE within chat messages) ---
interface QuizMessageCardProps {
	quiz: QuizQuestion;
	onAnswer: (messageId: string, answerId: string) => void;
	messageId: string;
}

function QuizMessageCard({ quiz, onAnswer, messageId, onNext }: QuizMessageCardProps & { onNext?: () => void }) {
	const [selectedOption, setSelectedOption] = useState<string | undefined>(quiz.userAnswerId);

	const handleSubmit = () => {
		if (selectedOption) {
			onAnswer(messageId, selectedOption);
		}
	};

	const isSubmitted = quiz.submitted;
	const isCorrect = isSubmitted && selectedOption === quiz.correctAnswerId;

	return (
		<Card className="p-4 rounded-xl shadow-md text-base bg-[#313244] text-[#cdd6f4] border border-[#45475a] rounded-bl-none">
			<CardHeader className="p-0 pb-3">
				<CardTitle className="text-[#cdd6f4] flex items-center text-lg">
					<Brain className="mr-2 h-5 w-5 text-[#a6e3a1]" />
					Practice Quiz
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				<div className="space-y-4">
					<div className="bg-[#45475a]/50 p-4 rounded-lg">
						<p className="text-[#cdd6f4] font-medium mb-3">{quiz.question}</p>
						<div className="space-y-2">
							{quiz.options.map(option => (
								<div
									key={option.id}
									className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors duration-200
                                        ${!isSubmitted ? 'hover:bg-[#45475a]/30' : ''}
                                        ${isSubmitted && option.id === quiz.correctAnswerId ? 'bg-[#a6e3a1]/10 text-[#a6e3a1] font-medium' : ''}
                                        ${isSubmitted && option.id === selectedOption && option.id !== quiz.correctAnswerId ? 'bg-[#f38ba8]/10 text-[#f38ba8] font-medium' : ''}
                                    `}
									onClick={() => !isSubmitted && setSelectedOption(option.id)}
								>
									<div className={`w-4 h-4 rounded-full border-2 
                                        ${selectedOption === option.id ?
											(isSubmitted ?
												(isCorrect ? 'bg-[#a6e3a1] border-[#a6e3a1]' : 'bg-[#f38ba8] border-[#f38ba8]')
												: 'bg-[#cba6f7] border-[#cba6f7]')
											: 'border-[#6c7086]'}`}></div>
									<span className={isSubmitted && option.id === quiz.correctAnswerId ? 'text-[#a6e3a1]' : (isSubmitted && option.id === selectedOption ? 'text-[#f38ba8]' : 'text-[#a6adc8]')}>{option.text}</span>
								</div>
							))}
						</div>
					</div>
					{!isSubmitted && (
						<Button
							onClick={handleSubmit}
							disabled={!selectedOption}
							className="w-full bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e] font-medium"
						>
							Submit Answer
						</Button>
					)}
					{isSubmitted && (
						<div className={`p-3 rounded-lg border ${isCorrect ? 'bg-[#a6e3a1]/20 border-[#a6e3a1]/30' : 'bg-[#f38ba8]/20 border-[#f38ba8]/30'}`}>
							<p className={`text-sm ${isCorrect ? 'text-[#a6e3a1]' : 'text-[#f38ba8]'}`}>
								{isCorrect ? '✓ Correct! Great job!' : `✗ Incorrect. The correct answer was "${quiz.options.find(opt => opt.id === quiz.correctAnswerId)?.text}".`}
							</p>
							{quiz.feedback && <p className="text-[#a6adc8] text-xs mt-2">{quiz.feedback}</p>}
							{onNext && (
								<Button
									onClick={onNext}
									className="mt-4 w-full bg-[#a6e3a1] hover:bg-[#b4befe] text-[#1e1e2e] font-bold"
								>
									Next Question
								</Button>
							)}
						</div>
					)}
				</div>
			</CardContent>
			<div className="text-xs mt-2 opacity-70 text-[#a6adc8]">
				{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
			</div>
		</Card>
	);
}

// --- Main Chat Page Component ---
export default function ChatPage() {
	// Define a list of dynamic welcome messages
	const welcomeMessages = [
		"Hi there! I'm Whisper, your AI study companion. How can I help you today?",
		"Hello! Ready to dive into your studies? I'm Whisper, here to assist you.",
		"Hey, student! Whisper here. What's on your mind today? Let's learn together!",
		"Welcome back! I'm Whisper, your personalized AI tutor. What concept are we tackling?",
		"Greetings! Need a quick explanation or a practice quiz? Whisper is at your service.",
	];

	// Function to get a random welcome message
	const getRandomWelcomeMessage = () => {
		const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
		return welcomeMessages[randomIndex];
	};

	const [messages, setMessages] = useState<Message[]>([
		{ id: "welcome", content: getRandomWelcomeMessage(), role: "assistant", timestamp: new Date(), type: "text" },
	]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [typingContent, setTypingContent] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	const [showContextModal, setShowContextModal] = useState(false);
	const [contextDocs, setContextDocs] = useState<Array<{ id: string; name: string; content: string; type: string }>>([]);
	const [systemPrompt, setSystemPrompt] = useState(
		"You are Exam Whisperer, a helpful AI tutor. Provide clear, student-friendly explanations, and offer to generate quizzes where appropriate. Keep responses concise.",
	);
	const [temperature, setTemperature] = useState(0.7);
	const [maxTokens, setMaxTokens] = useState(500);
	const [uploading, setUploading] = useState(false);
	const [userTopic, setUserTopic] = useState("");
	const [userTopics, setUserTopics] = useState<string[]>([]);
	const [topicsLoading, setTopicsLoading] = useState(false);
	const [showTopicDropdown, setShowTopicDropdown] = useState(false);
	const [tempTopicInput, setTempTopicInput] = useState<string>("");
	const dropdownJustOpened = useRef(false); // NEW: track if dropdown just opened
	// --- User ID State (from dashboard/localStorage) ---
	const [userId, setUserId] = useState<string>(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('user_id') || '';
		}
		return '';
	});
	// lazy loading topics
	const [topicsLoaded, setTopicsLoaded] = useState(false);
	// --- LLM Configuration States (loaded from/saved to localStorage safely) ---
	const [llmProvider, setLlmProvider] = useState<string>(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('llmProvider') || 'gemini';
		}
		return 'gemini';
	});
	const [llmApiKey, setLlmApiKey] = useState<string>(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('llmApiKey') || '';
		}
		return '';
	});
	const [llmModel, setLlmModel] = useState<string>(() => {
		if (typeof window !== 'undefined') {
			const savedModel = localStorage.getItem('llmModel');
			if (savedModel) return savedModel;
			const initialProvider = localStorage.getItem('llmProvider') || 'gemini';
			return initialProvider === 'gemini' ? 'gemini-pro' : 'gpt-3.5-turbo';
		}
		return 'gemini-pro';
	});

	// Add Ollama to the LLM models and provider options
	const llmModels: { [key: string]: string[] } = {
		'gemini': ['gemini-pro', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
		'openai': ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o', 'gpt-4-turbo'],
		'anthropic': ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240229'],
		'ollama': ['llama2', 'mistral', 'phi', 'custom'],
		'default': ['default-model']
	};

	// Save LLM settings to localStorage whenever they change
	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('llmProvider', llmProvider);
			localStorage.setItem('llmApiKey', llmApiKey);
			localStorage.setItem('llmModel', llmModel);
		}
	}, [llmProvider, llmApiKey, llmModel]);

	// --- Backend Health Check State & Effect (Robust Version) ---
	const [isBackendOnline, setIsBackendOnline] = useState(true);

	useEffect(() => {
		// Ensure this effect only runs on the client-side
		if (typeof window === 'undefined' || typeof document === 'undefined') {
			return;
		}

		let retryInterval: NodeJS.Timeout | null = null;
		const checkBackendHealth = async () => {
			try {
				const response = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(5000) });
				setIsBackendOnline(response.ok);
			} catch (error) {
				console.warn("Backend health check failed (expected on server start/stop):", error);
				setIsBackendOnline(false);
			}
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				checkBackendHealth(); // Re-check when tab becomes active
			}
		};

		// Initial check on mount
		checkBackendHealth();
		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Function to start the retry mechanism
		const startRetryMechanism = () => {
			if (!retryInterval) {
				retryInterval = setInterval(() => {
					if (!isBackendOnline) { // Only re-check if currently offline
						checkBackendHealth();
					} else if (retryInterval) { // Clear interval if backend comes back online
						clearInterval(retryInterval);
						retryInterval = null;
					}
				}, 15000); // Check every 15 seconds
			}
		};

		// This part starts/stops the retry mechanism when isBackendOnline changes
		if (!isBackendOnline) { // If currently offline, ensure retry is running
			startRetryMechanism();
		} else if (retryInterval) { // If online, ensure retry is stopped
			clearInterval(retryInterval);
			retryInterval = null;
		}

		// Cleanup function for useEffect
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			if (retryInterval) {
				clearInterval(retryInterval);
				retryInterval = null;
			}
		};
	}, [isBackendOnline]); // Dependency on isBackendOnline to react to status changes and manage retry interval


	// Effect to handle mobile viewport height (vh)
	const chatContainerRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const setDynamicHeight = () => {
			if (chatContainerRef.current) {
				chatContainerRef.current.style.height = `${window.innerHeight}px`;
			}
		};
		setDynamicHeight();
		window.addEventListener('resize', setDynamicHeight);
		return () => window.removeEventListener('resize', setDynamicHeight);
	}, []);

	// Fetch user topics on component mount
	useEffect(() => {
		if (showTopicDropdown && !topicsLoaded && !topicsLoading) {
			setTopicsLoading(true);
			getUserTopics(userId)
				.then((topics) => {
					setUserTopics(topics);
					if (topics.length > 0 && !userTopic) {
						setUserTopic(topics[0]); // select first topic if available
					}
					setTopicsLoaded(true); // mark topics as loaded
				})
				.catch((err) => {
					console.error("failed to load topics:", err);
					setUserTopics([]);
					setUserTopic("");
					setTopicsLoaded(false); // keep false to retry next time
				})
				.finally(() => setTopicsLoading(false));
		}
	}, [showTopicDropdown, topicsLoaded, topicsLoading, userId, userTopic]);


	// Scroll to bottom of messages whenever messages or typing content changes
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, typingContent]);

	// Simulates an API call to get a quiz question (now calls backend getQuizQuestion)
	const getQuizQuestionBackend = useCallback(async (topic: string): Promise<QuizQuestionResponse> => {
		const currentLlmConfig: LLMConfig = { provider: llmProvider, apiKey: llmApiKey, model: llmModel };
		return getQuizQuestion(topic, "medium", userId, currentLlmConfig);
	}, [llmProvider, llmApiKey, llmModel, userId]);

	// Handle PDF Syllabus Upload (now integrated into topic dropdown)
	const handlePdfUpload = useCallback(async (file: File) => {
		setUploading(true);
		try {
			const llmConfig = { provider: llmProvider, apiKey: llmApiKey, model: llmModel };
			const result = await uploadSyllabus(file, userId, llmConfig);
			alert(`Syllabus "${file.name}" uploaded successfully! Detected topics: ${result.topics?.join(', ') || 'None'}`);
			const updatedTopics = await getUserTopics(userId);
			setUserTopics(updatedTopics);
			if (updatedTopics.length > 0 && !userTopic) {
				setUserTopic(updatedTopics[0]);
			}
			setShowTopicDropdown(false); // Close dropdown after upload
		} catch (error) {
			console.error("Error uploading syllabus:", error);
			alert("Failed to upload syllabus. Please try again.");
		} finally {
			setUploading(false);
		}
	}, [userId, userTopic, llmProvider, llmApiKey, llmModel]);

	// Main message submission handler
	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!input.trim()) return;

		const userMessageContent = input.trim();
		const currentLlmConfig: LLMConfig = { provider: llmProvider, apiKey: llmApiKey, model: llmModel };

		// Basic check for API key
		if (!llmApiKey) {
			alert("Please set your LLM API Key in 'Context & Settings' to chat.");
			setShowContextModal(true);
			return;
		}
		if (!isBackendOnline) {
			alert("Backend is offline. Please check server status or contact support.");
			return;
		}

		const userMessage: Message = {
			id: `user-${Date.now()}`,
			content: userMessageContent,
			role: "user",
			timestamp: new Date(),
			type: "text",
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);
		setTypingContent("Thinking...");

		try {
			const response = await askAnything(
				userMessageContent,
				userId,
				userTopic,
				systemPrompt,
				temperature,
				maxTokens,
				currentLlmConfig
			);

			setMessages((prev) => [
				...prev,
				{
					id: `assistant-text-${Date.now()}`,
					content: response.content,
					role: "assistant",
					timestamp: new Date(),
					type: "text",
				},
			]);
			setTypingContent("");
		} catch (error) {
			console.error("Error during chat response:", error);
			const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
			setMessages((prev) => [
				...prev,
				{
					id: `error-${Date.now()}`,
					content: `Sorry, I couldn't get a response. Error: ${errorMessage}. Please check your API key and settings.`,
					role: "assistant",
					timestamp: new Date(),
					type: "text",
				},
			]);
		} finally {
			setIsLoading(false);
		}
	}

	// Handles generating and displaying a quiz question
	const handleGenerateQuiz = useCallback(async () => {
		if (!userTopic) {
			alert("Please select or enter a topic before taking a quiz.");
			return;
		}
		if (!llmApiKey) {
			alert("Please set your LLM API Key in 'Context & Settings' to generate quizzes.");
			setShowContextModal(true);
			return;
		}
		if (!isBackendOnline) {
			alert("Backend is offline. Please check server status or contact support.");
			return;
		}

		setIsLoading(true);
		setTypingContent("Generating quiz question...");

		try {
			const quizDataResponse: QuizQuestionResponse = await getQuizQuestionBackend(userTopic);

			setMessages((prev) => [
				...prev,
				{
					id: `assistant-quiz-${Date.now()}`,
					quiz: {
						question: quizDataResponse.question,
						options: quizDataResponse.options,
						correctAnswerId: quizDataResponse.correctAnswerId,
						feedback: quizDataResponse.feedback,
						submitted: false,
					},
					role: "assistant",
					timestamp: new Date(),
					type: "quiz",
				},
			]);
		} catch (error) {
			console.error("Error generating quiz:", error);
			const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
			setMessages((prev) => [
				...prev,
				{
					id: `error-quiz-${Date.now()}`,
					content: `Sorry, I couldn't generate a quiz. Error: ${errorMessage}. Please try again.`,
					role: "assistant",
					timestamp: new Date(),
					type: "text",
				},
			]);
		} finally {
			setIsLoading(false);
			setTypingContent("");
		}
	}, [userTopic, llmApiKey, getQuizQuestionBackend, isBackendOnline]);

	// Handle Enter key for sending messages
	const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (!isLoading && input.trim()) {
				const form = (e.target as HTMLElement).closest("form");
				if (form) {
					form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
				}
			}
		}
	}, [input, isLoading]);

	// --- Text-to-Speech Handling ---
	const [isSpeaking, setIsSpeaking] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Handle Text-to-Speech (now calling backend API)
	const handleReadAloud = useCallback(async (text: string) => {
		if (!llmApiKey) {
			alert("Please set your LLM API Key in 'Context & Settings' to use Text-to-Speech.");
			setShowContextModal(true);
			return;
		}
		if (!isBackendOnline) {
			alert("Backend is offline. Cannot use Text-to-Speech.");
			return;
		}
		setIsSpeaking(true);
		try {
			const audioData = await textToSpeech(text);
			if (audioData.audio) {
				const audio = new Audio(`data:audio/mp3;base64,${audioData.audio}`);
				audioRef.current = audio;
				audio.onended = () => setIsSpeaking(false);
				audio.play();
			} else {
				throw new Error("No audio returned from TTS service.");
			}
		} catch (error) {
			console.error("Text-to-speech failed:", error);
			alert("Text-to-speech failed. Ensure your backend TTS endpoint is configured and reachable.");
			setIsSpeaking(false);
		}
	}, [llmApiKey, isBackendOnline]);

	const handleStopSpeaking = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			audioRef.current = null;
			setIsSpeaking(false);
		}
	}, []);

	// Handle answer submission for a quiz message
	const handleQuizAnswer = useCallback((messageId: string, selectedAnswerId: string) => {
		setMessages(prevMessages =>
			prevMessages.map(msg => {
				if (msg.id === messageId && msg.type === 'quiz' && msg.quiz && !msg.quiz.submitted) {
					// Optionally, send the answer to quizEvaluate if needed
					// const quizQuestion = msg.quiz;
					// quizEvaluate({ user_id: userId, topic: userTopic, question_index: 0, user_answer: selectedAnswerId, num_questions: 1, difficulty: "medium", question: quizQuestion, llmConfig: { provider: llmProvider, apiKey: llmApiKey, model: llmModel } });
					return {
						...msg,
						quiz: {
							...msg.quiz,
							userAnswerId: selectedAnswerId,
							submitted: true,
						}
					};
				}
				return msg;
			})
		);
	}, []);


	// Context & Settings Modal Component (remains the same except for PDF upload section removal)
	const ContextSettingsModal = () => (
		<div className="fixed inset-0 bg-[#1e1e2e]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<Card className="bg-[#313244] border-[#45475a] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
				<CardHeader className="border-b border-[#45475a] flex flex-row items-center justify-between p-6">
					<CardTitle className="text-[#cdd6f4] flex items-center text-2xl font-bold">
						<Settings className="mr-3 h-6 w-6 text-[#cba6f7]" />
						Context & Settings
					</CardTitle>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setShowContextModal(false)}
						className="text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#383a59]"
					>
						<X className="w-5 h-5" />
					</Button>
				</CardHeader>
				<CardContent className="p-6 overflow-y-auto flex-grow">
					<div className="space-y-8">
						{/* LLM Configuration Section */}
						<div className="p-6 bg-[#181825] rounded-lg border border-[#313244] shadow-inner">
							<h3 className="text-xl font-bold text-[#f9e2af] mb-4 flex items-center">
								<Power className="mr-2 h-5 w-5 text-[#f9e2af]" />
								LLM Configuration
							</h3>
							<div className="space-y-4">
								<div>
									<label htmlFor="llm-provider" className="block text-[#cdd6f4] text-lg font-medium mb-2">
										LLM Provider
									</label>
									<div className="relative">
										<select
											id="llm-provider"
											className="w-full bg-[#1e1e2e] border border-[#45475a] rounded-lg px-4 py-3 text-[#cdd6f4] focus:outline-none focus:ring-2 focus:ring-[#cba6f7] appearance-none pr-10"
											value={llmProvider}
											onChange={(e) => {
												setLlmProvider(e.target.value);
												const defaultModel = llmModels[e.target.value]?.[0] || 'default-model';
												setLlmModel(defaultModel);
											}}
										>
											<option value="gemini">Google Gemini</option>
											<option value="openai">OpenAI</option>
											<option value="anthropic">Anthropic (Claude)</option>
											<option value="ollama">Ollama (Local)</option>
										</select>
										<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#a6adc8] pointer-events-none" />
									</div>
								</div>
								<div>
									<label htmlFor="llm-api-key" className="block text-[#cdd6f4] text-lg font-medium mb-2">
										API Key
									</label>
									<input
										id="llm-api-key"
										type="password"
										className="w-full bg-[#1e1e2e] border border-[#45475a] rounded-lg px-4 py-3 text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:ring-2 focus:ring-[#cba6f7]"
										placeholder={`Enter your ${llmProvider} API key`}
										value={llmApiKey}
										onChange={(e) => setLlmApiKey(e.target.value)}
									/>
									<p className="text-[#6c7086] text-xs mt-1">
										Your API key is stored locally in your browser.
									</p>
								</div>
								<div>
									<label htmlFor="llm-model" className="block text-[#cdd6f4] text-lg font-medium mb-2">
										Model
									</label>
									<div className="relative">
										<select
											id="llm-model"
											className="w-full bg-[#1e1e2e] border border-[#45475a] rounded-lg px-4 py-3 text-[#cdd6f4] focus:outline-none focus:ring-2 focus:ring-[#cba6f7] appearance-none pr-10"
											value={llmModel}
											onChange={(e) => setLlmModel(e.target.value)}
										>
											{(llmModels[llmProvider] || llmModels['default']).map(model => (
												<option key={model} value={model}>{model}</option>
											))}
										</select>
										<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#a6adc8] pointer-events-none" />
									</div>
								</div>
							</div>
						</div>

						{/* System Instructions Section */}
						<div>
							<h3 className="text-xl font-semibold text-[#cdd6f4] mb-4">System Instructions</h3>
							<textarea
								value={systemPrompt}
								onChange={(e) => setSystemPrompt(e.target.value)}
								placeholder="Define how the AI should behave and respond..."
								className="w-full bg-[#1e1e2e] border border-[#45475a] rounded-lg px-4 py-3 text-[#cdd6f4] placeholder-[#6c7086] resize-none focus:outline-none focus:ring-2 focus:ring-[#cba6f7] focus:border-transparent min-h-[120px] text-base"
							/>
							<p className="text-[#6c7086] text-sm mt-2">Guides the AI's persona and general behavior.</p>
						</div>
						<div className="grid md:grid-cols-2 gap-8">
							<div>
								<label className="block text-[#cdd6f4] text-lg font-medium mb-3">Temperature: {temperature.toFixed(1)}</label>
								<input
									type="range"
									min="0"
									max="1"
									step="0.1"
									value={temperature}
									onChange={(e) => setTemperature(Number.parseFloat(e.target.value))}
									className="w-full h-2 bg-[#45475a] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-[#cba6f7] [&::-moz-range-thumb]:bg-[#cba6f7] [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full"
								/>
								<p className="text-[#6c7086] text-sm mt-2">Controls creativity (0 = focused, 1 = creative)</p>
							</div>
							<div>
								<label className="block text-[#cdd6f4] text-lg font-medium mb-3">Max Tokens: {maxTokens}</label>
								<input
									type="range"
									min="100"
									max="2000"
									step="50"
									value={maxTokens}
									onChange={(e) => setMaxTokens(Number.parseInt(e.target.value))}
									className="w-full h-2 bg-[#45475a] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-[#89b4fa] [&::-moz-range-thumb]:bg-[#89b4fa] [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full"
								/>
								<p className="text-[#6c7086] text-xs mt-2">Maximum response length</p>
							</div>
						</div>
						{/* Reference Documents section has been moved */}
						{/* <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-[#cdd6f4]">Reference Documents</h3>
                                <Button
                                    size="sm"
                                    className="bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e] font-medium"
                                    disabled={uploading}
                                    onClick={() => {
                                        const input = document.createElement("input")
                                        input.type = "file"
                                        input.accept = ".pdf"
                                        input.onchange = (e) => {
                                            const file = (e.target as HTMLInputElement).files?.[0]
                                            if (file) {
                                                handlePdfUpload(file)
                                            }
                                        }
                                        input.click()
                                    }}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {uploading ? "Uploading..." : "Upload PDF Syllabus"}
                                </Button>
                            </div>
                            {contextDocs.length === 0 ? (
                                <div className="bg-[#1e1e2e]/50 border border-[#313244] rounded-lg p-8 text-center flex flex-col items-center justify-center">
                                    <FileText className="w-12 h-12 text-[#a6adc8] mx-auto mb-4" />
                                    <p className="text-[#cdd6f4] mb-2 font-medium">No documents uploaded</p>
                                    <p className="text-[#a6adc8] text-sm">Upload documents for the AI to reference in responses</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {contextDocs.map((doc) => (
                                        <div key={doc.id} className="bg-[#1e1e2e]/50 border border-[#313244] rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-3">
                                                    <FileText className="w-5 h-5 text-[#89b4fa]" />
                                                    <div>
                                                        <p className="text-[#cdd6f4] font-medium">{doc.name}</p>
                                                        <p className="text-[#a6adc8] text-sm">
                                                            {doc.content.length} characters • {doc.type}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setContextDocs((prev) => prev.filter((d) => d.id !== doc.id))}
                                                    className="text-[#f38ba8] hover:text-[#e67a95] hover:bg-[#f38ba8]/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="bg-[#313244] rounded p-3 max-h-32 overflow-y-auto text-[#bac2de] text-sm">
                                                <p className="whitespace-pre-wrap">
                                                    {doc.content.slice(0, 200)}
                                                    {doc.content.length > 200 && "..."}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div> */}
						<div>
							<h3 className="text-xl font-semibold text-[#cdd6f4] mb-4">Quick Templates</h3>
							<div className="grid md:grid-cols-2 gap-4">
								<Button
									variant="outline"
									className="bg-[#313244] border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59] justify-start text-left h-auto py-3"
									onClick={() =>
										setSystemPrompt(
											"You are a math tutor. Break down complex problems step-by-step and explain the reasoning behind each step.",
										)
									}
								>
									Math Tutor
								</Button>
								<Button
									variant="outline"
									className="bg-[#313244] border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59] justify-start text-left h-auto py-3"
									onClick={() =>
										setSystemPrompt(
											"You are a science teacher. Use analogies and real-world examples to explain scientific concepts clearly.",
										)
									}
								>
									Science Teacher
								</Button>
								<Button
									variant="outline"
									className="bg-[#313244] border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59] justify-start text-left h-auto py-3"
									onClick={() =>
										setSystemPrompt(
											"You are a writing coach. Help improve essays, grammar, and writing style with constructive feedback.",
										)
									}
								>
									Writing Coach
								</Button>
								<Button
									variant="outline"
									className="bg-[#313244] border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59] justify-start text-left h-auto py-3"
									onClick={() =>
										setSystemPrompt(
											"You are a quiz master. Create engaging questions and provide detailed explanations for answers.",
										)
									}
								>
									Quiz Master
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
				<div className="border-t border-[#45475a] p-6 flex justify-end space-x-4">
					<Button
						variant="outline"
						onClick={() => setShowContextModal(false)}
						className="bg-[#313244] border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59] font-medium"
					>
						Cancel
					</Button>
					<Button
						onClick={() => setShowContextModal(false)}
						className="bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e] font-medium"
					>
						Save Settings
					</Button>
				</div>
			</Card>
		</div>
	);

	// Optionally, add a useEffect to redirect to dashboard if userId is not set
	/* useEffect(() => {
		if (!userId) {
			window.location.href = "/dashboard";
		}
	}, [userId]); */

	return (
		<div ref={chatContainerRef} className="min-h-screen bg-[#1e1e2e] text-[#cdd6f4] flex flex-col relative overflow-hidden">
			{/* Animated background elements (from Landing Page Hero Section) */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#cba6f7]/5 rounded-full blur-xl animate-pulse"></div>
				<div className="absolute top-3/4 right-1/4 w-24 h-24 bg-[#89b4fa]/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
				<div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-[#a6e3a1]/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
			</div>

			{/* Header */}
			<header className="bg-[#1e1e2e]/80 backdrop-blur-sm border-b border-[#313244] p-4 flex-shrink-0 z-10">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<Link href="/">
							<Button variant="ghost" size="sm" className="text-[#cdd6f4] hover:bg-[#313244] px-3 py-2">
								<ArrowLeft className="w-4 h-4 mr-2" />
								Back
							</Button>
						</Link>
						<div className="flex items-center space-x-2">
							<div className="w-8 h-8 bg-[#cba6f7] rounded-lg flex items-center justify-center">
								<Brain className="h-5 w-5 text-[#1e1e2e]" />
							</div>
							<span className="text-xl font-semibold text-[#f9e2af]">Exam Whisperer</span>
						</div>
					</div>
					<div className="flex items-center space-x-4">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowContextModal(true)}
							className="bg-[#313244] border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59] px-3 py-2"
						>
							<Settings className="w-4 h-4 mr-2" />
							Context & Settings
						</Button>
						{/* Backend Status Indicator */}
						<div className="inline-flex items-center space-x-2 bg-[#313244] px-3 py-1 rounded-full">
							<div className={`w-2 h-2 rounded-full animate-pulse ${isBackendOnline ? 'bg-[#a6e3a1]' : 'bg-[#f38ba8]'}`}></div>
							<span className={`text-sm ${isBackendOnline ? 'text-[#a6e3a1]' : 'text-[#f38ba8]'}`}>
								{isBackendOnline ? "Online" : "Offline"}
							</span>
							{!isBackendOnline && <WifiOff className="w-3 h-3 text-[#f38ba8] ml-1" />}
						</div>
					</div>
				</div>
			</header>

			{/* Main Chat Content Area */}
			{/* Expanded px-6 and py-10 for more spacious look */}
			<div className="flex-1 overflow-y-auto px-6 py-10 relative z-10 flex flex-col justify-end">
				<div className="max-w-4xl mx-auto flex flex-col h-full">
					{/* Chat Messages */}
					<div className="flex-1 overflow-y-auto pr-2 pb-4">
						<div className="space-y-4">
							{messages.map((message) => (
								<div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
									<div className={`flex items-start space-x-3 max-w-full sm:max-w-[90%] ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
										<div
											className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === "user" ? "bg-[#cba6f7]" : "bg-[#89b4fa]"}`}
										>
											{message.role === "user" ? (
												<User className="w-5 h-5 text-[#1e1e2e]" />
											) : (
												<Brain className="w-5 h-5 text-[#1e1e2e]" />
											)}
										</div>

										{/* Render message based on type */}
										{message.type === "text" && (
											<Card
												className={`p-4 rounded-xl shadow-md text-base ${message.role === "user" ? "bg-[#cba6f7] text-[#1e1e2e] rounded-br-none" : "bg-[#313244] text-[#cdd6f4] border border-[#45475a] rounded-bl-none"}`}
											>
												<div className="whitespace-pre-wrap flex flex-col gap-2">
													<ReactMarkdown
														remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown (tables, task lists, strikethrough)
														components={{
															// Custom rendering for code blocks to add proper styling
															code(props) {
																const { className, children, node, ...rest } = props;
																const isInline = node?.tagName !== 'code';

																const match = /language-(\w+)/.exec(className || '');
																return !isInline ? (
																	<pre className="p-2 rounded-md bg-[#1e1e2e] overflow-x-auto text-[#cdd6f4] border border-[#45475a] my-2">
																		<code className={className} {...rest}>{children}</code>
																	</pre>
																) : (
																	<code className="bg-[#45475a]/50 text-[#cba6f7] rounded px-1 py-0.5" {...rest}>{children}</code>
																);
															},
														}}
													>{message.content || ''}</ReactMarkdown>
													{message.role === "assistant" && (
														<div className="flex gap-2 mt-2">
															<Button
																variant="outline"
																size="sm"
																className="w-fit bg-[#45475a] border-[#45475a] text-[#cdd6f4] hover:bg-[#585b70] hover:text-[#cdd6f4] text-xs px-2 py-1 transition-colors duration-200"
																disabled={isSpeaking}
																onClick={() => message.content && handleReadAloud(message.content)}
															>
																<Volume2 className="w-3 h-3 mr-1" />
																{isSpeaking ? "Speaking..." : "Read Aloud"}
															</Button>
															{isSpeaking && (
																<Button
																	variant="outline"
																	size="sm"
																	className="w-fit bg-[#f38ba8] border-[#f38ba8] text-[#1e1e2e] hover:bg-[#f38ba8]/80 text-xs px-2 py-1 transition-colors duration-200"
																	onClick={handleStopSpeaking}
																>
																	Stop
																</Button>
															)}
														</div>
													)}
												</div>
												<div
													className={`text-xs mt-2 opacity-70 ${message.role === "user" ? "text-[#1e1e2e]/70" : "text-[#a6adc8]"}`}
												>
													{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
												</div>
											</Card>
										)}

										{message.type === "quiz" && message.quiz && (
											<QuizMessageCard quiz={message.quiz} onAnswer={handleQuizAnswer} messageId={message.id} onNext={async () => {
												setIsLoading(true);
												setTypingContent("Generating next quiz question...");
												try {
													const quizDataResponse = await getQuizQuestionBackend(userTopic);
													setMessages((prev) => [
														...prev,
														{
															id: `assistant-quiz-${Date.now()}`,
															quiz: {
																question: quizDataResponse.question,
																options: quizDataResponse.options,
																correctAnswerId: quizDataResponse.correctAnswerId,
																feedback: quizDataResponse.feedback,
																submitted: false,
															},
															role: "assistant",
															timestamp: new Date(),
															type: "quiz",
														},
													]);
												} catch (error) {
													console.error("Error generating quiz:", error);
													const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
													setMessages((prev) => [
														...prev,
														{
															id: `error-quiz-${Date.now()}`,
															content: `Sorry, I couldn't generate a quiz. Error: ${errorMessage}. Please try again.`,
															role: "assistant",
															timestamp: new Date(),
															type: "text",
														},
													]);
												} finally {
													setIsLoading(false);
													setTypingContent("");
												}
											}} />
										)}
									</div>
								</div>
							))}

							{/* Typing Indicator */}
							{(isLoading || typingContent) && (
								<div className="flex justify-start">
									<div className="flex items-start space-x-3 max-w-full sm:max-w-[80%]">
										<div className="w-9 h-9 rounded-full bg-[#89b4fa] flex items-center justify-center flex-shrink-0">
											<Brain className="w-5 h-5 text-[#1e1e2e]" />
										</div>
										<Card className="p-4 rounded-xl shadow-md text-base bg-[#313244] text-[#cdd6f4] border border-[#45475a] rounded-bl-none">
											{typingContent ? (
												<div className="whitespace-pre-wrap">
													{typingContent}
													<span className="animate-pulse">|</span>
												</div>
											) : (
												<div className="flex items-center space-x-2">
													<div className="flex space-x-1">
														<div className="w-2 h-2 bg-[#b4befe] rounded-full animate-bounce"></div>
														<div className="w-2 h-2 bg-[#b4befe] rounded-full animate-bounce delay-100"></div>
														<div className="w-2 h-2 bg-[#b4befe] rounded-full animate-bounce delay-200"></div>
													</div>
													<span className="text-[#a6adc8] text-sm">Thinking...</span>
												</div>
											)}
										</Card>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>
					</div>

					{/* Input Area - now always at the bottom */}
					<div className="p-4 bg-[#1e1e2e]/80 backdrop-blur-sm border border-[#313244] rounded-lg mb-4 flex-shrink-0 mt-auto">
						{/* Topic Selection & Quiz Controls */}
						<div className="mb-3 flex flex-wrap justify-between items-center gap-2">
							{/* Topic Selector - Always visible for quick access */}
							<div className="relative flex items-center gap-2 flex-grow sm:flex-grow-0">
								<Badge className="bg-[#313244] text-[#cdd6f4] border-[#45475a] px-3 py-1 font-medium">Topic</Badge>
								<Button
									variant="outline"
									className="bg-[#313244] text-[#cdd6f4] border-[#45475a] hover:bg-[#383a59] px-4 py-2 text-sm relative"
									onClick={() => {
										setShowTopicDropdown(true);
									}}
									disabled={topicsLoading}
								>
									{topicsLoading ? (
										"Loading..."
									) : (
										<>
											{userTopic || "Select/Type Topic"}
											<ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showTopicDropdown ? 'rotate-180' : ''}`} />
										</>
									)}
								</Button>
								{/* Dynamic Topic Dropdown/Input Overlay */}
								{showTopicDropdown && (
									<div
										className="fixed inset-0 z-10"
										onClick={() => setShowTopicDropdown(false)}
									>
										<div
											className="absolute bottom-full left-0 mb-2 w-full max-w-xs bg-[#313244] border border-[#45475a] rounded-lg shadow-lg p-3 z-20"
											onClick={e => e.stopPropagation()} // Prevent click from closing dropdown
										>
											{userTopics.length > 0 && (
												<>
													<label htmlFor="topic-select-dropdown" className="block text-[#bac2de] text-xs font-medium mb-1">
														Choose existing:
													</label>
													<select
														id="topic-select-dropdown"
														className="w-full bg-[#1e1e2e] border border-[#45475a] rounded px-3 py-2 text-[#cdd6f4] text-sm focus:outline-none focus:ring-1 focus:ring-[#cba6f7] mb-2"
														value={tempTopicInput}
														onChange={e => setTempTopicInput(e.target.value)}
													>
														<option value="">-- Select --</option>
														{userTopics.map((topic) => (
															<option key={topic} value={topic}>{topic}</option>
														))}
													</select>
													<div className="text-center text-[#a6adc8] text-xs my-1">OR</div>
												</>
											)}
											<label htmlFor="topic-custom-input" className="block text-[#bac2de] text-xs font-medium mb-1">
												Enter custom topic:
											</label>
											<input
												id="topic-custom-input"
												className="w-full bg-[#1e1e2e] border border-[#45475a] rounded px-3 py-2 text-[#cdd6f4] text-sm placeholder-[#6c7086] focus:outline-none focus:ring-1 focus:ring-[#cba6f7]"
												placeholder="E.g., Quantum Physics"
												value={tempTopicInput}
												onChange={e => setTempTopicInput(e.target.value)}
												onKeyDown={async (e) => {
													if (e.key === 'Enter' && tempTopicInput.trim()) {
														try {
															await addUserTopic(userId, tempTopicInput.trim());
															const updatedTopics = await getUserTopics(userId);
															setUserTopics(updatedTopics);
															setUserTopic(tempTopicInput.trim());
															setTopicsLoaded(true);
														} catch (err) {
															alert("Failed to add topic");
														}
														setShowTopicDropdown(false);
														e.currentTarget.blur();
													}
												}}
											/>
											<Button
												size="sm"
												className="mt-3 w-full bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e] font-medium"
												disabled={uploading}
												onClick={async () => {
													if (tempTopicInput.trim()) {
														try {
															await addUserTopic(userId, tempTopicInput.trim());
															const updatedTopics = await getUserTopics(userId);
															setUserTopics(updatedTopics);
															setUserTopic(tempTopicInput.trim());
															setTopicsLoaded(true);
														} catch (err) {
															alert("Failed to add topic");
														}
													}
													setShowTopicDropdown(false);
												}}
											>
												<Upload className="w-4 h-4 mr-2" />
												{uploading ? "Uploading..." : "Upload PDF Syllabus"}
											</Button>
											<Button size="sm" className="mt-3 w-full bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e]" onClick={async () => {
												if (tempTopicInput.trim()) {
													try {
														await addUserTopic(userId, tempTopicInput.trim());
														const updatedTopics = await getUserTopics(userId);
														setUserTopics(updatedTopics);
														setUserTopic(tempTopicInput.trim());
														setTopicsLoaded(true);
													} catch (err) {
														alert("Failed to add topic");
													}
												}
												setShowTopicDropdown(false);
											}}>Done</Button>
										</div>
									</div>
								)}
							</div>
							<Button
								variant="outline"
								className="bg-[#313244] text-[#cdd6f4] border-[#45475a] hover:bg-[#383a59] px-4 py-2 text-sm"
								onClick={handleGenerateQuiz}
								disabled={isLoading}
							>
								📝 Take a Quiz
							</Button>
						</div>
						{/* Textarea Input */}
						<form onSubmit={handleSubmit} className="flex items-end space-x-4">
							<div className="flex-1 relative">
								<textarea
									ref={inputRef}
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyPress={handleKeyPress}
									placeholder="Ask me anything about your studies..."
									className="w-full bg-[#313244] border border-[#45475a] rounded-lg px-4 py-3 text-[#cdd6f4] placeholder-[#6c7086] resize-none focus:outline-none focus:ring-2 focus:ring-[#cba6f7] focus:border-transparent min-h-[50px] max-h-[120px] text-base pr-10"
									rows={1}
									disabled={isLoading}
								/>
								<div className="absolute bottom-2 right-2 text-xs text-[#6c7086]">
									Press Enter to send, Shift+Enter for new line
								</div>
							</div>
							<Button
								type="submit"
								disabled={!input.trim() || isLoading}
								className="bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e] px-6 py-3 h-[50px] flex-shrink-0"
							>
								{isLoading ? (
									<div className="w-5 h-5 border-2 border-[#1e1e2e]/30 border-t-[#1e1e2e] rounded-full animate-spin" />
								) : (
									<Send className="w-5 h-5" />
								)}
							</Button>
						</form>
					</div>
				</div>
			</div>

			{/* Context Control Modal */}
			{showContextModal && <ContextSettingsModal />}
		</div>
	)
}
