import React, { useEffect } from "react";

export interface CatppuccinToastProps {
    message: string;
    onClose?: () => void;
}

export const CatppuccinToast: React.FC<CatppuccinToastProps> = ({ message, onClose }) => {
    // Auto-dismiss after 4 seconds
    useEffect(() => {
        if (!onClose) return;
        const timer = setTimeout(() => onClose(), 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 flex items-center gap-4 px-6 py-4 rounded-2xl shadow-xl bg-[#313244]/95 border-2 border-[#a6e3a1] animate-fade-in-up animate-bounce-slow">
            {/* Animated Icon: Catppuccin Sparkle Star */}
            <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="animate-spin-slow" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#a6e3a1" opacity="0.15" />
                    <path d="M20 7 L22 18 L33 20 L22 22 L20 33 L18 22 L7 20 L18 18 Z" fill="#cba6f7" />
                    <circle cx="20" cy="20" r="5" fill="#f9e2af" />
                </svg>
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-[#a6e3a1] text-lg mb-1">Syllabus Uploaded!</span>
                <span className="text-[#cdd6f4] text-base whitespace-pre-line">{message}</span>
            </div>
            {onClose && (
                <button
                    className="ml-4 text-[#f38ba8] hover:text-[#eba0ac] text-2xl font-bold focus:outline-none"
                    onClick={onClose}
                    aria-label="Close notification"
                >
                    ×
                </button>
            )}
            <style jsx>{`
        .animate-bounce-slow {
          animation: bounceY 2.5s cubic-bezier(.68,-0.55,.27,1.55) infinite;
        }
        @keyframes bounceY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-spin-slow {
          animation: spin 3.5s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};
