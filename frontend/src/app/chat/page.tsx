"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Send, User, Sparkles, ArrowLeft, Settings, Upload, FileText, X, Trash2 } from "lucide-react"
import Link from "next/link"
import { askAnything } from "@/lib/api"
import { uploadSyllabus } from "@/lib/api-syllabus"
import QuizModal from "@/components/QuizModal"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hi! I'm Exam Whisperer, your AI study companion. Ask me anything about your studies - I can explain concepts, help with practice questions, or discuss any topic you're learning about!",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [typingContent, setTypingContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [showContextModal, setShowContextModal] = useState(false)
  const [contextDocs, setContextDocs] = useState<Array<{ id: string; name: string; content: string; type: string }>>([])
  const [systemPrompt, setSystemPrompt] = useState(
    "You are Exam Whisperer, a helpful AI tutor. Provide clear, student-friendly explanations.",
  )
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(500)

  // Add state for upload
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Quiz state
  const [quizActive, setQuizActive] = useState(false)
  const [userTopic, setUserTopic] = useState("")

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingContent])

  const simulateTyping = (text: string, callback: () => void) => {
    let index = 0
    setTypingContent("")

    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setTypingContent((prev) => prev + text[index])
        index++
      } else {
        clearInterval(typeInterval)
        setTypingContent("")
        callback()
      }
    }, 30)
  }

  const generateAIResponse = (userMessage: string): string => {
    // Include context from uploaded documents
    let contextInfo = ""
    if (contextDocs.length > 0) {
      contextInfo = `\n\nBased on the uploaded documents: ${contextDocs.map((doc) => doc.content.slice(0, 500)).join("\n\n")}`
    }

    const responses = [
      `${systemPrompt}\n\nRegarding "${userMessage.slice(0, 30)}...":\n\nLet me break this down for you in simple terms.\n\nThis concept is actually quite fascinating when you think about it. The key thing to understand is that everything builds upon fundamental principles.${contextInfo}\n\nWould you like me to explain any specific part in more detail?`,

      `Following my instructions as your tutor: I can help you understand this topic!\n\nHere's a student-friendly explanation:\n\n${userMessage.includes("math") || userMessage.includes("equation")
        ? "Mathematics is all about patterns and relationships. Let's work through this step by step so it makes perfect sense."
        : "This is a really important concept that many students find challenging at first, but once you get it, everything clicks into place."
      }${contextInfo}\n\nWhat specific aspect would you like me to focus on?`,

      `Great question! Based on my role as your study companion:\n\nLet me explain this in a way that's easy to remember:\n\n• First, think of it like this...\n• Then, consider how it connects to what you already know\n• Finally, here's a simple way to remember it${contextInfo}\n\nDoes this help clarify things? Feel free to ask follow-up questions!`,
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Call backend endpoint for explanation
      const response = await askAnything(input.trim(), "demo-user", userTopic);
      // Adjust this depending on your backend's response shape
      const aiResponse = response.answer || response.explanation || JSON.stringify(response)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "Sorry, there was an error contacting the backend.",
          role: "assistant",
          timestamp: new Date(),
        },
      ])
    }
    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Handler for PDF upload
  async function handlePdfUpload(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      // You can replace 'demo-user' with real user id logic
      const result = await uploadSyllabus(file, "demo-user")
      // Optionally, show topics or update contextDocs with result.topics
      alert("Syllabus uploaded! Topics: " + JSON.stringify(result.topics))
    } catch (err: any) {
      setUploadError(err.message || "Upload failed")
    }
    setUploading(false)
  }

  // Read Aloud using backend Omnidimension TTS
  async function handleReadAloud(text: string) {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const data = await res.json();
      if (!data.audio) throw new Error("No audio returned");
      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
      audio.play();
    } catch (err) {
      alert("Text-to-speech failed. Please try again.");
    }
  }

  // Handler for quiz completion
  const handleQuizComplete = (result: { correct: number; total: number; topic: string }) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: `You scored ${result.correct} / ${result.total} on the quiz about "${result.topic}"!`,
        role: "assistant",
        timestamp: new Date(),
      },
    ])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">Exam Whisperer</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContextModal(true)}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <Settings className="w-4 h-4 mr-2" />
              Context & Settings
            </Button>
            <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Online
            </Badge>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="container mx-auto max-w-4xl">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
              <div
                className={`flex items-start space-x-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${message.role === "user" ? "bg-purple-600" : "bg-gradient-to-r from-blue-500 to-purple-600"}`}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Brain className="w-4 h-4 text-white" />
                  )}
                </div>
                <Card
                  className={`p-4 ${message.role === "user" ? "bg-purple-600 text-white" : "bg-white/10 text-white border-white/20"}`}
                >
                  <div className="whitespace-pre-wrap flex flex-col gap-2">
                    {message.content}
                    {message.role === "assistant" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-fit"
                        onClick={() => handleReadAloud(message.content)}
                      >
                        🔊 Read Aloud
                      </Button>
                    )}
                  </div>
                  <div
                    className={`text-xs mt-2 opacity-70 ${message.role === "user" ? "text-purple-100" : "text-gray-300"}`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </Card>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {(isLoading || typingContent) && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start space-x-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <Card className="p-4 bg-white/10 text-white border-white/20">
                  {typingContent ? (
                    <div className="whitespace-pre-wrap">
                      {typingContent}
                      <span className="animate-pulse">|</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                      <span className="text-gray-300 text-sm">Thinking...</span>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-black/20 backdrop-blur-md border-t border-white/10 p-4">
        <div className="container mx-auto max-w-4xl">
          {/* Quiz trigger button above input */}
          {!quizActive && (
            <div className="mb-2 flex justify-end">
              <Button
                variant="outline"
                className="bg-purple-700 text-white border-purple-400 hover:bg-purple-800"
                onClick={() => setQuizActive(true)}
              >
                📝 Take a Quiz
              </Button>
            </div>
          )}
          {/* Hide chat input if quiz is active */}
          {!quizActive && (
            <form onSubmit={handleSubmit} className="flex items-end space-x-4">
              <div className="flex-1 relative">
                {/* Topic selector */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-white text-sm font-semibold bg-purple-800 px-2 py-1 rounded-l">Topic</span>
                  <input
                    className="border border-purple-500 bg-slate-900 text-white p-2 rounded-r focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[180px]"
                    placeholder="Set topic (e.g. Paleontology)"
                    value={userTopic}
                    onChange={e => setUserTopic(e.target.value)}
                  />
                </div>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your studies..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[50px] max-h-[120px]"
                  rows={1}
                  disabled={isLoading}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 h-[50px]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
          )}
          {/* ...existing quick suggestions... */}
        </div>
      </div>

      {/* Quiz Modal Overlay */}
      <QuizModal open={quizActive} onClose={() => setQuizActive(false)} topic={userTopic} onQuizComplete={handleQuizComplete} />

      {/* Context Control Modal */}
      {showContextModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-gray-900/95 border-white/20 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-purple-400" />
                  Context & Settings
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContextModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* System Prompt Section */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">System Instructions</h3>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Define how the AI should behave and respond..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
                  />
                </div>

                {/* Model Parameters */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Temperature: {temperature}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(Number.parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <p className="text-gray-400 text-xs mt-1">Controls creativity (0 = focused, 1 = creative)</p>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Max Tokens: {maxTokens}</label>
                    <input
                      type="range"
                      min="100"
                      max="2000"
                      step="50"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(Number.parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <p className="text-gray-400 text-xs mt-1">Maximum response length</p>
                  </div>
                </div>

                {/* Document Context Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Reference Documents</h3>
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
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
                    <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">No documents uploaded</p>
                      <p className="text-gray-500 text-sm">Upload documents for the AI to reference in responses</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contextDocs.map((doc) => (
                        <div key={doc.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-blue-400" />
                              <div>
                                <p className="text-white font-medium">{doc.name}</p>
                                <p className="text-gray-400 text-sm">
                                  {doc.content.length} characters • {doc.type}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setContextDocs((prev) => prev.filter((d) => d.id !== doc.id))}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="mt-3 bg-gray-800/50 rounded p-3 max-h-32 overflow-y-auto">
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">
                              {doc.content.slice(0, 200)}
                              {doc.content.length > 200 && "..."}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Templates */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Quick Templates</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10 justify-start"
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
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10 justify-start"
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
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10 justify-start"
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
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10 justify-start"
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
            <div className="border-t border-white/10 p-4 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowContextModal(false)}
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowContextModal(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Save Settings
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

