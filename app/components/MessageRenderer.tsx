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
        <div className="bg-white rounded-2xl shadow-md p-4 max-w-xs mx-auto border border-gray-200 mb-2">
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

// Add tracking request detection function
const isTrackingRequest = (text: string | any): boolean => {
    if (typeof text !== 'string') return false;
    return text.includes("FETCH_TRACKING_INFO");
};

// Update TrackingMessage component
const TrackingMessage: React.FC<{ messageRef: React.RefObject<HTMLDivElement> | null }> = ({ messageRef }) => {
    const [fulfilledOrders, setFulfilledOrders] = useState<any[]>([]);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [useManualMode, setUseManualMode] = useState(false);
    const [manualTrackingNumber, setManualTrackingNumber] = useState('');
    const [manualTrackingResult, setManualTrackingResult] = useState<string | null>(null);
    const [apiMessage, setApiMessage] = useState<string | null>(null);
    const [showPastOrders, setShowPastOrders] = useState(false);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setManualTrackingResult(`Your order #${manualTrackingNumber} is in transit! Expected delivery in 3-5 business days.`);
    };

    useEffect(() => {
        const fetchTrackingInfo = async () => {
            try {
                // Get the current user's token
                const auth = getAuth();
                const user = auth.currentUser;
                
                if (!user) {
                    setError("Please sign in to check your order status");
                    setIsLoading(false);
                    return;
                }

                const token = await user.getIdToken();
                
                try {
                    const response = await fetch('/api/tracking', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
    
                    if (!response.ok) {
                        // Attempt to parse error message if JSON, otherwise use status text
                        let errorMsg = `Server error: ${response.status} ${response.statusText}`;
                        try {
                            const contentType = response.headers.get('content-type');
                            if (contentType && contentType.includes('application/json')) {
                                const errorData = await response.json();
                                errorMsg = errorData.message || errorData.error || errorMsg;
                            }
                        } catch (parseError) { /* Ignore parsing error, stick with status text */ }
                        throw new Error(errorMsg);
                    }
    
                    // Check content type before parsing as JSON
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        throw new Error('Unexpected server response format');
                    }
    
                    const data = await response.json();
                    setFulfilledOrders(data.fulfilledOrdersWithTracking || []);
                    setPendingOrders(data.pendingOrders || []);
                    setApiMessage(data.message || null);
                    
                    if ((!data.fulfilledOrdersWithTracking || data.fulfilledOrdersWithTracking.length === 0) && 
                        (!data.pendingOrders || data.pendingOrders.length === 0)) {
                        setError("No active orders found");
                    }
                } catch (fetchOrParseError) {
                    // This catch handles network errors, parsing errors, or explicit throws above
                    console.error("API Fetch/Parse Error:", fetchOrParseError);
                    setError("Couldn't retrieve order status. Please try again later or contact support.");
                    // Enable manual mode as a fallback for these genuine errors
                    setUseManualMode(true); 
                }
            } catch (authError) {
                // This outer catch handles errors getting the auth token
                console.error("Authentication Error:", authError);
                setError("Authentication failed. Please try signing out and back in.");
                // Optionally enable manual mode here too if desired
                setUseManualMode(true); 
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrackingInfo();
    }, []);

    // --- DEBUG LOGS ---
    console.log("--- TrackingMessage Render State ---");
    console.log("isLoading:", isLoading);
    console.log("error:", error);
    console.log("useManualMode:", useManualMode);
    console.log("fulfilledOrders:", fulfilledOrders);
    console.log("pendingOrders:", pendingOrders);
    console.log("pendingOrders.length:", pendingOrders ? pendingOrders.length : 'undefined');
    console.log("apiMessage:", apiMessage);
    // --- END DEBUG LOGS ---

    return (
        <AssistantMessageWrapper messageRef={messageRef}>
            <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl space-y-4">
                <div>
                    <h3 className="font-semibold text-lg mb-1">Selo Olive Oil Order Status</h3>
                </div>
                
                {isLoading ? (
                    <div className="flex items-center space-x-2 py-3">
                        <div className="w-5 h-5 border-2 border-t-teal-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        <p>Checking your order status...</p>
                    </div>
                ) : useManualMode ? (
                    <div>
                        {error && <p className="text-red-600 mb-3">{error}</p>}
                        {!manualTrackingResult ? (
                            <>
                                <p className="mb-3">Please enter your order number:</p>
                                <form onSubmit={handleManualSubmit} className="space-y-3">
                                    <input
                                        type="text"
                                        value={manualTrackingNumber}
                                        onChange={(e) => setManualTrackingNumber(e.target.value)}
                                        placeholder="e.g., SEL-12345"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                    <button 
                                        type="submit"
                                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                                    >
                                        Check Status
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div>
                                <p className="text-green-600 mb-3">{manualTrackingResult}</p>
                                <p className="text-sm text-gray-600">
                                    For more detailed tracking, please check your email for shipping confirmation 
                                    or contact us at help@seloolive.com
                                </p>
                            </div>
                        )}
                    </div>
                ) : error ? (
                    <div className="text-gray-700 py-2">
                        <p>{error}</p>
                        {error === "Please sign in to check your order status" && (
                            <a href="/login" className="text-blue-600 underline mt-2 inline-block">
                                Sign in to your account
                            </a>
                        )}
                    </div>
                ) : (
                    <>
                        {pendingOrders.length > 0 && (
                            <div className="border-t border-gray-200 pt-3">
                                <h4 className="font-medium text-gray-800 mb-2">Pending Orders:</h4>
                                <div className="space-y-3">
                                    {pendingOrders.map((order, index) => (
                                        <div key={`pending-${index}`} className="border border-gray-100 rounded-lg p-3 bg-gray-50 text-sm">
                                            <p className="font-medium text-gray-700 mb-1">{order.orderName}</p>
                                            {order.items && order.items.length > 0 && (
                                                <ul className="list-disc list-inside text-gray-600 pl-1 mb-2">
                                                    {order.items.map((item, itemIndex) => (
                                                        <li key={itemIndex}>{item.quantity} x {item.title}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            <p className="text-amber-700 font-medium">Waiting for shipment.</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {fulfilledOrders.length > 0 && !showPastOrders && (
                            <div className="border-t border-gray-200 pt-3">
                                <button 
                                    onClick={() => setShowPastOrders(true)}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    View Past Shipped Orders ({fulfilledOrders.length})
                                </button>
                            </div>
                        )}

                        {showPastOrders && fulfilledOrders.length > 0 && (
                            <div className="border-t border-gray-200 pt-3">
                                <h4 className="font-medium text-gray-800 mb-2">Past Shipped Orders:</h4>
                                <div className="space-y-3">
                                    {fulfilledOrders.map((link, index) => (
                                        <div key={`fulfilled-${index}`} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm text-sm">
                                            <p className="font-medium text-gray-800 mb-1">{link.orderName}</p>
                                            {link.items && link.items.length > 0 && (
                                                <ul className="list-disc list-inside text-gray-600 pl-1 mb-2">
                                                    {link.items.map((item, itemIndex) => (
                                                        <li key={itemIndex}>{item.quantity} x {item.title}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            <p className="text-gray-600 mb-2">Carrier: {link.carrier}</p>
                                            <a
                                                href={link.trackingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-teal-600 hover:text-teal-800 font-medium"
                                            >
                                                <span>Track Package ({link.trackingNumber})</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {fulfilledOrders.length === 0 && pendingOrders.length === 0 && !isLoading && !error && (
                            <div className="border-t border-gray-200 pt-3 text-center">
                                <p className="text-gray-600 mb-3">You have no recent orders.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AssistantMessageWrapper>
    );
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
        // Check for tracking request
        if (isTrackingRequest(message.content)) {
            return <TrackingMessage messageRef={messageRef} />;
        }

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