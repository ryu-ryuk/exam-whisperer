"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Brain, TrendingUp, Volume2, Sparkles, ArrowRight, CheckCircle, ChevronDown, Github } from "lucide-react"
import { useEffect, useState } from "react"

export default function LandingPage() {
	return (
		<div className="h-screen overflow-y-scroll bg-[#1e1e2e] text-[#cdd6f4] scroll-smooth snap-y snap-mandatory" style={{ scrollSnapType: 'y mandatory' }}>
			{/* Navigation */}
			<nav className="sticky top-0 w-full z-50 bg-[#1e1e2e]/80 backdrop-blur-sm border-b border-[#313244]">
				<div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
					<div className="flex items-center space-x-3">
						<div className="w-8 h-8 bg-[#cba6f7] rounded-lg flex items-center justify-center">
							<Brain className="h-5 w-5 text-[#1e1e2e]" />
						</div>
						<span className="text-xl font-semibold text-[#f9e2af]">Whisper</span>
					</div>
					<div className="hidden md:flex items-center space-x-8">
						<a href="#features" className="text-[#bac2de] hover:text-[#f9e2af] transition-colors text-sm font-medium">
							Features
						</a>
						<a href="#how-it-works" className="text-[#bac2de] hover:text-[#f9e2af] transition-colors text-sm font-medium">
							How it works
						</a>
						<a href="/chat" className="bg-[#cba6f7] text-[#1e1e2e] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#b4befe] transition-colors">
							Get started
						</a>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="h-screen flex items-center justify-center relative overflow-hidden snap-start snap-always">
				{/* Animated background elements */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#cba6f7]/5 rounded-full blur-xl animate-pulse"></div>
					<div className="absolute top-3/4 right-1/4 w-24 h-24 bg-[#89b4fa]/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
					<div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-[#a6e3a1]/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
				</div>

				<div className="max-w-7xl mx-auto px-6 text-center space-y-8 relative z-10">
					<div className="inline-flex items-center space-x-2 bg-[#313244] px-4 py-2 rounded-full hover:bg-[#313244]/80 hover:scale-105 transition-all duration-300 group cursor-pointer">
						<Sparkles className="h-4 w-4 text-[#cba6f7] group-hover:animate-spin group-hover:text-[#b4befe] transition-all duration-300" />
						<span className="text-sm text-[#a6adc8] group-hover:text-[#cdd6f4] transition-colors duration-300">AI-powered studying</span>
					</div>

					<h1 className="text-5xl md:text-7xl font-bold text-[#cdd6f4] leading-tight group">
						<span className="inline-block hover:scale-105 hover:text-[#f9e2af] transition-all duration-300 cursor-default">Study smarter with</span>
						<br />
						<span className="text-[#cba6f7] inline-block hover:scale-110 hover:text-[#b4befe] transition-all duration-500 cursor-default hover:drop-shadow-lg">Whisper</span>
					</h1>

					<p className="text-xl text-[#a6adc8] max-w-2xl mx-auto leading-relaxed hover:text-[#cdd6f4] transition-colors duration-300 cursor-default">
						Your intelligent study companion that adapts to your learning style.
						Ask questions, practice with quizzes, and track your progress effortlessly.
					</p>

					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<a href="/chat" className="group">
							<Button className="bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#b4befe] px-8 py-3 text-lg font-medium hover:scale-110 hover:shadow-2xl hover:shadow-[#cba6f7]/30 transition-all duration-300 group-hover:rotate-1">
								Try Now
								<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300" />
							</Button>
						</a>
						<Button variant="outline" className="bg-blue-300 border-[#45475a] text-[#1e1e2e] hover:bg-[#979be5] px-8 py-3 text-lg hover:scale-105 hover:shadow-lg hover:shadow-[#89b4fa]/20 transition-all duration-300 hover:-rotate-1">
							Watch Demo
						</Button>
					</div>

					{/* Floating elements */}
					<div className="absolute top-16 left-8 opacity-20 animate-bounce" style={{ animationDelay: '0.5s' }}>
						<Brain className="h-8 w-8 text-[#cba6f7]" />
					</div>
					<div className="absolute bottom-20 right-12 opacity-20 animate-bounce" style={{ animationDelay: '1.5s' }}>
						<MessageCircle className="h-6 w-6 text-[#89b4fa]" />
					</div>
					<div className="absolute top-32 right-16 opacity-20 animate-bounce" style={{ animationDelay: '2.5s' }}>
						<TrendingUp className="h-7 w-7 text-[#a6e3a1]" />
					</div>
				</div>
			</section>

			{/* Ask Anything Section */}
			<section id="ask-anything" className="h-screen flex items-center py-20 bg-[#181825] snap-start snap-always">
				<div className="container mx-auto px-4">
					<div className="grid lg:grid-cols-2 gap-12 items-center">
						<div>
							<Badge className="mb-4 bg-[#89b4fa]/20 text-[#89b4fa] border-[#89b4fa]/30">
								<MessageCircle className="w-4 h-4 mr-2" />
								Ask Anything
							</Badge>
							<h2 className="text-4xl md:text-5xl font-bold text-[#cdd6f4] mb-6">
								Get Clear Explanations
								<span className="text-[#89b4fa]"> Instantly</span>
							</h2>
							<p className="text-xl text-[#a6adc8] mb-8">
								Confused about a concept? Just ask! Whisper breaks down complex topics into clean, concise explanations
								tailored to your learning level.
							</p>
							<div className="space-y-4">

								<div className="flex items-center space-x-3">
									<CheckCircle className="h-6 w-6 text-[#a6e3a1]" />
									<span className="text-[#a6adc8]">Instant responses</span>
								</div>
								<div className="flex items-center space-x-3">
									<CheckCircle className="h-6 w-6 text-[#a6e3a1]" />
									<span className="text-[#a6adc8]">Any subject, any topic</span>
								</div>
								<div className="flex items-center space-x-3">
									<CheckCircle className="h-6 w-6 text-[#a6e3a1]" />
									<span className="text-[#a6adc8]">Student-level explanations, tailored to you ;) </span>
								</div>
							</div>
						</div>
						<Card className="bg-[#313244]/50 border-[#45475a] backdrop-blur-sm hover:bg-[#313244]/70 hover:border-[#89b4fa]/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#89b4fa]/10 group">
							<CardHeader>
								<CardTitle className="text-[#cdd6f4] flex items-center group-hover:text-[#89b4fa] transition-colors duration-300">
									<MessageCircle className="mr-2 h-5 w-5 text-[#89b4fa] group-hover:scale-110 transition-transform duration-300" />
									Ask Your Question
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="bg-[#45475a]/50 p-4 rounded-lg group-hover:bg-[#45475a]/70 transition-colors duration-300">
										<p className="text-[#a6adc8] text-sm">You asked:</p>
										<p className="text-[#cdd6f4]">&quot;Explain photosynthesis in simple terms&quot;</p>
									</div>
									<div className="bg-[#89b4fa]/20 p-4 rounded-lg border border-[#89b4fa]/30 group-hover:bg-[#89b4fa]/30 group-hover:border-[#89b4fa]/50 transition-all duration-300">
										<p className="text-[#a6adc8] text-sm mb-2">Whisper Response:</p>
										<p className="text-[#cdd6f4]">
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
						<Card className="bg-[#313244]/50 border-[#45475a] backdrop-blur-sm order-2 lg:order-1 hover:bg-[#313244]/70 hover:border-[#a6e3a1]/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#a6e3a1]/10 group">
							<CardHeader>
								<CardTitle className="text-[#cdd6f4] flex items-center group-hover:text-[#a6e3a1] transition-colors duration-300">
									<Brain className="mr-2 h-5 w-5 text-[#a6e3a1] group-hover:scale-110 transition-transform duration-300" />
									Practice Quiz
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="bg-[#45475a]/50 p-4 rounded-lg group-hover:bg-[#45475a]/70 transition-colors duration-300">
										<p className="text-[#cdd6f4] font-medium mb-3">What is the powerhouse of the cell?</p>
										<div className="space-y-2">
											<div className="flex items-center space-x-2 hover:bg-[#45475a]/30 p-2 rounded transition-colors duration-200">
												<div className="w-4 h-4 rounded-full border-2 border-[#6c7086]"></div>
												<span className="text-[#a6adc8]">Nucleus</span>
											</div>
											<div className="flex items-center space-x-2 hover:bg-[#a6e3a1]/10 p-2 rounded transition-colors duration-200">
												<div className="w-4 h-4 rounded-full bg-[#a6e3a1] border-2 border-[#a6e3a1] animate-pulse"></div>
												<span className="text-[#cdd6f4] font-medium">Mitochondria</span>
											</div>
											<div className="flex items-center space-x-2 hover:bg-[#45475a]/30 p-2 rounded transition-colors duration-200">
												<div className="w-4 h-4 rounded-full border-2 border-[#6c7086]"></div>
												<span className="text-[#a6adc8]">Ribosome</span>
											</div>
										</div>
									</div>
									<div className="bg-[#a6e3a1]/20 p-3 rounded-lg border border-[#a6e3a1]/30 group-hover:bg-[#a6e3a1]/30 group-hover:border-[#a6e3a1]/50 transition-all duration-300">
										<p className="text-[#a6e3a1] text-sm animate-pulse">✓ Correct! Great job!</p>
									</div>
								</div>
							</CardContent>
						</Card>
						<div className="order-1 lg:order-2">
							<Badge className="mb-4 bg-[#a6e3a1]/20 text-[#a6e3a1] border-[#a6e3a1]/30">
								<Brain className="w-4 h-4 mr-2" />
								Quiz Mode
							</Badge>
							<h2 className="text-4xl md:text-5xl font-bold text-[#cdd6f4] mb-6">
								Practice Makes
								<span className="text-[#a6e3a1]"> Perfect</span>
							</h2>
							<p className="text-xl text-[#a6adc8] mb-8">
								Test your knowledge with AI-generated quizzes. Choose from multiple-choice questions or short-answer
								formats, all tailored to your specific topics.
							</p>
							<div className="space-y-4">
								<div className="flex items-center space-x-3">
									<CheckCircle className="h-6 w-6 text-[#a6e3a1]" />
									<span className="text-[#a6adc8]">Topic-based questions</span>
								</div>
								<div className="flex items-center space-x-3">
									<CheckCircle className="h-6 w-6 text-[#a6e3a1]" />
									<span className="text-[#a6adc8]">Multiple question formats</span>
								</div>
								<div className="flex items-center space-x-3">
									<CheckCircle className="h-6 w-6 text-[#a6e3a1]" />
									<span className="text-[#a6adc8]">Instant feedback</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Learning Tracker Section */}
			<section id="learning-tracker" className="h-screen flex items-center py-20 bg-[#181825] snap-start snap-always">
				<div className="container mx-auto px-4">
					<div className="grid lg:grid-cols-2 gap-12 items-center">
						<div>
							<Badge className="mb-4 bg-[#fab387]/20 text-[#fab387] border-[#fab387]/30">
								<TrendingUp className="w-4 h-4 mr-2" />
								Learning Tracker
							</Badge>
							<h2 className="text-4xl md:text-5xl font-bold text-[#cdd6f4] mb-6">
								Track Your
								<span className="text-[#fab387]"> Progress</span>
							</h2>
							<p className="text-xl text-[#a6adc8] mb-8">
								See exactly where you&apos;re excelling and where you need more practice. Our intelligent tracking shows your
								strengths and identifies areas for improvement.
							</p>
							<div className="space-y-4">
								<div className="flex items-center space-x-3">
									<CheckCircle className="h-6 w-6 text-[#a6e3a1]" />
									<span className="text-[#a6adc8]">Visual progress charts</span>
								</div>
								<div className="flex items-center space-x-3">
									<CheckCircle className="h-6 w-6 text-[#a6e3a1]" />
									<span className="text-[#a6adc8]">Weakness identification</span>
								</div>
								<div className="flex items-center space-x-3">
									<CheckCircle className="h-6 w-6 text-[#a6e3a1]" />
									<span className="text-[#a6adc8]">Personalized recommendations</span>
								</div>
							</div>
						</div>
						<Card className="bg-[#313244]/50 border-[#45475a] backdrop-blur-sm hover:bg-[#313244]/70 hover:border-[#fab387]/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#fab387]/10 group">
							<CardHeader>
								<CardTitle className="text-[#cdd6f4] flex items-center group-hover:text-[#fab387] transition-colors duration-300">
									<TrendingUp className="mr-2 h-5 w-5 text-[#fab387] group-hover:scale-110 transition-transform duration-300" />
									Your Progress
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									<div className="hover:scale-105 transition-transform duration-300">
										<div className="flex justify-between text-sm mb-2">
											<span className="text-[#a6adc8]">Biology</span>
											<span className="text-[#a6e3a1] font-medium">85%</span>
										</div>
										<div className="w-full bg-[#45475a] rounded-full h-2 overflow-hidden">
											<div className="bg-[#a6e3a1] h-2 rounded-full transition-all duration-1000 ease-out hover:bg-[#a6e3a1]/80" style={{ width: "85%" }}></div>
										</div>
									</div>
									<div className="hover:scale-105 transition-transform duration-300">
										<div className="flex justify-between text-sm mb-2">
											<span className="text-[#a6adc8]">Chemistry</span>
											<span className="text-[#f9e2af] font-medium">62%</span>
										</div>
										<div className="w-full bg-[#45475a] rounded-full h-2 overflow-hidden">
											<div className="bg-[#f9e2af] h-2 rounded-full transition-all duration-1000 ease-out hover:bg-[#f9e2af]/80" style={{ width: "62%" }}></div>
										</div>
									</div>
									<div className="hover:scale-105 transition-transform duration-300">
										<div className="flex justify-between text-sm mb-2">
											<span className="text-[#a6adc8]">Physics</span>
											<span className="text-[#f38ba8] font-medium">45%</span>
										</div>
										<div className="w-full bg-[#45475a] rounded-full h-2 overflow-hidden">
											<div className="bg-[#f38ba8] h-2 rounded-full transition-all duration-1000 ease-out hover:bg-[#f38ba8]/80" style={{ width: "45%" }}></div>
										</div>
									</div>
									<div className="bg-[#fab387]/20 p-3 rounded-lg border border-[#fab387]/30 group-hover:bg-[#fab387]/30 group-hover:border-[#fab387]/50 transition-all duration-300 hover:scale-105">
										<p className="text-[#fab387] text-sm">💡 Focus on Physics - Mechanics chapter needs attention!</p>
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
						<Card className="bg-[#313244]/50 border-[#45475a] backdrop-blur-sm order-2 lg:order-1 hover:bg-[#313244]/70 hover:border-[#cba6f7]/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#cba6f7]/10 group">
							<CardHeader>
								<CardTitle className="text-[#cdd6f4] flex items-center group-hover:text-[#cba6f7] transition-colors duration-300">
									<Volume2 className="mr-2 h-5 w-5 text-[#cba6f7] group-hover:scale-110 transition-transform duration-300" />
									Audio Explanation
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="bg-[#45475a]/50 p-4 rounded-lg group-hover:bg-[#45475a]/70 transition-colors duration-300">
										<p className="text-[#cdd6f4] mb-3">
											&quot;The mitochondria is called the powerhouse of the cell because...&quot;
										</p>
										<div className="flex items-center space-x-4">
											<Button size="sm" className="bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e] hover:scale-105 transition-transform duration-200">
												<Volume2 className="w-4 h-4 mr-2" />
												Play
											</Button>
											<div className="flex-1 bg-[#45475a] rounded-full h-2 overflow-hidden">
												<div className="bg-[#cba6f7] h-2 rounded-full transition-all duration-1000 ease-out hover:bg-[#cba6f7]/80" style={{ width: "40%" }}></div>
											</div>
											<span className="text-[#6c7086] text-sm group-hover:text-[#a6adc8] transition-colors duration-300">0:15 / 0:38</span>
										</div>
									</div>
									<div className="flex items-center space-x-2 text-[#a6adc8] group-hover:text-[#cba6f7] transition-colors duration-300">
										<Volume2 className="w-4 h-4 text-[#cba6f7] group-hover:animate-pulse" />
										<span className="text-sm">Powered by you and your choice of LLM</span>
									</div>
								</div>
							</CardContent>
						</Card>
						<div className="order-1 lg:order-2">
							<Badge className="mb-4 bg-[#cba6f7]/20 text-[#cba6f7] border-[#cba6f7]/30">
								<Volume2 className="w-4 h-4 mr-2" />
								Voice Feature
							</Badge>
							<h2 className="text-4xl md:text-5xl font-bold text-[#cdd6f4] mb-6">
								Hear Your
								<span className="text-[#cba6f7]"> Answers</span>
							</h2>
							<p className="text-xl text-[#a6adc8] mb-8">
								Listen to explanations with our advanced voice feature. Choose your preferred LLM and enjoy
								personalized audio responses. Perfect for auditory learners or when you&apos;re on the go.
							</p>
							<div className="space-y-4">
								<div className="flex items-center space-x-3">
									<CheckCircle className="h-6 w-6 text-[#a6e3a1]" />
									<span className="text-[#a6adc8]">Multiple LLM options</span>
								</div>
								<div className="flex items-center space-x-3">
									<CheckCircle className="h-6 w-6 text-[#a6e3a1]" />
									<span className="text-[#a6adc8]">Natural voice synthesis</span>
								</div>
								<div className="flex items-center space-x-3">
									<CheckCircle className="h-6 w-6 text-[#a6e3a1]" />
									<span className="text-[#a6adc8]">Learn while multitasking</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section id="how-it-works" className="h-screen flex items-center bg-[#181825] py-20 snap-start snap-always">
				<div className="max-w-7xl mx-auto px-6">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-[#cdd6f4] mb-4">
							How it works
						</h2>
						<p className="text-lg text-[#a6adc8] max-w-2xl mx-auto">
							Simple steps to transform your study experience
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-12">
						<div className="text-center hover:scale-105 transition-transform duration-300 group">
							<div className="w-16 h-16 bg-[#cba6f7] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#b4befe] group-hover:shadow-lg group-hover:shadow-[#cba6f7]/20 transition-all duration-300">
								<span className="text-2xl font-bold text-[#1e1e2e]">1</span>
							</div>
							<h3 className="text-xl font-semibold text-[#cdd6f4] mb-3 group-hover:text-[#cba6f7] transition-colors duration-300">Ask your question</h3>
							<p className="text-[#a6adc8] leading-relaxed group-hover:text-[#cdd6f4] transition-colors duration-300">
								Simply type in any concept or topic you need help understanding
							</p>
						</div>

						<div className="text-center hover:scale-105 transition-transform duration-300 group">
							<div className="w-16 h-16 bg-[#89b4fa] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#74c7ec] group-hover:shadow-lg group-hover:shadow-[#89b4fa]/20 transition-all duration-300">
								<span className="text-2xl font-bold text-[#1e1e2e]">2</span>
							</div>
							<h3 className="text-xl font-semibold text-[#cdd6f4] mb-3 group-hover:text-[#89b4fa] transition-colors duration-300">Get clear explanations</h3>
							<p className="text-[#a6adc8] leading-relaxed group-hover:text-[#cdd6f4] transition-colors duration-300">
								Receive instant, personalized explanations tailored to your learning level
							</p>
						</div>

						<div className="text-center hover:scale-105 transition-transform duration-300 group">
							<div className="w-16 h-16 bg-[#a6e3a1] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#94e2d5] group-hover:shadow-lg group-hover:shadow-[#a6e3a1]/20 transition-all duration-300">
								<span className="text-2xl font-bold text-[#1e1e2e]">3</span>
							</div>
							<h3 className="text-xl font-semibold text-[#cdd6f4] mb-3 group-hover:text-[#a6e3a1] transition-colors duration-300">Practice and improve</h3>
							<p className="text-[#a6adc8] leading-relaxed group-hover:text-[#cdd6f4] transition-colors duration-300">
								Test your knowledge with quizzes and track your progress over time
							</p>
						</div>
					</div>
					<div className="text-center">
						<div className="flex flex-col items-center mt-24 space-y-1">
							<div className="animate-bounce" style={{ animationDelay: '0s' }}>
								<ChevronDown className="h-5 w-5 text-[#89b4fa]" />
							</div>
							<div className="animate-bounce" style={{ animationDelay: '0.15s' }}>
								<ChevronDown className="h-5 w-5 text-[#cba6f7]" />
							</div>
							<div className="animate-bounce" style={{ animationDelay: '0.3s' }}>
								<ChevronDown className="h-5 w-5 text-[#f38ba8]" />
							</div>
						</div>
					</div>

				</div>
			</section>

			{/* CTA Section */}
			<section className="h-screen flex items-center justify-center snap-start snap-always">
				<div className="max-w-7xl mx-auto px-6">
					<div className="text-center bg-[#313244] rounded-2xl p-12 hover:bg-[#313244]/80 hover:shadow-2xl hover:shadow-[#cba6f7]/10 transition-all duration-500 group">
						<h2 className="text-3xl md:text-4xl font-bold text-[#cdd6f4] mb-4 group-hover:text-[#f9e2af] transition-colors duration-300">
							Ready to transform your studying?
						</h2>
						<p className="text-lg text-[#a6adc8] mb-8 max-w-2xl mx-auto group-hover:text-[#cdd6f4] transition-colors duration-300">
							Join students who are already using Whisper to study more effectively and achieve better results.
						</p>
						<a href="/chat">
							<Button className="bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#b4befe] px-8 py-3 text-lg font-medium hover:scale-110 hover:shadow-lg hover:shadow-[#cba6f7]/30 transition-all duration-300 group">
								Get started for free
								<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
							</Button>
						</a>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-[#313244] bg-[#181825] snap-start snap-always">
				<div className="max-w-7xl mx-auto px-6 py-8">
					<div className="flex flex-col md:flex-row justify-between items-center">
						<div className="flex items-center space-x-3 mb-4 md:mb-0">
							<div className="w-6 h-6 bg-[#cba6f7] rounded-lg flex items-center justify-center">
								<Brain className="h-4 w-4 text-[#1e1e2e]" />
							</div>
							<span className="text-sm font-medium text-[#f9e2af]">Whisper</span>
						</div>

						<div className="text-center mb-4 md:mb-0">
							<a
								href="https://github.com/ryu-ryuk/exam-whisperer"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center space-x-2 text-[#a6adc8] hover:text-[#89b4fa] transition-colors text-sm"
							>
								<Github className="h-4 w-4" />
								<span>GitHub Repository</span>
							</a>
						</div>

						<p className="text-[#6c7086] text-sm">
							© 2025 Exam Whisper.
						</p>
					</div>
				</div>
			</footer>
		</div>
	)
}

