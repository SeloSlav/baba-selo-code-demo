import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faXmark, faComment } from "@fortawesome/free-solid-svg-icons";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface RecipeChatBubbleProps {
    recipeContent: string;
}

export const RecipeChatBubble: React.FC<RecipeChatBubbleProps> = ({ recipeContent }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    
    // Log recipe content when component mounts
    useEffect(() => {
        console.log("RecipeChatBubble received recipe content:", recipeContent);
    }, [recipeContent]);

    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello dear! I have the recipe details right in front of me. What would you like to know about making this dish?" }
    ]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const latestMessageRef = useRef<HTMLDivElement>(null);

    const suggestions = [
        "Can I substitute any ingredients in this recipe?",
        "What's the most important step to get right?",
        "How many people does this recipe serve?",
        "What should I watch out for when making this?",
        "How do I know when it's perfectly cooked?"
    ];

    const scrollToLatestMessage = () => {
        if (latestMessageRef.current) {
            latestMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    useEffect(() => {
        scrollToLatestMessage();
    }, [messages]);

    const handleSuggestionClick = (suggestion: string) => {
        const newMessage: Message = { role: "user", content: suggestion };
        const updatedMessages: Message[] = [...messages, newMessage];
        setMessages(updatedMessages);
        setLoading(true);

        fetch("/api/recipeChat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: updatedMessages,
                recipeContent
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.assistantMessage) {
                    const assistantMessage: Message = { role: "assistant", content: data.assistantMessage };
                    setMessages(prev => [...prev, assistantMessage]);
                }
            })
            .catch(error => {
                console.error("Error in recipe chat:", error);
                const errorMessage: Message = { 
                    role: "assistant", 
                    content: "Oh dear, something went wrong. Could you try asking that again?" 
                };
                setMessages(prev => [...prev, errorMessage]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleSend = async () => {
        if (message.trim() === "") return;

        const newMessage: Message = { role: "user", content: message };
        const updatedMessages: Message[] = [...messages, newMessage];
        setMessages(updatedMessages);
        setMessage("");
        setLoading(true);

        try {
            const response = await fetch("/api/recipeChat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages,
                    recipeContent
                }),
            });

            const data = await response.json();
            if (data.assistantMessage) {
                const assistantMessage: Message = { role: "assistant", content: data.assistantMessage };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error("Error in recipe chat:", error);
            const errorMessage: Message = { 
                role: "assistant", 
                content: "Oh dear, something went wrong. Could you try asking that again?" 
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-black text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-gray-800 transition-all z-50"
            >
                <FontAwesomeIcon icon={faComment} className="text-xl" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[calc(100vh-6rem)]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b shrink-0">
                <div className="flex items-center">
                    <img src="/apple-touch-icon.png" alt="Baba" className="w-7 h-7 mr-2" />
                    <h3 className="font-semibold">Chat with Baba Selo</h3>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 min-h-[15rem] max-h-[24rem] space-y-3">
                {/* Show suggestions at the top */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {suggestions.map((suggestion, i) => {
                        let emoji = "";
                        if (suggestion.includes("substitute")) emoji = "🔄";
                        else if (suggestion.includes("important step")) emoji = "⭐";
                        else if (suggestion.includes("serve")) emoji = "👥";
                        else if (suggestion.includes("watch out")) emoji = "⚠️";
                        else if (suggestion.includes("cooked")) emoji = "✅";

                        return (
                            <button
                                key={i}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="p-2 bg-blue-50 rounded-md hover:bg-blue-100 text-sm text-black"
                            >
                                {emoji} {suggestion}
                            </button>
                        );
                    })}
                </div>

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        ref={index === messages.length - 1 ? latestMessageRef : null}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-3xl px-5 py-2.5 ${
                                msg.role === "user"
                                    ? "bg-[#0284FE] text-white"
                                    : "bg-[#F3F3F3] text-[#0d0d0d]"
                            }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex items-start space-x-2">
                        <div className="typing-indicator flex space-x-2 mt-4">
                            <div className="dot bg-gray-400 rounded-full w-2 h-2"></div>
                            <div className="dot bg-gray-400 rounded-full w-2 h-2"></div>
                            <div className="dot bg-gray-400 rounded-full w-2 h-2"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="border-t p-3 shrink-0">
                <div className="flex items-end space-x-2">
                    <textarea
                        ref={inputRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about the recipe..."
                        className="w-full p-3 rounded-t-3xl focus:outline-none resize-none text-black bg-gray-100 placeholder-gray-400 custom-scrollbar"
                        style={{
                            minHeight: "2.5rem",
                            maxHeight: "6rem",
                            overflowY: message.split("\n").length > 3 ? "auto" : "hidden",
                            paddingRight: "1rem",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={message.trim() === "" || loading}
                        className={`rounded-full w-10 h-10 flex items-center justify-center
                            ${message.trim() === "" || loading
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-black text-white hover:bg-gray-800"
                            }`}
                    >
                        <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                </div>
            </div>
        </div>
    );
}; 