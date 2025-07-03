"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, ArrowLeft, Settings, Upload, FileText, X, Volume2, Lightbulb, Power, ChevronDown, WifiOff, Sparkles, UserCircle2 } from "lucide-react"

import Link from "next/link"
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"
import { askAnything, getQuizQuestion, textToSpeech, getUserTopics, LLMConfig, QuizQuestionResponse, BASE_URL, addUserTopic } from "@/lib/api"
import { uploadSyllabus } from "@/lib/api-syllabus"
import { CatppuccinToast } from "@/components/CatppuccinToast"

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
	onNext?: () => void;
}

function QuizMessageCard({ quiz, onAnswer, messageId, onNext }: QuizMessageCardProps) {
	const [selectedOption, setSelectedOption] = useState<string | undefined>(quiz.userAnswerId);

	const handleSubmit = () => {
		if (selectedOption) {
			onAnswer(messageId, selectedOption);
		}
	};

	const isSubmitted = quiz.submitted;
	const isCorrect = isSubmitted && selectedOption === quiz.correctAnswerId;

	return (
		<Card className="p-4 rounded-[1.25rem] shadow-md text-base bg-[#313244] text-[#cdd6f4] border border-[#45475a] rounded-bl-none">
			<CardHeader className="p-0 pb-3">
				<CardTitle className="text-[#cdd6f4] flex items-center text-lg">
					<Sparkles className="mr-2 h-5 w-5 text-[#a6e3a1]" />
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
	const welcomeMessages = [
		"Hi there! I'm Whisper, your AI study companion. How can I help you today?",
		"Hello! Ready to dive into your studies? I'm Whisper, here to assist you.",
		"Hey, student! Whisper here. What's on your mind today? Let's learn together!",
		"Welcome back! I'm Whisper, your personalized AI tutor. What concept are we tackling?",
		"Greetings! Need a quick explanation or a practice quiz? Whisper is at your service.",
	];

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

	const [userId, setUserId] = useState<string>(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('user_id') || '';
		}
		return '';
	});
	const [topicsLoaded, setTopicsLoaded] = useState(false);
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
	const [customOllamaModel, setCustomOllamaModel] = useState<string>("");

	// Add gemma3 as the top Ollama model
	const llmModels: { [key: string]: string[] } = {
		'gemini': ['gemini-pro', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
		'openai': ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o', 'gpt-4-turbo'],
		'anthropic': ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240229'],
		'ollama': ['gemma3', 'llama2', 'mistral', 'phi', 'custom'], // gemma3 at top
		'default': ['default-model']
	};

	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('llmProvider', llmProvider);
			localStorage.setItem('llmApiKey', llmApiKey);
			localStorage.setItem('llmModel', llmModel);
		}
	}, [llmProvider, llmApiKey, llmModel]);

	const [isBackendOnline, setIsBackendOnline] = useState(true);

	useEffect(() => {
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
				checkBackendHealth();
			}
		};

		checkBackendHealth();
		document.addEventListener('visibilitychange', handleVisibilityChange);

		const startRetryMechanism = () => {
			if (!retryInterval) {
				retryInterval = setInterval(() => {
					if (!isBackendOnline) {
						checkBackendHealth();
					} else if (retryInterval) {
						clearInterval(retryInterval);
						retryInterval = null;
					}
				}, 15000);
			}
		};

		if (!isBackendOnline) {
			startRetryMechanism();
		} else if (retryInterval) {
			clearInterval(retryInterval);
			retryInterval = null;
		}

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			if (retryInterval) {
				clearInterval(retryInterval);
				retryInterval = null;
			}
		};
	}, [isBackendOnline]);

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

	useEffect(() => {
		if (showTopicDropdown && !topicsLoaded && !topicsLoading) {
			setTopicsLoading(true);
			getUserTopics(userId)
				.then((topics) => {
					setUserTopics(topics);
					if (topics.length > 0 && !userTopic) {
						setUserTopic(topics[0]);
					}
					setTopicsLoaded(true);
				})
				.catch((err) => {
					console.error("failed to load topics:", err);
					setUserTopics([]);
					setUserTopic("");
					setTopicsLoaded(false);
				})
				.finally(() => setTopicsLoading(false));
		}
	}, [showTopicDropdown, topicsLoaded, topicsLoading, userId, userTopic]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, typingContent]);

	const getQuizQuestionBackend = useCallback(async (topic: string): Promise<QuizQuestionResponse> => {
		const currentLlmConfig: LLMConfig = { provider: llmProvider, apiKey: llmApiKey, model: llmProvider === 'ollama' && llmModel === 'custom' && customOllamaModel ? customOllamaModel : llmModel };
		return getQuizQuestion(topic, "medium", userId, currentLlmConfig);
	}, [llmProvider, llmApiKey, llmModel, userId, customOllamaModel]);

	const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

	const handlePdfUpload = useCallback(async (file: File) => {
		setUploading(true);
		try {
			const llmConfig = { provider: llmProvider, apiKey: llmApiKey, model: llmProvider === 'ollama' && llmModel === 'custom' && customOllamaModel ? customOllamaModel : llmModel };
			const result = await uploadSyllabus(file, userId, llmConfig);
			const topicNames = Array.isArray(result.topics)
				? result.topics.map((t: any) => (typeof t === 'string' ? t : t.topic || JSON.stringify(t))).join(', ')
				: 'None';
			setToast({ message: `Syllabus "${file.name}" uploaded successfully!\nDetected topics: ${topicNames}`, visible: true });
			const updatedTopics = await getUserTopics(userId);
			setUserTopics(updatedTopics);
			if (updatedTopics.length > 0 && !userTopic) {
				setUserTopic(updatedTopics[0]);
			}
			setShowTopicDropdown(false);
		} catch (error) {
			console.error("Error uploading syllabus:", error);
			setToast({ message: "Failed to upload syllabus. Please try again.", visible: true });
		} finally {
			setUploading(false);
		}
	}, [llmProvider, llmApiKey, llmModel, userId, userTopic]);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!input.trim()) return;

		const userMessageContent = input.trim();
		const currentLlmConfig: LLMConfig = { provider: llmProvider, apiKey: llmApiKey, model: llmProvider === 'ollama' && llmModel === 'custom' && customOllamaModel ? customOllamaModel : llmModel };

		if ((llmProvider === 'gemini' || llmProvider === 'openai' || llmProvider === 'anthropic') && !llmApiKey) {
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

	const handleGenerateQuiz = useCallback(async () => {
		if (!userTopic) {
			alert("Please select or enter a topic before taking a quiz.");
			return;
		}
		if ((llmProvider === 'gemini' || llmProvider === 'openai' || llmProvider === 'anthropic') && !llmApiKey) {
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

	const [isSpeaking, setIsSpeaking] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

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

	const handleQuizAnswer = useCallback((messageId: string, selectedAnswerId: string) => {
		setMessages(prevMessages =>
			prevMessages.map(msg => {
				if (msg.id === messageId && msg.type === 'quiz' && msg.quiz && !msg.quiz.submitted) {
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

	const ContextSettingsModal = () => (
		<div className="fixed inset-0 bg-[#1e1e2e]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<Card className="bg-[#313244] border-[#45475a] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
				<CardHeader className="border-b border-[#45475a] flex flex-row items-center justify-between p-4 sm:p-6">
					<CardTitle className="text-[#cdd6f4] flex items-center text-lg sm:text-2xl font-bold">
						<Settings className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-[#cba6f7]" />
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
				<CardContent className="p-4 sm:p-6 overflow-y-auto flex-grow">
					<div className="space-y-6 sm:space-y-8">
						{/* LLM Configuration Section */}
						<div className="p-4 sm:p-6 bg-[#181825] rounded-lg border border-[#313244] shadow-inner">
							<h3 className="text-lg sm:text-xl font-bold text-[#f9e2af] mb-3 sm:mb-4 flex items-center">
								<Power className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-[#f9e2af]" />
								LLM Configuration
							</h3>
							<div className="space-y-3 sm:space-y-4">
								<div>
									<label htmlFor="llm-provider" className="block text-[#cdd6f4] text-base sm:text-lg font-medium mb-1 sm:mb-2">
										LLM Provider
									</label>
									<div className="relative">
										<select
											id="llm-provider"
											className="w-full bg-[#1e1e2e] border border-[#45475a] rounded-2xl px-4 py-3 text-[#cdd6f4] focus:outline-none focus:ring-2 focus:ring-[#cba6f7] appearance-none pr-8 sm:pr-10"
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
										<ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-[#a6adc8] pointer-events-none" />
									</div>
								</div>
								<div>
									<label htmlFor="llm-api-key" className="block text-[#cdd6f4] text-base sm:text-lg font-medium mb-1 sm:mb-2">
										API Key
									</label>
									<input
										id="llm-api-key"
										type="password"
										className="w-full bg-[#1e1e2e] border border-[#45475a] rounded-2xl px-4 py-3 text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:ring-2 focus:ring-[#cba6f7]"
										placeholder={`Enter your ${llmProvider} API key`}
										value={llmApiKey}
										onChange={(e) => setLlmApiKey(e.target.value)}
									/>
									<p className="text-[#6c7086] text-xs mt-1">
										Your API key is stored locally in your browser.
									</p>
								</div>
								<div>
									<label htmlFor="llm-model" className="block text-[#cdd6f4] text-base sm:text-lg font-medium mb-1 sm:mb-2">
										Model
									</label>
									<div className="relative">
										<select
											id="llm-model"
											className="w-full bg-[#1e1e2e] border border-[#45475a] rounded-2xl px-4 py-3 text-[#cdd6f4] focus:outline-none focus:ring-2 focus:ring-[#cba6f7] appearance-none pr-10"
											value={llmModel}
											onChange={(e) => {
												const value = e.target.value;
												setLlmModel(value);
												if (llmProvider === 'ollama' && value !== 'custom') {
													setCustomOllamaModel("");
												}
											}}
										>
											{(llmModels[llmProvider] || llmModels['default']).map(model => (
												<option key={model} value={model}>{model}</option>
											))}
										</select>
										<ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-[#a6adc8] pointer-events-none" />
									</div>
									{/* Show custom model input if ollama + custom selected */}
									{llmProvider === 'ollama' && llmModel === 'custom' && (
										<div className="mt-2">
											<label htmlFor="custom-ollama-model" className="block text-[#cdd6f4] text-sm font-medium mb-1">Custom Model Name</label>
											<input
												id="custom-ollama-model"
												type="text"
												className="w-full bg-[#1e1e2e] border border-[#45475a] rounded-2xl px-4 py-2 text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:ring-2 focus:ring-[#cba6f7]"
												placeholder="Enter your custom Ollama model name (e.g. my-model)"
												value={customOllamaModel}
												onChange={e => setCustomOllamaModel(e.target.value)}
												autoFocus
											/>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* System Instructions Section */}
						<div>
							<h3 className="text-lg sm:text-xl font-semibold text-[#cdd6f4] mb-3 sm:mb-4">System Instructions</h3>
							<textarea
								value={systemPrompt}
								onChange={(e) => setSystemPrompt(e.target.value)}
								placeholder="Define how the AI should behave and respond..."
								className="w-full bg-[#1e1e2e] border border-[#45475a] rounded-2xl px-4 py-3 text-[#cdd6f4] placeholder-[#6c7086] resize-none focus:outline-none focus:ring-2 focus:ring-[#cba6f7] focus:border-transparent min-h-[100px] sm:min-h-[120px] text-base"
							/>
							<p className="text-[#6c7086] text-xs sm:text-sm mt-2">Guides the AI's persona and general behavior.</p>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
							<div>
								<label className="block text-[#cdd6f4] text-base sm:text-lg font-medium mb-2 sm:mb-3">Temperature: {temperature.toFixed(1)}</label>
								<input
									type="range"
									min="0"
									max="1"
									step="0.1"
									value={temperature}
									onChange={(e) => setTemperature(Number.parseFloat(e.target.value))}
									className="w-full h-2 bg-[#45475a] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-[#cba6f7] [&::-moz-range-thumb]:bg-[#cba6f7] [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full"
								/>
								<p className="text-[#6c7086] text-xs sm:text-sm mt-2">Controls creativity (0 = focused, 1 = creative)</p>
							</div>
							<div>
								<label className="block text-[#cdd6f4] text-base sm:text-lg font-medium mb-2 sm:mb-3">Max Tokens: {maxTokens}</label>
								<input
									type="range"
									min="100"
									max="2000"
									step="50"
									value={maxTokens}
									onChange={(e) => setMaxTokens(Number.parseInt(e.target.value))}
									className="w-full h-2 bg-[#45475a] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-[#89b4fa] [&::-moz-range-thumb]:bg-[#89b4fa] [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full"
								/>
								<p className="text-[#6c7086] text-xs sm:text-sm mt-2">Maximum response length</p>
							</div>
						</div>
						<div>
							<h3 className="text-lg sm:text-xl font-semibold text-[#cdd6f4] mb-3 sm:mb-4">Quick Templates</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
								<Button
									variant="outline"
									className="bg-[#313244] border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59] justify-start text-left h-auto py-2 sm:py-3 text-sm sm:text-base"
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
									className="bg-[#313244] border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59] justify-start text-left h-auto py-2 sm:py-3 text-sm sm:text-base"
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
									className="bg-[#313244] border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59] justify-start text-left h-auto py-2 sm:py-3 text-sm sm:text-base"
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
									className="bg-[#313244] border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59] justify-start text-left h-auto py-2 sm:py-3 text-sm sm:text-base"
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
				<div className="border-t border-[#45475a] p-4 sm:p-6 flex justify-end space-x-3 sm:space-x-4">
					<Button
						variant="outline"
						onClick={() => setShowContextModal(false)}
						className="bg-[#313244] border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59] font-medium text-sm sm:text-base"
					>
						Cancel
					</Button>
					<Button
						onClick={() => setShowContextModal(false)}
						className="bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e] font-medium text-sm sm:text-base"
					>
						Save Settings
					</Button>
				</div>
			</Card>
		</div>
	);

	return (
		<>
			{toast.visible && (
				<CatppuccinToast message={toast.message} onClose={() => setToast({ ...toast, visible: false })} />
			)}
			<div ref={chatContainerRef} className="min-h-screen bg-[#1e1e2e] text-[#cdd6f4] flex flex-col relative overflow-hidden">
				{/* Animated background elements (from Landing Page Hero Section) */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#cba6f7]/5 rounded-full blur-xl animate-pulse"></div>
					<div className="absolute top-3/4 right-1/4 w-24 h-24 bg-[#89b4fa]/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
					<div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-[#a6e3a1]/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
				</div>

				{/* Header */}
				<header className="bg-[#1e1e2e]/80 backdrop-blur-sm border-b border-[#313244] p-3 flex-shrink-0 z-10">
					<div className="max-w-7xl mx-auto flex items-center justify-between">
						<div className="flex items-center space-x-2 sm:space-x-4">
							<Link href="/">
								<Button variant="ghost" size="sm" className="text-[#cdd6f4] hover:bg-[#313244] px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm">
									<ArrowLeft className="w-3 h-3 mr-1 sm:w-4 sm:h-4 sm:mr-2" />
									Back
								</Button>
							</Link>
							<div className="flex items-center space-x-1 sm:space-x-2">
								<div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#cba6f7] rounded-lg flex items-center justify-center">
									<Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#1e1e2e]" />
								</div>
								<span className="text-base sm:text-xl font-semibold text-[#f9e2af]">Exam Whisperer</span>
							</div>
						</div>
						<div className="flex items-center space-x-2 sm:space-x-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowContextModal(true)}
								className="bg-[#313244] border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59] px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm"
							>
								<Settings className="w-3 h-3 mr-1 sm:w-4 sm:h-4 sm:mr-2" />
								Settings
							</Button>
							{/* Backend Status Indicator */}
							<div className="inline-flex items-center space-x-1 bg-[#313244] px-2 py-1 rounded-full">
								<div className={`w-2 h-2 rounded-full animate-pulse ${isBackendOnline ? 'bg-[#a6e3a1]' : 'bg-[#f38ba8]'}`}></div>
								<span className={`text-xs ${isBackendOnline ? 'text-[#a6e3a1]' : 'text-[#f38ba8]'}`}>
									{isBackendOnline ? "Online" : "Offline"}
								</span>
								{!isBackendOnline && <WifiOff className="w-3 h-3 text-[#f38ba8] ml-1" />}
							</div>
						</div>
					</div>
				</header>

				{/* Main Chat Content Area */}
				<div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-10 relative z-10 flex flex-col justify-end">
					<div className="max-w-4xl mx-auto flex flex-col h-full w-full">
						{/* Chat Messages */}
						<div className="flex-1 overflow-y-auto pr-1 sm:pr-2 pb-4">
							<div className="space-y-4">
								{messages.map((message) => (
									<div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
										<div className={`flex items-start space-x-2 sm:space-x-3 max-w-[95%] sm:max-w-[90%] ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
											<div
												className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === "user" ? "bg-[#cba6f7]" : "bg-[#89b4fa]"}`}
											>
												{message.role === "user" ? (
													<UserCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#1e1e2e]" />
												) : (
													<Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#1e1e2e]" />
												)}
											</div>

											{/* Render message based on type */}
											{message.type === "text" && (
												<Card
													// Ensure these rounded classes are correctly applied for iOS-like bubbles
													className={`p-3 sm:p-4 rounded-[1.25rem] shadow-md text-sm sm:text-base ${message.role === "user"
														? "bg-[#cba6f7] text-[#1e1e2e] rounded-br-[0.3rem]" // User bubbles
														: "bg-[#313244] text-[#cdd6f4] border border-[#45475a] rounded-bl-[0.3rem]" // Assistant bubbles
														}`}
												>
													<div className="whitespace-pre-wrap flex flex-col gap-2">
														<ReactMarkdown
															remarkPlugins={[remarkGfm]}
															components={{
																code(props) {
																	const { className, children, node, ...rest } = props;
																	const isInline = node?.tagName !== 'code';

																	const match = /language-(\w+)/.exec(className || '');
																	return !isInline ? (
																		<pre className="p-2 rounded-md bg-[#1e1e2e] overflow-x-auto text-[#cdd6f4] border border-[#45475a] my-2 text-xs sm:text-sm">
																			<code className={className} {...rest}>{children}</code>
																		</pre>
																	) : (
																		<code className="bg-[#45475a]/50 text-[#cba6f7] rounded px-1 py-0.5 text-xs sm:text-sm" {...rest}>{children}</code>
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
										<div className="flex items-start space-x-2 sm:space-x-3 max-w-[95%] sm:max-w-[80%]">
											<div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#89b4fa] flex items-center justify-center flex-shrink-0">
												<Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#1e1e2e]" />
											</div>
											<Card className="p-3 sm:p-4 rounded-[1.25rem] shadow-md text-sm sm:text-base bg-[#313244] text-[#cdd6f4] border border-[#45475a] rounded-bl-[0.3rem]">
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
						<div className="p-3 bg-[#1e1e2e]/80 backdrop-blur-sm border border-[#313244] rounded-lg mb-3 flex-shrink-0 mt-auto">
							{/* Topic Selection & Quiz Controls */}
							<div className="mb-3 flex flex-wrap justify-between items-center gap-2">
								{/* Topic Selector - Always visible for quick access */}
								<div className="relative flex items-center gap-2 flex-grow">
									<Badge className="bg-[#313244] text-[#cdd6f4] border-[#45475a] px-2 py-0.5 sm:px-3 sm:py-1 font-medium text-xs sm:text-sm">Topic</Badge>
									<Button
										variant="outline"
										className="bg-[#313244] text-[#cdd6f4] border-[#45475a] hover:bg-[#383a59] px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm relative w-full sm:w-auto"
										onClick={() => {
											setShowTopicDropdown(true);
											setTempTopicInput(userTopic);
										}}
										disabled={topicsLoading}
									>
										{topicsLoading ? (
											"Loading..."
										) : (
											<>
												<span className="truncate">{userTopic || "Select/Type Topic"}</span>
												<ChevronDown className={`ml-1 h-3 w-3 sm:ml-2 sm:h-4 sm:w-4 transition-transform ${showTopicDropdown ? 'rotate-180' : ''}`} />
											</>
										)}
									</Button>
									{/* Dynamic Topic Dropdown/Input Overlay */}
									{showTopicDropdown && (
										// This is the full-screen overlay that handles clicks outside the popup
										<div
											className="fixed inset-0 z-20" // Use fixed inset-0 to cover the whole screen
											onClick={() => setShowTopicDropdown(false)} // Click anywhere on this overlay to close
										>
											{/* This is the actual popup content, positioned relative to the button below */}
											<div
												className="absolute left-0 bottom-full mb-2 z-30 w-full sm:w-80 bg-[#313244] border border-[#45475a] rounded-lg shadow-lg p-4"
												onClick={e => e.stopPropagation()} // Prevent clicks inside the popup from closing it
											>
												<h4 className="text-lg font-bold text-[#cdd6f4] mb-3">Manage Topics</h4>
												{userTopics.length > 0 && (
													<div className="mb-4">
														<label htmlFor="topic-select-dropdown" className="block text-[#bac2de] text-sm font-medium mb-1">
															Choose existing topic:
														</label>
														<select
															id="topic-select-dropdown"
															className="w-full bg-[#1e1e2e] border border-[#45475a] rounded px-3 py-2 text-[#cdd6f4] text-sm focus:outline-none focus:ring-1 focus:ring-[#cba6f7]"
															value={tempTopicInput}
															onChange={e => setTempTopicInput(e.target.value)}
														>
															<option value="">-- Select --</option>
															{userTopics.map((topic) => (
																<option key={topic} value={topic}>{topic}</option>
															))}
														</select>
													</div>
												)}
												<div className="mb-4">
													<label htmlFor="topic-custom-input" className="block text-[#bac2de] text-sm font-medium mb-1">
														Or add a new topic:
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
												</div>
												<div className="space-y-2">
													<Button
														size="sm"
														className="w-full bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e] font-medium"
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
														Select Topic
													</Button>
													<label htmlFor="syllabus-upload" className="w-full block">
														<Button
															asChild
															size="sm"
															className="w-full bg-[#89b4fa] hover:bg-[#7aa2f7] text-[#1e1e2e] font-medium cursor-pointer"
															disabled={uploading}
														>
															<div>
																<Upload className="w-4 h-4 mr-2" />
																{uploading ? "Uploading..." : "Upload PDF Syllabus"}
																<input
																	id="syllabus-upload"
																	type="file"
																	accept=".pdf"
																	className="hidden"
																	onChange={(e) => {
																		const file = e.target.files?.[0];
																		if (file) {
																			handlePdfUpload(file);
																		}
																	}}
																/>
															</div>
														</Button>
													</label>
													<Button
														size="sm"
														variant="outline"
														className="w-full mt-2 text-[#f38ba8] border-[#f38ba8] hover:bg-[#f38ba8]/10"
														onClick={() => setShowTopicDropdown(false)}
													>
														Cancel
													</Button>
												</div>
											</div>
										</div>
									)}
								</div>
								<Button
									variant="outline"
									className="bg-[#313244] text-[#cdd6f4] border-[#45475a] hover:bg-[#383a59] px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm"
									onClick={handleGenerateQuiz}
									disabled={isLoading}
								>
									<Lightbulb className="w-3 h-3 mr-1 sm:w-4 sm:h-4 sm:mr-2" /> Quiz
								</Button>
							</div>
							{/* Textarea Input */}
							<form onSubmit={handleSubmit} className="flex items-end space-x-2 sm:space-x-4">
								<div className="flex-1 relative">
									<textarea
										ref={inputRef}
										value={input}
										onChange={(e) => setInput(e.target.value)}
										onKeyPress={handleKeyPress}
										placeholder="Ask me anything about your studies..."
										className="w-full bg-[#313244] border border-[#45475a] rounded-2xl px-4 py-3 text-[#cdd6f4] placeholder-[#6c7086] resize-none focus:outline-none focus:ring-2 focus:ring-[#cba6f7] focus:border-transparent min-h-[40px] max-h-[100px] text-sm sm:text-base pr-8 sm:pr-10"
										rows={1}
										disabled={isLoading}
									/>
									<div className="absolute bottom-1 right-1 text-xs text-[#6c7086]">
										Enter to send, Shift+Enter for new line
									</div>
								</div>
								<Button
									type="submit"
									disabled={!input.trim() || isLoading}
									className="bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e] px-4 py-2 h-[40px] sm:px-6 sm:py-3 sm:h-[50px] flex-shrink-0"
								>
									{isLoading ? (
										<div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-[#1e1e2e]/30 border-t-[#1e1e2e] rounded-full animate-spin" />
									) : (
										<Send className="w-4 h-4 sm:w-5 sm:h-5" />
									)}
								</Button>
							</form>
						</div>
					</div>
				</div>

				{/* Context Control Modal */}
				{showContextModal && <ContextSettingsModal />}
			</div>
		</>
	)
}