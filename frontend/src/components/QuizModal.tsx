import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { quizAsk, quizEvaluate } from "@/lib/api";

interface QuizModalProps {
    open: boolean;
    onClose: () => void;
    defaultTopic: string;
    onQuizComplete?: (result: { correct: number; total: number; topic: string }) => void;
}

export default function QuizModal({ open, onClose, defaultTopic, onQuizComplete }: QuizModalProps) {
    const [quizNumQuestions, setQuizNumQuestions] = useState(3);
    const [quizDifficulty, setQuizDifficulty] = useState("medium");
    const [quizQuestions, setQuizQuestions] = useState<any[]>([]); // stores all fetched questions
    const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
    const [quizUserAnswers, setQuizUserAnswers] = useState<number[]>([]);
    const [quizFeedback, setQuizFeedback] = useState("");
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);
    const [quizResult, setQuizResult] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [quizStarted, setQuizStarted] = useState(false);
    const [localTopic, setLocalTopic] = useState(defaultTopic);

    useEffect(() => {
        if (open) setLocalTopic(defaultTopic);
    }, [open, defaultTopic]);

    // Start quiz handler
    const startQuiz = async () => {
        setQuizQuestions([]);
        setQuizCurrentIndex(0);
        setQuizUserAnswers([]);
        setQuizFeedback("");
        setQuizFinished(false);
        setQuizResult({ correct: 0, total: 0 });
        setQuizLoading(true);
        setQuizStarted(true);
        try {
            const data = await quizAsk({ topic: localTopic, difficulty: quizDifficulty, num_questions: quizNumQuestions, question_index: 0 });
            setQuizQuestions([data.question]);
        } catch (err) {
            setQuizFeedback("Failed to load quiz question.");
        }
        setQuizLoading(false);
    };

    // Restart quiz handler
    const restartQuiz = () => {
        setQuizStarted(false);
        setQuizQuestions([]);
        setQuizCurrentIndex(0);
        setQuizUserAnswers([]);
        setQuizFeedback("");
        setQuizFinished(false);
        setQuizResult({ correct: 0, total: 0 });
        setSelectedOption(null);
    };

    // Fetch next question using /quiz/ask
    const fetchNextQuizQuestion = useCallback(async (index: number) => {
        setQuizLoading(true);
        try {
            const data = await quizAsk({ topic: localTopic, difficulty: quizDifficulty, num_questions: quizNumQuestions, question_index: index });
            setQuizQuestions((prev) => {
                const next = [...prev];
                next[index] = data.question;
                return next;
            });
        } catch (err) {
            setQuizFeedback("Failed to load next question.");
        }
        setQuizLoading(false);
    }, [localTopic, quizDifficulty, quizNumQuestions]);

    // Submit answer handler
    const submitQuizAnswer = async () => {
        if (selectedOption === null) return;
        const question = quizQuestions[quizCurrentIndex];
        if (!question) {
            setQuizFeedback("No question loaded. Please restart the quiz.");
            return;
        }
        setQuizLoading(true);
        try {
            const data = await quizEvaluate({
                user_id: "demo-user",
                topic: localTopic,
                question_index: quizCurrentIndex,
                user_answer: selectedOption,
                num_questions: quizNumQuestions,
                difficulty: quizDifficulty,
                question,
            });
            setQuizUserAnswers((prev) => [...prev, selectedOption]);
            setQuizFeedback(data.feedback || (data.correct ? "Correct!" : "Incorrect."));
            setQuizResult((prev) => ({
                correct: prev.correct + (data.correct ? 1 : 0),
                total: prev.total + 1,
            }));
            setQuizLoading(false);
            // Store answer details for display
            setLastEval({
                correct: data.correct,
                feedback: data.feedback,
                correct_answer: data.correct_answer,
                user_answer: data.user_answer,
            });
            setShowNextButton(true);
        } catch (err) {
            setQuizFeedback("Failed to evaluate answer.");
            setQuizLoading(false);
        }
    };

    // State for answer details and next button
    const [lastEval, setLastEval] = useState<any>(null);
    const [showNextButton, setShowNextButton] = useState(false);

    // Handler for next question
    const handleNextQuestion = () => {
        setShowNextButton(false);
        setLastEval(null);
        setQuizFeedback("");
        setSelectedOption(null);
        if (quizCurrentIndex + 1 < quizNumQuestions) {
            setQuizCurrentIndex((idx) => idx + 1);
            if (!quizQuestions[quizCurrentIndex + 1]) {
                fetchNextQuizQuestion(quizCurrentIndex + 1);
            }
        } else {
            setQuizFinished(true);
            if (onQuizComplete) {
                onQuizComplete({ correct: quizResult.correct, total: quizNumQuestions, topic: localTopic });
            }
        }
    };

    // Quiz UI
    const renderQuiz = () => {
        if (!quizStarted) {
            return (
                <Card className="mb-4 bg-[#313244] border-[#45475a]">
                    <CardHeader>
                        <CardTitle className="text-[#cdd6f4]">Start a Quiz</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-[#cdd6f4] font-semibold">Topic</label>
                                <input
                                    className="border border-[#45475a] bg-[#1e1e2e] text-[#cdd6f4] p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#cba6f7] w-full"
                                    type="text"
                                    value={localTopic}
                                    onChange={e => setLocalTopic(e.target.value)}
                                    placeholder="Enter topic"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-[#cdd6f4] font-semibold">Number of Questions</label>
                                <input
                                    className="border border-[#45475a] bg-[#1e1e2e] text-[#cdd6f4] p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#cba6f7] w-24"
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={quizNumQuestions}
                                    onChange={e => setQuizNumQuestions(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-[#cdd6f4] font-semibold">Difficulty</label>
                                <select
                                    className="border border-[#45475a] bg-[#1e1e2e] text-[#cdd6f4] p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#cba6f7] w-32"
                                    value={quizDifficulty}
                                    onChange={e => setQuizDifficulty(e.target.value)}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <Button onClick={startQuiz} disabled={quizLoading || !localTopic} className="bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e] mt-2">Start Quiz</Button>
                        </div>
                    </CardContent>
                </Card>
            );
        }
        if (quizLoading) return <div className="p-4 text-[#cdd6f4]">Loading...</div>;
        if (quizFinished) return (
            <Card className="mb-4 bg-[#313244] border-[#45475a]">
                <CardHeader><CardTitle className="text-[#cdd6f4]">Quiz Finished!</CardTitle></CardHeader>
                <CardContent>
                    <div className="mb-2 text-[#cdd6f4]">Score: {quizResult.correct} / {quizNumQuestions}</div>
                    <div className="mb-2 text-[#cdd6f4]">Topic: <span className="font-semibold">{localTopic}</span></div>
                    <Button onClick={onClose} className="mr-2 bg-[#cba6f7] hover:bg-[#b4befe] text-[#1e1e2e]">Close</Button>
                    <Button onClick={restartQuiz} variant="outline" className="ml-2 border-[#45475a] text-[#cdd6f4] hover:bg-[#383a59]">Restart Quiz</Button>
                </CardContent>
            </Card>
        );
        const q = quizQuestions[quizCurrentIndex];
        if (!q) {
            return <div className="p-4 text-[#cdd6f4]">Loading question...</div>;
        }
        return (
            <Card className="mb-4 max-h-[70vh] overflow-y-auto bg-[#313244] border border-[#45475a] text-[#cdd6f4] flex flex-col">
                <CardHeader><CardTitle className="text-[#cdd6f4]">Quiz Question {quizCurrentIndex + 1} / {quizNumQuestions}</CardTitle></CardHeader>
                <CardContent className="flex-1 flex flex-col pb-8">
                    <div className="mb-2 font-semibold text-[#cdd6f4]">{q.text}</div>
                    <div className="flex flex-col gap-2">
                        {q.options.map((opt: string, idx: number) => (
                            <Button key={idx} variant={selectedOption === idx ? "default" : "outline"} className={`text-left ${selectedOption === idx ? 'bg-[#cba6f7] text-[#1e1e2e]' : 'bg-[#1e1e2e] text-[#cdd6f4] border border-[#45475a] hover:bg-[#383a59]'}`} onClick={() => setSelectedOption(idx)} disabled={quizFeedback !== "" || showNextButton}>
                                <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                            </Button>
                        ))}
                    </div>
                    <Button className="mt-4 bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#b4befe]" onClick={submitQuizAnswer} disabled={selectedOption === null || quizFeedback !== "" || showNextButton || quizLoading}>Submit</Button>
                    {/* Feedback and answer details */}
                    {lastEval && (
                        <Card className="mt-4 bg-[#1e1e2e] text-[#cdd6f4] border border-[#45475a] max-h-48 overflow-y-auto">
                            <CardContent className="p-4">
                                <div className={`font-bold text-lg mb-2 ${lastEval.correct ? 'text-[#a6e3a1]' : 'text-[#f38ba8]'}`}>{lastEval.correct ? "Correct!" : "Incorrect."}</div>
                                <div className="mb-2"><span className="font-semibold">Your answer:</span> {lastEval.user_answer ? `${String.fromCharCode(65 + lastEval.user_answer.index)}. ${lastEval.user_answer.text}` : "-"}</div>
                                <div className="mb-2"><span className="font-semibold">Correct answer:</span> {lastEval.correct_answer ? `${String.fromCharCode(65 + lastEval.correct_answer.index)}. ${lastEval.correct_answer.text}` : "-"}</div>
                                <div className="mb-2"><span className="font-semibold">Explanation:</span> <span className="block whitespace-pre-line break-words">{lastEval.feedback}</span></div>
                            </CardContent>
                        </Card>
                    )}
                    {quizFeedback && !lastEval && <div className="mt-4 text-lg font-bold text-[#f38ba8]">{quizFeedback}</div>}
                </CardContent>
                {/* Sticky footer for navigation buttons */}
                {(showNextButton || quizFeedback || lastEval) && (
                    <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-3xl bg-[#313244] border-t border-[#45475a] flex flex-row gap-4 p-4 z-50 justify-end rounded-b-xl">
                        {showNextButton && (
                            <Button
                                className="bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#b4befe] transition-colors duration-200"
                                onClick={handleNextQuestion}
                                aria-label="Next or finish quiz"
                            >
                                {quizCurrentIndex + 1 < quizNumQuestions ? "Next Question" : "Finish Quiz"}
                            </Button>
                        )}
                        <Button
                            className="bg-transparent border border-[#45475a] text-[#a6adc8] hover:bg-[#383a59] transition-colors duration-200"
                            variant="outline"
                            onClick={restartQuiz}
                            disabled={quizLoading}
                            aria-label="Restart the quiz"
                        >
                            Restart Quiz
                        </Button>
                    </div>
                )}
            </Card>
        );
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-[#1e1e2e]/80 z-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-[#313244] rounded-xl shadow-2xl w-full max-w-3xl p-12 relative max-h-[90vh] overflow-y-auto border border-[#45475a]">
                <button className="absolute top-3 right-3 text-[#a6adc8] hover:text-[#cdd6f4]" onClick={onClose}>
                    <X className="w-6 h-6" />
                </button>
                {renderQuiz()}
            </div>
        </div>
    );
}
