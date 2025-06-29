"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Brain, TrendingUp, Volume2, Sparkles, ArrowRight, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="h-screen overflow-y-scroll bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 scroll-smooth snap-y snap-mandatory">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">Exam Whisperer</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#ask-anything" className="text-gray-300 hover:text-white transition-colors">
              Ask Anything
            </a>
            <a href="#quiz-mode" className="text-gray-300 hover:text-white transition-colors">
              Quiz Mode
            </a>
            <a href="#learning-tracker" className="text-gray-300 hover:text-white transition-colors">
              Tracker
            </a>
            <a href="#voice" className="text-gray-300 hover:text-white transition-colors">
              Voice
            </a>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">Get Started</Button>
        </div>
      </nav>

      {/* Scroll Indicator */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50 hidden lg:flex flex-col space-y-3">
        <div className="w-2 h-2 rounded-full bg-white/30 hover:bg-white/60 transition-colors cursor-pointer"></div>
        <div className="w-2 h-2 rounded-full bg-white/30 hover:bg-white/60 transition-colors cursor-pointer"></div>
        <div className="w-2 h-2 rounded-full bg-white/30 hover:bg-white/60 transition-colors cursor-pointer"></div>
        <div className="w-2 h-2 rounded-full bg-white/30 hover:bg-white/60 transition-colors cursor-pointer"></div>
        <div className="w-2 h-2 rounded-full bg-white/30 hover:bg-white/60 transition-colors cursor-pointer"></div>
        <div className="w-2 h-2 rounded-full bg-white/30 hover:bg-white/60 transition-colors cursor-pointer"></div>
      </div>

      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden snap-start snap-always">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        >
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-purple-600/20 text-purple-300 border-purple-500/30">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Learning
          </Badge>
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
            Exam
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {" "}
              Whisperer
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Your AI study companion that transforms how you prepare for exams. Get personalized explanations, practice
            with smart quizzes, and track your progress.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg">
              Start Learning Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg bg-transparent"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Ask Anything Section */}
      <section id="ask-anything" className="h-screen flex items-center py-20 bg-black/20 snap-start snap-always">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-blue-600/20 text-blue-300 border-blue-500/30">
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask Anything
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Get Clear Explanations
                <span className="text-blue-400"> Instantly</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Confused about a concept? Just ask! Our AI breaks down complex topics into clean, concise explanations
                tailored to your learning level.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Student-level explanations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Instant responses</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Any subject, any topic</span>
                </div>
              </div>
            </div>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageCircle className="mr-2 h-5 w-5 text-blue-400" />
                  Ask Your Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <p className="text-gray-300 text-sm">You asked:</p>
                    <p className="text-white">"Explain photosynthesis in simple terms"</p>
                  </div>
                  <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-500/30">
                    <p className="text-gray-300 text-sm mb-2">AI Response:</p>
                    <p className="text-white">
                      Photosynthesis is like cooking for plants! They use sunlight as energy, water from their roots,
                      and carbon dioxide from the air to make their own food (glucose). As a bonus, they release oxygen
                      that we breathe!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quiz Mode Section */}
      <section id="quiz-mode" className="h-screen flex items-center py-20 snap-start snap-always">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm order-2 lg:order-1">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-green-400" />
                  Practice Quiz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <p className="text-white font-medium mb-3">What is the powerhouse of the cell?</p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
                        <span className="text-gray-300">Nucleus</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-500"></div>
                        <span className="text-white">Mitochondria</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
                        <span className="text-gray-300">Ribosome</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-600/20 p-3 rounded-lg border border-green-500/30">
                    <p className="text-green-300 text-sm">✓ Correct! Great job!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="order-1 lg:order-2">
              <Badge className="mb-4 bg-green-600/20 text-green-300 border-green-500/30">
                <Brain className="w-4 h-4 mr-2" />
                Quiz Mode
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Practice Makes
                <span className="text-green-400"> Perfect</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Test your knowledge with AI-generated quizzes. Choose from multiple-choice questions or short-answer
                formats, all tailored to your specific topics.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Topic-based questions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Multiple question formats</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Instant feedback</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Tracker Section */}
      <section id="learning-tracker" className="h-screen flex items-center py-20 bg-black/20 snap-start snap-always">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-orange-600/20 text-orange-300 border-orange-500/30">
                <TrendingUp className="w-4 h-4 mr-2" />
                Learning Tracker
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Track Your
                <span className="text-orange-400"> Progress</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                See exactly where you're excelling and where you need more practice. Our intelligent tracking shows your
                strengths and identifies areas for improvement.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Visual progress charts</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Weakness identification</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Personalized recommendations</span>
                </div>
              </div>
            </div>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-orange-400" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Biology</span>
                      <span className="text-green-400">85%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Chemistry</span>
                      <span className="text-yellow-400">62%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "62%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Physics</span>
                      <span className="text-red-400">45%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: "45%" }}></div>
                    </div>
                  </div>
                  <div className="bg-orange-600/20 p-3 rounded-lg border border-orange-500/30">
                    <p className="text-orange-300 text-sm">💡 Focus on Physics - Mechanics chapter needs attention!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Voice Section */}
      <section id="voice" className="h-screen flex items-center py-20 snap-start snap-always">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm order-2 lg:order-1">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Volume2 className="mr-2 h-5 w-5 text-purple-400" />
                  Audio Explanation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <p className="text-white mb-3">
                      "The mitochondria is called the powerhouse of the cell because..."
                    </p>
                    <div className="flex items-center space-x-4">
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <Volume2 className="w-4 h-4 mr-2" />
                        Play
                      </Button>
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: "40%" }}></div>
                      </div>
                      <span className="text-gray-400 text-sm">0:15 / 0:38</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">Powered by Whisper AI</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="order-1 lg:order-2">
              <Badge className="mb-4 bg-purple-600/20 text-purple-300 border-purple-500/30">
                <Volume2 className="w-4 h-4 mr-2" />
                Voice Feature
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Hear Your
                <span className="text-purple-400"> Answers</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Listen to explanations with our advanced voice feature powered by Whisper AI. Perfect for auditory
                learners or when you're on the go.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Natural voice synthesis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Adjustable playback speed</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Learn while multitasking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="h-screen flex items-center py-20 bg-gradient-to-r from-purple-600 to-pink-600 snap-start snap-always">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Ace Your Exams?</h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already using Exam Whisperer to improve their grades and study more
            effectively.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg bg-transparent"
            >
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">Exam Whisperer</span>
            </div>
            <div className="text-gray-400">© 2024 Exam Whisperer. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

