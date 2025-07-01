// // ChatPage: Exam Whisperer chat UI with topic selection, quiz modal, context/settings modal, and syllabus upload.
// // - Manages chat messages, user input, loading/typing state, and scroll
// // - Fetches user topics and handles topic selection via modal
// // - Allows PDF syllabus upload and manages reference documents
// // - Supports quiz modal and quiz completion
// // - Provides context/settings modal for system prompt and model parameters
// // - Handles text-to-speech for assistant replies

// "use client"

// import type React from "react"
// import { useState, useRef, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Brain, Send, User, ArrowLeft, Settings, Upload, FileText, X, Trash2 } from "lucide-react"
// import Link from "next/link"
// import { askAnything } from "@/lib/api"
// import { uploadSyllabus } from "@/lib/api-syllabus"
// import QuizModal from "@/components/QuizModal"
// import { getUserTopics } from "@/lib/api"

// interface Message {
//   id: string
//   content: string
//   role: "user" | "assistant"
//   timestamp: Date
// }

// export default function ChatPage() {
//   const [messages, setMessages] = useState<Message[]>([
//     {
//       id: "welcome",
//       content:
//         "Hi! I'm Exam Whisperer, your AI study companion. Ask me anything about your studies - I can explain concepts, help with practice questions, or discuss any topic you're learning about!",
//       role: "assistant",
//       timestamp: new Date(),
//     },
//   ])
//   const [input, setInput] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const [typingContent, setTypingContent] = useState("")
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const inputRef = useRef<HTMLTextAreaElement>(null)

//   const [showContextModal, setShowContextModal] = useState(false)
//   const [contextDocs, setContextDocs] = useState<Array<{ id: string; name: string; content: string; type: string }>>([])
//   const [systemPrompt, setSystemPrompt] = useState(
//     "You are Exam Whisperer, a helpful AI tutor. Provide clear, student-friendly explanations.",
//   )
//   const [temperature, setTemperature] = useState(0.7)
//   极简
//   const [maxTokens, setMaxTokens] = useState(500)
//   const [uploading, setUploading] = useState(false)
//   const [quizActive, setQuizActive] = useState(false)
//   const [userTopic, setUserTopic] = useState("")
//   const [userTopics, setUserTopics] = useState<string[]>([])
//   const [top极简icsLoading, setTopicsLoading] = useState(false)
//   const [topicModalOpen, setTopicModalOpen] = useState(false)
//   const userId = "demo-user"

//   useEffect(() => {
//     setTopicsLoading(true)
//     getUserTopics(userId)
//       .then((topics) => {
//         setUserTopics(topics)
//         if (topics.length > 0 && !userTopic) setTopicModalOpen(true)
//       })
//       .catch((err: unknown) => {
//         if (err instanceof Error) {
//           console.error(err.message)
//         } else {
//           console.error("Failed to load topics")
//         }
//       })
//       .finally(() => setTopicsLoading(false))
//   }, [userId, userTopic])

//   useEffect(() => {
//     if (userTopic) setTopicModalOpen(false)
//   }, [userTopic])

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
//   }, [messages, typingContent])

//   async function handlePdfUpload(file: File) {
//     setUploading(true)
//     try {
//       const result = await uploadSyllabus(file, userId)
//       alert("Syllabus uploaded! Topics: " + JSON.stringify(result.topics))
//     } catch {
//       // Optionally handle error
//     } finally {
//       setUploading(false)
//     }
//   }

//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault()
//     if (!input.trim()) return

//     const userMessage: Message = {
//       id: Date.now().toString(),
//       content: input,
//       role: "user",
//       timestamp: new Date(),
//     }

//     setMessages((prev) => [...prev, userMessage])
//     setInput("")
//     setIsLoading(true)
//     setTypingContent("")

//     try {
//       const response = await askAnything(input, userId, userTopic)
//       setMessages((prev) => [
//         ...prev,
//         {
//           id: Date.now().toString() + "-assistant",
//           content: response.content,
//           role: "assistant",
//           timestamp: new Date(),
//         },
//       ])
//       setTypingContent("")
//     } catch {
//       setMessages((prev) => [
//         ...prev,
//         {
//           id: Date.now().toString() + "-error",
//           content: "Sorry, something went wrong. Please try again.",
//           role: "assistant",
//           timestamp: new Date(),
//         },
//       ])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   function handleKeyPress(e: React.KeyboardEvent<HTMLTextAreaElement>) {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault()
//       if (!isLoading && input.trim()) {
//         const form = (e.target as HTMLElement).closest("form")
//         if (form) {
//           form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
//         }
//       }
//     }
//   }

//   async function handleReadAloud(text: string) {
//     try {
//       const res = await fetch("/api/tts", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text }),
//       })
//       if (!res.ok) throw new Error("TTS failed")
//       const data = await res.json()
//       if (!data.audio) throw new Error("No audio returned")
//       const audio = new Audio(`data:audio/mp3;base64,${data.audio}`)
//       audio.play()
//     } catch {
//       alert("Text-to-speech failed. Please try again.")
//     }
//   }

//   const handleQuizComplete = (result: { correct: number; total: number; topic: string }) => {
//     setMessages((prev) => [
//       ...prev,
//       {
//         id: Date.now().toString(),
//         content: `You scored ${result.correct} / ${result.total} on the quiz about "${result.topic}"!`,
//         role: "assistant",
//         timestamp: new Date(),
//       },
//     ])
//   }

//   function TopicModal({ open, children }: { open: boolean; children: React.ReactNode }) {
//     if (!open) return null
//     return (
//       <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1e2e]/80">
//         <div className="bg-[#313244] border border-[#45475a] rounded-lg shadow-lg p-8 min-w-[320px] max-w-full">
//           {children}
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-[#1e1e2e] text-[#cdd6f4] flex flex-col">
//       {/* Topic Selection Modal */}
//       <TopicModal open={topicModalOpen}>
//         <div className="mb-4 text-xl font-bold text极简[#cdd6f4]">Select a Topic</div>
//         {topicsLoading ? (
//           <div className="text-[#cdd6f4]">Loading topics...</div>
//         ) : userTopics.length > 0 ? (
//           <select
//             className="border border-[#45475a] bg-[#313244] text-[#cdd6f4] p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#cba6f7] min-w-[180px]"
//             value={userTopic}
//             onChange={e => setUserTopic(e.target.value)}
//           >
//             <option value="">Select a topic</option>
//             {userTopics.map((topic) => (
//               <option key={topic} value={topic}>{topic}</option>
//             ))}
//             <option value="__custom__">Other (type manually)</option>
//           </select>
//         ) : (
//           <input
//             className="border border-[#45475a] bg-[#313244] text-[#cdd6f4] p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#cba6f7] min-w-[180px]"
//             placeholder="Enter custom topic"
//             value={userTopic}
//             onChange={e => setUserTopic(e.target.value)}
//           />
//         )}
//         <div className="mt-4 flex justify-end">
//           <Button
//             onClick={() => {
//               if (userTopic) setTopicModalOpen(false)
//             }}
//             disabled={!userTopic}
//             className="bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e]"
//           >
//             Confirm
//           </Button>
//         </div>
//       </TopicModal>

//       {/* Header */}
//       <header className="bg-[#1e1e2e]/80 backdrop-blur-sm border-b border-[#313244] p-4">
//         <div className="container mx-auto flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <Link href="/">
//               <Button variant="ghost" size="sm" className="text-[#cdd6f4] hover:bg-[#313244]">
//                 <ArrowLeft className="w-4 h-4 mr-2" />
//                 Back
//               </Button>
//             </Link>
//             <div className="flex items-center space-x-2">
//               <div className="w-8 h-8 bg-[#cba6f7] rounded-lg flex items-center justify-center">
//                 <Brain className="h-5 w-5 text-[#1e1e2e]" />
//               </div>
//               <span className="text-xl font-semibold text-[#f9e2af]">Exam Whisperer</span>
//             </div>
//           </div>
//           <div className="flex items-center space-x-4">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setShowContextModal(true)}
//               className="bg-[#313244] border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59]"
//             >
//               <Settings className="w-4 h-4 mr-2" />
//               Context & Settings
//             </Button>
//             <div className="inline-flex items-center space-x-2 bg-[#313244] px-3 py-1 rounded-full">
//               <div className="w-2 h-2 bg-[#a6e3a1] rounded-full animate-pulse"></div>
//               <span className="text-sm text-[#a6e3a1]">Online</span>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Chat Messages */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         <div className="container mx-auto max-w-4xl">
//           {messages.map((message) => (
//             <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
//               <div className={`flex items-start space-x-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
//                 <div
//                   className={`w-8 h-8 rounded-full flex items-center justify-center ${message.role === "user" ? "bg-[#cba6f7]" : "bg-[#89b4fa]"}`}
//                 >
//                   {message.role === "user" ? (
//                     <User className="w-4 h-4 text-[#1e1e2e]" />
//                   ) : (
//                     <Brain className="w-4 h-4 text-[#1e1e2e]" />
//                   )}
//                 </div>
//                 <Card
//                   className={`p-4 ${message.role === "user" ? "bg-[#cba6f7] text-[#1e1e2e]" : "bg-[#313244] text-[#cdd6f极简4] border-[#45475a]"}`}
//                 >
//                   <div className="whitespace-pre-wrap flex flex-col gap-2">
//                     {message.content}
//                     {message.role === "assistant" && (
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         className="mt-2 w-fit border-[#45475a] text-[#a6adc8] hover:bg-[#383a59]"
//                         onClick={() => handleReadAloud(message.content)}
//                       >
//                         🔊 Read Aloud
//                       </Button>
//                     )}
//                   </div>
//                   <div
//                     className={`text-xs mt-2 opacity-70 ${message.role === "user" ? "text-[#1e1e2e]/70" : "text-[#a6adc8]"}`}
//                   >
//                     {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//                   </div>
//                 </Card>
//               </div>
//             </div>
//           ))}

//           {/* Typing Indicator */}
//           {(isLoading || typingContent) && (
//             <div className="flex justify-start mb-4">
//               <div className="flex items-start space-x-3 max-w-[80%]">
//                 <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
//                   <Brain className="w-4 h-4 text-white" />
//                 </div>
//                 <Card className="p-4 bg-white/10 text-white border-white/20">
//                   {typingContent ? (
//                     <div className="whitespace-pre-wrap">
//                       {typingContent}
//                       <span className="animate-pulse">|</span>
//                     </div>
//                   ) : (
//                     <div className="flex items-center space-x-2">
//                       <div className="flex space-x-1">
//                         <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
//                         <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
//                         <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
//                       </div>
//                       <span className="text-gray-300 text-sm">Thinking...</span>
//                     </div>
//                   )}
//                 </Card>
//               </div>
//             </div>
//           )}

//           <div ref={messagesEndRef} />
//         </div>
//       </div>

//       {/* Input Area */}
//       <div className="bg-[#1e1e2e]/80 backdrop-blur-sm border-t border-[#313244] p-4">
//         <div className="container mx-auto max-w-4xl">
//           {!quizActive && (
//             <div className="mb-2 flex justify-end">
//               <Button
//                 variant="outline"
//                 className="bg-[#313244] text-[#cdd6f4] border-[#45475a] hover:bg-[#383a59]"
//                 onClick={() => setQuizActive(true)}
//                 disabled={topicModalOpen}
//               >
//                 📝 Take a Quiz
//               </Button>
//             </div>
//           )}
//           {!quizActive && !topicModalOpen && (
//             <form onSubmit={handleSubmit} className="flex items-end space-x-4">
//               <div className="flex-1 relative">
//                 <div className="mb-2 flex items-center gap-2">
//                   <span className="text-[#cdd6f4] text-sm font-semibold bg-[#313244] px-2 py-1 rounded-l">Topic</span>
//                   {topicsLoading ? (
//                     <span className="text-[#cdd6f4]">Loading topics...</span>
//                   ) : userTopics.length > 0 && userTopic !== "__custom__" ? (
//                     <select
//                       className="border border-[#45475a] bg-[#313244] text-[#cdd6f4] p-2 rounded-r focus:outline-none focus:ring-2 focus:ring-[#cba6f7] min-w-[180px]"
//                       value={userTopic}
//                       onChange={e => {
//                         if (e.target.value === "__custom__") {
//                           setUserTopic("")
//                         } else {
//                           setUserTopic(e.target.value)
//                         }
//                       }}
//                     >
//                       <option value="">Select a topic</option>
//                       {userTopics.map((topic) => (
//                         <option key={topic} value={topic}>{topic}</option>
//                       ))}
//                       <option value="__custom__">Other (type manually)</option>
//                     </select>
//                   ) : (
//                     <input
//                       className="border border-[#45475a] bg-[#313244] text-[#cdd6f4] p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#cba6f7] min-w-[180px]"
//                       placeholder="Enter custom topic"
//                       value={userTopic}
//                       onChange={e => setUserTopic(e.target.value)}
//                     />
//                   )}
//                 </div>
//                 <textarea
//                   ref={inputRef}
//                   value={input}
//                   onChange={(e) => setInput(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   placeholder="Ask me anything about your studies..."
//                   className="w-full bg-[#313244] border border-[#45475a] rounded-lg px-4 py-3 text-[#cdd6f4] placeholder-[#6c7086] resize-none focus:outline-none focus:ring-2 focus:ring-[#cba6f7] focus:border-transparent min-h-[50px] max-h-[120px]"
//                   rows={1}
//                   disabled={isLoading}
//                 />
//                 <div className="absolute bottom-2 right-2 text-xs text-[#6c7086]">
//                   Press Enter to send, Shift+Enter for new line
//                 </div>
//               </div>
//               <Button
//                 type="submit"
//                 disabled={!input.trim() || isLoading}
//                 className="bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e] px-6 py-3 h-[50px]"
//               >
//                 {isLoading ? (
//                   <div className="w-5 h-5 border-2 border-[#1e1e2e]/30 border-t-[#1e1e2e] rounded-full animate-spin" />
//                 ) : (
//                   <Send className="w-5 h-5" />
//                 )}
//               </Button>
//             </form>
//           )}
//         </div>
//       </div>

//       {/* Quiz Modal Overlay */}
//       <QuizModal
//         open={quizActive}
//         onClose={() => setQuizActive(false)}
//         defaultTopic={userTopic}
//         onQuizComplete={handleQuizComplete}
//       />

//       {/* Context Control Modal */}
//       {showContextModal && (
//         <div className="fixed inset-0 bg-[#1e1e2e]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <Card className="bg-[#313244] border-[#45475a] w-full max-w-4xl max-h-[80vh] overflow-hidden">
//             <CardHeader className="border-b border-[#45475a]">
//               <div className="flex items-center justify-between">
//                 <CardTitle className="text-[#cdd6f4] flex items-center">
//                   <Settings className="mr-2 h-5 w-5 text-[#cba6f7]" />
//                   Context & Settings
//                 </CardTitle>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => setShowContextModal(false)}
//                   className="text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#383a59]"
//                 >
//                   <X className="w-4 h-4" />
//                 </Button>
//               </div>
//             </CardHeader>
//             <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
//               <div className="space-y-6">
//                 <div>
//                   <h3 className="text-lg font-semibold text-[#cdd6f4] mb-3">System Instructions</h3>
//                   <textarea
//                     value={systemPrompt}
//                     onChange={(e) => setSystemPrompt(e.target.value)}
//                     placeholder="Define how the AI should behave and respond..."
//                     className="w-full bg-[#1e1e2e] border border-[#45475a] rounded-lg px-4 py-3 text-[#cdd6f4] placeholder-[#6c7086] resize-none focus:outline-none focus:ring-2 focus:ring-[#cba6f7] focus:border-transparent min-h-[100px]"
//                   />
//                 </div>
//                 <div className="grid md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-[#cdd6f4] text-sm font-medium mb-2">Temperature: {temperature}</label>
//                     <input
//                       type="range"
//                       min="0"
//                       max="1"
//                       step="0.1"
//                       value={temperature}
//                       onChange={(e) => setTemperature(Number.parseFloat(e.target.value))}
//                       className="w-full h-2 bg-[#45475a] rounded-lg appearance-none cursor-pointer slider"
//                     />
//                     <p className="text-[#6c7086] text-xs mt-1">Controls creativity (0 = focused, 1 = creative)</p>
//                   </div>
//                   <div>
//                     <label className="block text-[#cdd6f4] text-sm font-medium mb-2">Max Tokens: {maxTokens}</label>
//                     <input
//                       type="range"
//                       min="100"
//                       max="2000"
//                       step="50"
//                       value={maxTokens}
//                       onChange={(e) => setMaxTokens(Number.parseInt(e.target.value))}
//                       className="w-full h-2 bg-[#45475a] rounded-lg appearance-none cursor-pointer slider"
//                     />
//                     <p className="text-[#6c7086] text-xs mt-1">Maximum response length</p>
//                   </div>
//                 </div>
//                 <div>
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="text-lg font-semibold text-[#cdd6f4]">Reference Documents</h3>
//                     <Button
//                       size="sm"
//                       className="bg-[#cba极简6f7] hover:bg-[#b4befe] text-[#1e1e2e]"
//                       disabled={uploading}
//                       onClick={() => {
//                         const input = document.createElement("input")
//                         input.type = "file"
//                         input.accept = ".pdf"
//                         input.onchange = (e) => {
//                           const file = (e.target as HTMLInputElement).files?.[0]
//                           if (file) {
//                             handlePdfUpload(file)
//                           }
//                         }
//                         input.click()
//                       }}
//                     >
//                       <Upload className="w-4 h-4 mr-2" />
//                       {uploading ? "Uploading..." : "Upload PDF Syllabus"}
//                     </Button>
//                   </div>
//                   {contextDocs.length === 0 ? (
//                     <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
//                       <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                       <p className="text-gray-400 mb-2">No documents uploaded</p>
//                       <p className="text-gray-500 text-sm">Upload documents for the AI to reference in responses</p>
//                     </div>
//                   ) : (
//                     <div className="space-y-3">
//                       {contextDocs.map((doc) => (
//                         <div key={doc.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
//                           <div className="flex items-center justify-between">
//                             <div className="flex items-center space-x-3">
//                               <FileText className="w-5 h-5 text-blue-400" />
//                               <div>
//                                 <p className="text-white font-medium">{doc.name}</p>
//                                 <p className="text-gray-400 text-sm">
//                                   {doc.content.length} characters • {doc.type}
//                                 </p>
//                               </div>
//                             </div>
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => setContextDocs((prev) => prev.filter((d) => d.id !== doc.id))}
//                               className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </Button>
//                           </div>
//                           <div className="mt-3 bg-gray-800/50 rounded p-3 max-h-32 overflow-y-auto">
//                             <p className="text-gray-300 text-sm whitespace-pre-wrap">
//                               {doc.content.slice(0, 200)}
//                               {doc.content.length > 200 && "..."}
//                             </p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-white mb-3">Quick Templates</h3>
//                   <div className="grid md:grid-cols-2 gap-3">
//                     <Button
//                       variant="outline"
//                       className="bg-white/5 border-white/20 text-white hover:bg-white/10 justify-start"
//                       onClick={() =>
//                         setSystemPrompt(
//                           "You are a math tutor. Break down complex problems step-by-step and explain the reasoning behind each step.",
//                         )
//                       }
//                     >
//                       Math Tutor
//                     </Button>
//                     <Button
//                       variant="outline"
//                       className="bg-white/5 border-white/20 text-white hover:bg-white/10 justify-start"
//                       onClick={() =>
//                         setSystemPrompt(
//                           "You are a science teacher. Use analogies and real-world examples to explain scientific concepts clearly.",
//                         )
//                       }
//                     >
//                       Science Teacher
//                     </Button>
//                     <Button
//                       variant="outline"
//                       className="bg-white/5 border-white/20 text-white hover:bg-white/10 justify-start"
//                       onClick={() =>
//                         setSystemPrompt(
//                           "You are a writing coach. Help improve essays, grammar, and writing style with constructive feedback.",
//                         )
//                       }
//                     >
//                       Writing Coach
//                     </Button>
//                     <Button
//                       variant="outline"
//                       className="bg-white/5 border-white/20 text-white hover:bg-white/10 justify-start"
//                       onClick={() =>
//                         setSystemPrompt(
//                           "You are a quiz master. Create engaging questions and provide detailed explanations for answers.",
//                         )
//                       }
//                     >
//                       Quiz Master
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//             <div className="border-t border-white/10 p-4 flex justify-end space-x-3">
//               <Button
//                 variant="outline"
//                 onClick={() => setShowContextModal(false)}
//                 className="bg-white/5 border-white/20 text-white hover:bg-white/10"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={() => setShowContextModal(false)}
//                 className="bg-purple-600 hover:bg-purple-700 text-white"
//               >
//                 Save Settings
//               </Button>
//             </div>
//           </Card>
//         </div>
//       )}
//     </div>
//   )
// }
