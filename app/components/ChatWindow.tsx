"use client";

import React, { useRef, forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { ChatMessages } from "./ChatMessages";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ChatWindowProps {
    isSidebarOpen: boolean;
}

export const ChatWindow = forwardRef(({ isSidebarOpen }: ChatWindowProps, ref) => {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const scrollableRef = useRef<HTMLDivElement>(null);

    const [message, setMessage] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! Ask me anything dear." },
    ]);
    const [loading, setLoading] = useState<boolean>(false);
    const [windowWidth, setWindowWidth] = useState<number | null>(null);

    // Offset state for keyboard push-up
    const [translateY, setTranslateY] = useState(0);

    useImperativeHandle(ref, () => ({
        focusInput: () => {
            inputRef.current?.focus();
        },
        inputRef,
    }));

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (typeof window !== "undefined") {
                setWindowWidth(window.innerWidth);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Listen for visualViewport changes (to handle keyboard on mobile)
    useEffect(() => {
        if (typeof window !== "undefined" && "visualViewport" in window) {
            const viewport = window.visualViewport;

            const handleVisualViewportChange = () => {
                if (!viewport) return;
                const offset = window.innerHeight - viewport.height;
                setTranslateY(offset > 0 ? -offset : 0);
            };

            viewport.addEventListener("resize", handleVisualViewportChange);
            viewport.addEventListener("scroll", handleVisualViewportChange);

            // Initial call
            handleVisualViewportChange();

            return () => {
                viewport.removeEventListener("resize", handleVisualViewportChange);
                viewport.removeEventListener("scroll", handleVisualViewportChange);
            };
        }
    }, []);

    // Always scroll to bottom when messages change
    useEffect(() => {
        if (scrollableRef.current) {
            scrollableRef.current.scrollTop = scrollableRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (msg: string) => {
        const trimmedMessage = msg.trim();
        if (trimmedMessage === "") return;
    
        const updatedMessages: Message[] = [
            ...messages,
            { role: "user", content: trimmedMessage }
        ];
        setMessages(updatedMessages);
        setMessage("");

        if (inputRef.current) {
            inputRef.current.style.height = "auto";
        }

        setLoading(true);
    
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: updatedMessages }),
            });
    
            const data = await response.json();
            if (data.assistantMessage) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: data.assistantMessage }
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: "I couldn't understand." }
                ]);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Error: Unable to get response." }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const onSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    };

    const onAssistantResponse = (assistantMsg: string) => {
        setMessages((prev) => [
            ...prev,
            { role: "assistant", content: assistantMsg },
        ]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        const textarea = e.target;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(message);
        }
    };

    const sidebarMarginClass =
        isSidebarOpen && windowWidth !== null && windowWidth >= 768 ? "ml-16" : "ml-0";

    // Base bottom padding for the messages container (enough for input)
    // Add extra padding equal to the keyboard offset to ensure messages are never hidden.
    const bottomPadding = (windowWidth !== null && windowWidth < 768) ? 175 : 0; // base padding (enough space for input)
    const additionalPadding = Math.max(0, -translateY); // additional for keyboard offset

    return (
        <div className="flex flex-col h-screen w-full">
            <div
                ref={scrollableRef}
                className={`flex-grow overflow-y-auto p-6 transition-all duration-300 ${sidebarMarginClass}`}
                style={{
                    // Add bottom padding so last message is visible above the input.
                    paddingBottom: `${bottomPadding + additionalPadding}px`,
                    // Disable scrolling if keyboard is open (translateY < 0)
                    overflowY: 'auto'
                }}
            >
                <div className="flex justify-center mb-6">
                    <img src="/baba.png" alt="Baba" className="w-32 h-32" />
                </div>

                <div className="text-center text-2xl font-semibold mb-4">
                    Ask me anything, dear.
                </div>

                <ChatMessages
                    messages={messages}
                    loading={loading}
                    setLoading={setLoading}
                    onSuggestionClick={onSuggestionClick}
                    onAssistantResponse={onAssistantResponse}
                />
            </div>

            {/* Chat input area */}
            <div
                className={`w-full max-w-2xl mx-auto px-4 md:px-0 ${windowWidth !== null && windowWidth < 768 ? "fixed left-0 bottom-0" : "relative md:static"}`}
                style={{
                    zIndex: 10,
                    backgroundColor: "white",
                    transform: `translateY(${translateY}px)`,
                    transition: "transform 0.2s ease-in-out",
                    overflow: "hidden",     // Prevent scrolling on this div
                    touchAction: "none"     // Prevent touch-based scrolling
                }}
            >
                <textarea
                    ref={inputRef}
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Chat with Baba Selo"
                    className="w-full p-3 rounded-t-3xl focus:outline-none resize-none text-black bg-gray-100 placeholder-gray-400 custom-scrollbar"
                    style={{
                        minHeight: "3rem",
                        maxHeight: "8.75rem",
                        overflowY: message.split("\n").length > 5 ? "auto" : "hidden",
                        paddingRight: "1rem",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        touchAction: "none"
                    }}
                />
                <div className="flex items-center justify-between bg-gray-100 p-2 rounded-b-3xl">
                    <button
                        className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 flex items-center justify-center"
                        style={{ background: "transparent" }}
                    >
                        <FontAwesomeIcon icon={faPaperclip} className="text-black" />
                    </button>
                    <button
                        onClick={() => sendMessage(message)}
                        disabled={message.trim() === ""}
                        className={`rounded-full w-10 h-10 flex items-center justify-center 
                            ${message.trim() === ""
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-black text-white hover:bg-gray-800"
                            }`}
                        title={message.trim() === "" ? "Message is empty" : ""}
                    >
                        <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2 mb-2">
                    Baba Selo is wise, but even I can mix things up. Double-check, dear—better safe than sorry!
                </p>
            </div>
            {/* End chat input area */}
        </div>
    );
});

ChatWindow.displayName = "ChatWindow";
