import React, { useState, useEffect, useRef } from 'react';
import { RecipeClassification } from './types';
import { RecipeMessage } from './RecipeMessage';
import {
    renderMarkdown,
    renderNutritionInfo,
    renderDiscountButton,
    linkifyLastSelo,
    renderDishPairingLinks
} from './messageUtils';

interface Message {
    role: "user" | "assistant";
    content: string | any;
    imageUrl?: string;
}

interface MessageRendererProps {
    message: Message;
    index: number;
    messageRef: React.RefObject<HTMLDivElement> | null;
    recipeClassification?: RecipeClassification | null;
    formattedPairings: Record<number, string>;
    onSuggestionClick: (suggestion: string) => void;
    onAssistantResponse: (assistantMsg: string) => void;
    setLoading: (loading: boolean) => void;
    handleSaveRecipe: (content: string, classification: RecipeClassification | null) => void;
}

// Helper functions
const isCalorieInfo = (data: any) => {
    return (
        typeof data === "object" &&
        data.total &&
        data.per_serving &&
        typeof data.total.calories === "number" &&
        typeof data.per_serving.calories === "number"
    );
};

const isRecipe = (text: string) => {
    return text.toLowerCase().includes("ingredients") && text.toLowerCase().includes("directions");
};

const isAboutSeloOliveOil = (text: string): boolean => {
    return text.toLowerCase().includes("selo olive oil");
};

const isSelo = (text: string): boolean => {
    return text.toLowerCase().includes("selo olive oil");
};

// Update Timer component to accept seconds instead of minutes
const Timer: React.FC<{ initialSeconds: number }> = ({ initialSeconds }) => {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const [hasFinished, setHasFinished] = useState(false);
    const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            setIsRunning(false);
            setHasFinished(true);
            setIsAlarmPlaying(true);
            // Play beep sound
            audioRef.current = new Audio('/timer-beep.mp3');
            audioRef.current.loop = true;
            audioRef.current.play();
        }

        return () => {
            clearInterval(interval);
        };
    }, [isRunning, timeLeft]);

    const stopAlarm = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsAlarmPlaying(false);
    };

    const toggleTimer = () => {
        if (timeLeft === 0) {
            setTimeLeft(initialSeconds);
            setHasFinished(false);
            stopAlarm();
        }
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setTimeLeft(initialSeconds);
        setIsRunning(false);
        setHasFinished(false);
        stopAlarm();
    };

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getTimerText = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const parts = [];
        if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
        
        return parts.join(' ');
    };

    return (
        <div className="bg-white rounded-2xl shadow-md p-4 max-w-xs mx-auto border border-gray-200">
            <div className="text-center mb-4">
                <div className={`text-3xl font-bold mb-2 font-mono ${hasFinished ? 'text-red-500' : 'text-gray-800'}`}>
                    {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-gray-500 mb-4">
                    {hasFinished ? 'Time\'s up!' : getTimerText(timeLeft)}
                </div>
            </div>
            <div className="flex justify-center gap-2">
                <button
                    onClick={toggleTimer}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                        isRunning
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-black text-white hover:bg-gray-800'
                    }`}
                >
                    {timeLeft === 0 ? 'Restart' : isRunning ? 'Pause' : 'Start'}
                </button>
                {(isRunning || timeLeft < initialSeconds) && (
                    <button
                        onClick={resetTimer}
                        className="px-4 py-2 rounded-xl font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        Reset
                    </button>
                )}
                {isAlarmPlaying && (
                    <button
                        onClick={stopAlarm}
                        className="px-4 py-2 rounded-xl font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                        Stop Alarm
                    </button>
                )}
            </div>
        </div>
    );
};

// Update the isTimerRequest function
const isTimerRequest = (text: string): { isTimer: boolean; seconds: number } => {
    // Check for special timer response format
    const timerMatch = text.match(/^TIMER_REQUEST_(\d+)$/);
    if (timerMatch) {
        return { isTimer: true, seconds: parseInt(timerMatch[1]) };
    }
    return { isTimer: false, seconds: 0 };
};

// Update TimerMessage component
const TimerMessage: React.FC<{ seconds: number; messageRef: React.RefObject<HTMLDivElement> | null }> = ({ seconds, messageRef }) => (
    <AssistantMessageWrapper messageRef={messageRef}>
        <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
            <p className="mb-4">
                Here's your {seconds >= 60 
                    ? `${Math.floor(seconds / 60)} minute` 
                    : `${seconds} second`
                } timer, dear! I'll let you know when it's done. 🕒
            </p>
            <Timer initialSeconds={seconds} />
        </div>
    </AssistantMessageWrapper>
);

// Subcomponents for different message types
const UserMessage: React.FC<{ content: string; imageUrl?: string }> = ({ content, imageUrl }) => (
    <div className="flex justify-end">
        <div className="bg-[#0284FE] text-white px-5 py-2.5 rounded-3xl max-w-[80%] whitespace-pre-line">
            <p>{content}</p>
            {imageUrl && (
                <div className="mt-2">
                    <img 
                        src={imageUrl} 
                        alt="Uploaded" 
                        className="rounded-lg max-h-48 w-auto object-contain"
                    />
                </div>
            )}
        </div>
    </div>
);

const AssistantMessageWrapper: React.FC<{ children: React.ReactNode; messageRef: React.RefObject<HTMLDivElement> | null }> = ({ children, messageRef }) => (
    <div ref={messageRef} className="flex items-start space-x-3">
        <div className="flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-200">
            <img 
                src="/apple-touch-icon.png" 
                alt="Baba" 
                className="w-12 h-12 object-cover scale-150"
                style={{ objectPosition: '50% 35%', transform: 'scale(1.5)' }}
            />
        </div>
        {children}
    </div>
);

const LinkedMessage: React.FC<{ content: string; messageRef: React.RefObject<HTMLDivElement> | null }> = ({ content, messageRef }) => (
    <AssistantMessageWrapper messageRef={messageRef}>
        <div
            className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl"
            dangerouslySetInnerHTML={{ __html: content }}
        />
    </AssistantMessageWrapper>
);

const CalorieMessage: React.FC<{ content: any; messageRef: React.RefObject<HTMLDivElement> | null }> = ({ content, messageRef }) => (
    <AssistantMessageWrapper messageRef={messageRef}>
        {renderNutritionInfo(content)}
    </AssistantMessageWrapper>
);

const SeloMessage: React.FC<{ content: string; messageRef: React.RefObject<HTMLDivElement> | null }> = ({ content, messageRef }) => (
    <AssistantMessageWrapper messageRef={messageRef}>
        <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
            {renderMarkdown(content)}
            {renderDiscountButton()}
        </div>
    </AssistantMessageWrapper>
);

export const MessageRenderer: React.FC<MessageRendererProps> = ({
    message,
    index,
    messageRef,
    recipeClassification,
    formattedPairings,
    onSuggestionClick,
    onAssistantResponse,
    setLoading,
    handleSaveRecipe
}) => {
    if (message.role === "user") {
        return <UserMessage content={message.content} imageUrl={message.imageUrl} />;
    }

    if (message.role === "assistant") {
        const timerCheck = isTimerRequest(message.content);
        if (timerCheck.isTimer && timerCheck.seconds > 0) {
            return <TimerMessage seconds={timerCheck.seconds} messageRef={messageRef} />;
        }

        if (/<a .*?<\/a>/i.test(message.content)) {
            return <LinkedMessage content={message.content} messageRef={messageRef} />;
        }

        if (isCalorieInfo(message.content)) {
            return <CalorieMessage content={message.content} messageRef={messageRef} />;
        }

        if (isAboutSeloOliveOil(message.content)) {
            return <SeloMessage content={message.content} messageRef={messageRef} />;
        }

        if (isSelo(message.content)) {
            return (
                <AssistantMessageWrapper messageRef={messageRef}>
                    <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
                        {linkifyLastSelo(message.content)}
                    </div>
                </AssistantMessageWrapper>
            );
        }

        if (isRecipe(message.content)) {
            return (
                <AssistantMessageWrapper messageRef={messageRef}>
                    <RecipeMessage 
                        content={message.content}
                        messageRef={messageRef}
                        classification={recipeClassification || null}
                        onSuggestionClick={onSuggestionClick}
                        onAssistantResponse={onAssistantResponse}
                        setLoading={setLoading}
                        handleSaveRecipe={handleSaveRecipe}
                    />
                </AssistantMessageWrapper>
            );
        }

        if (message.content.includes("pairing") || message.content.includes("complement")) {
            return (
                <AssistantMessageWrapper messageRef={messageRef}>
                    <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
                        {renderDishPairingLinks(formattedPairings[index] || message.content, onSuggestionClick)}
                    </div>
                </AssistantMessageWrapper>
            );
        }

        return (
            <AssistantMessageWrapper messageRef={messageRef}>
                <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
                    {renderMarkdown(message.content)}
                </div>
            </AssistantMessageWrapper>
        );
    }

    return null;
}; 