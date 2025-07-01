import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface QuizModalProps {
    open: boolean;
    onClose: () => void;
    defaultTopic: string;
    onQuizComplete?: (result: { correct: number; total: number; topic: string }) => void;
}

export default function QuizModal({ open, onClose, defaultTopic, onQuizComplete }: QuizModalProps) {
    const [question] = useState<string>("What is the capital of France?");
    const [answer, setAnswer] = useState<string>("");
    const [submitted, setSubmitted] = useState<boolean>(false);

    if (!open) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        const isCorrect = answer.trim().toLowerCase() === "paris";
        onQuizComplete?.({ correct: isCorrect ? 1 : 0, total: 1, topic: defaultTopic });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1e2e]/80">
            <Card className="bg-[#313244] border-[#45475a] w-full max-w-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold text-[#cdd6f4]">
                        Quiz: {defaultTopic || "General Knowledge"}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-6 w-6 p-0 text-[#cdd6f4] hover:bg-[#45475a]"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-[#cdd6f4] mb-2">{question}</label>
                            <input
                                className="border border-[#45475a] bg-[#1e1e2e] text-[#cdd6f4] p-2 rounded w-full"
                                value={answer}
                                onChange={e => setAnswer(e.target.value)}
                                disabled={submitted}
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                onClick={onClose}
                                className="bg-[#f38ba8] text-[#1e1e2e] hover:bg-[#f38ba8]/80"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#cba6f7] text-[#1e1e2e] hover:bg-[#cba6f7]/80"
                                disabled={submitted}
                            >
                                Submit
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
