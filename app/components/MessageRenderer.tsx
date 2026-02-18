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
import { MealPlanMessage, isMealPlan } from './MealPlanMessage';
import { getAuth } from 'firebase/auth';

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

const isRecipe = (text: string | any): boolean => {
    if (typeof text !== 'string') return false;
    return text.toLowerCase().includes("ingredients") && text.toLowerCase().includes("directions");
};

const isAboutSeloOliveOil = (text: string | any): boolean => {
    if (typeof text !== 'string') return false;
    return text.toLowerCase().includes("selo olive oil");
};

const isSelo = (text: string | any): boolean => {
    if (typeof text !== 'string') return false;
    return text.toLowerCase().includes("selo olive oil");
};

// Update Timer component to accept seconds instead of minutes
// Uses timestamp-based countdown so it stays accurate when tab is backgrounded (browsers throttle setInterval).
// Uses Web Notifications so the user is alerted even when the tab is in the background.
const Timer: React.FC<{ initialSeconds: number }> = ({ initialSeconds }) => {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const [hasFinished, setHasFinished] = useState(false);
    const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const endTimeRef = useRef<number>(0);
    const hasFiredRef = useRef(false);

    // Request notification permission when timer starts
    const requestNotificationPermission = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') return false;
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    };

    const fireTimerAlarm = useRef(() => {
        if (hasFiredRef.current) return;
        hasFiredRef.current = true;
        setIsRunning(false);
        setHasFinished(true);
        setIsAlarmPlaying(true);

        // Web Notification - works when tab is backgrounded
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification('Timer complete!', {
                    body: "Time's up, dear! 🕒",
                    icon: '/favicon.svg',
                });
            } catch {
                // ignore
            }
        }

        // Play beep sound (may be muted when tab is backgrounded; notification is primary)
        const playBeep = () => {
            try {
                const audio = new Audio('/timer-beep.mp3');
                audioRef.current = audio;
                audio.loop = true;
                audio.play().catch(() => {
                    // Fallback: Web Audio API beep if file missing or autoplay blocked
                    try {
                        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.frequency.value = 880;
                        gain.gain.value = 0.3;
                        osc.start();
                        osc.stop(ctx.currentTime + 0.3);
                    } catch {
                        // ignore
                    }
                });
            } catch {
                try {
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = 880;
                    gain.gain.value = 0.3;
                    osc.start();
                    osc.stop(ctx.currentTime + 0.3);
                } catch {
                    // ignore
                }
            }
        };
        playBeep();
    });

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isRunning) {
            if (timeLeft > 0 && endTimeRef.current === 0) {
                endTimeRef.current = Date.now() + timeLeft * 1000;
            }
            interval = setInterval(() => {
                const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
                setTimeLeft(remaining);
                if (remaining === 0) {
                    fireTimerAlarm.current();
                }
            }, 250); // Check more frequently to catch when we're past the target (handles throttling)
        }

        return () => clearInterval(interval);
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
            hasFiredRef.current = false;
            endTimeRef.current = 0;
            stopAlarm();
        }
        if (!isRunning && endTimeRef.current === 0) {
            requestNotificationPermission();
        }
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setTimeLeft(initialSeconds);
        setIsRunning(false);
        setHasFinished(false);
        hasFiredRef.current = false;
        endTimeRef.current = 0;
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

    return (
        <div className="bg-white rounded-2xl shadow-md p-4 max-w-xs mx-auto border border-gray-200 mb-2">
            <div className="text-center mb-4">
                <div className={`text-3xl font-bold font-mono ${hasFinished ? 'text-red-500' : 'text-gray-800'}`}>
                    {formatTime(timeLeft)}
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
const isTimerRequest = (text: string | any): { isTimer: boolean; seconds: number } => {
    // Safety check: if text is not a string, return false
    if (typeof text !== 'string') {
        return { isTimer: false, seconds: 0 };
    }
    
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
        <div className="bg-[#fef3c7] text-[#171717] px-5 py-2.5 rounded-3xl">
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
        <div className="bg-amber-600 text-white px-5 py-2.5 rounded-3xl max-w-[80%] whitespace-pre-line">
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
            className="bg-[#fef3c7] text-[#171717] px-5 py-2.5 rounded-3xl"
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
        <div className="bg-[#fef3c7] text-[#171717] px-5 py-2.5 rounded-3xl">
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
                    <div className="bg-[#fef3c7] text-[#171717] px-5 py-2.5 rounded-3xl">
                        {linkifyLastSelo(message.content)}
                    </div>
                </AssistantMessageWrapper>
            );
        }

        if (isMealPlan(message.content)) {
            return (
                <AssistantMessageWrapper messageRef={messageRef}>
                    <MealPlanMessage content={message.content} />
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
                    <div className="bg-[#fef3c7] text-[#171717] px-5 py-2.5 rounded-3xl">
                        {renderDishPairingLinks(formattedPairings[index] || message.content, onSuggestionClick)}
                    </div>
                </AssistantMessageWrapper>
            );
        }

        return (
            <AssistantMessageWrapper messageRef={messageRef}>
                <div className="bg-[#fef3c7] text-[#171717] px-5 py-2.5 rounded-3xl">
                    {renderMarkdown(message.content)}
                </div>
            </AssistantMessageWrapper>
        );
    }

    return null;
}; 