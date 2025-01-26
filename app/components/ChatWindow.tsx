"use client";

import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { ChatMessages } from "./ChatMessages";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { ImageUploadPopup } from "./ImageUploadPopup";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  isSidebarOpen: boolean;
}

export const ChatWindow = forwardRef(
  ({ isSidebarOpen }: ChatWindowProps, ref) => {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [message, setMessage] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([
      { role: "assistant", content: "Hello! Ask me anything dear." },
    ]);
    const [loading, setLoading] = useState<boolean>(false);
    const [windowWidth, setWindowWidth] = useState<number | null>(null);
    const [translateY, setTranslateY] = useState(0);

    // Firebase state
    const [preferredCookingOil, setPreferredCookingOil] = useState<string | null>(null);
    const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);

    // Modal state for our new ImageUploadPopup
    const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      focusInput: () => {
        inputRef.current?.focus();
      },
      inputRef, // Expose inputRef for setting the value
    }));

    useEffect(() => {
      const fetchUserPreferences = async () => {
        const auth = getAuth();
        const firestore = getFirestore();

        onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              const userDocRef = doc(firestore, "users", user.uid);
              // console.log("Current User ID:", user.uid); // Log the user ID
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                const data = userDoc.data();
                // console.log("Fetched user preferences:", data);
                setPreferredCookingOil(data?.preferredCookingOil || "olive oil");
                setDietaryPreferences(data?.dietaryPreferences || []);
              } else {
                console.warn("User preferences document does not exist.");
                setPreferredCookingOil("olive oil");
                setDietaryPreferences([]);
              }
            } catch (error) {
              console.error("Error fetching user preferences:", error);
              setPreferredCookingOil("olive oil");
              setDietaryPreferences([]);
            }
          } else {
            console.warn("No user logged in.");
            setPreferredCookingOil("olive oil");
            setDietaryPreferences([]);
          }
        });
      };

      fetchUserPreferences();
    }, []);

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

    useEffect(() => {
      if (
        typeof window !== "undefined" &&
        "visualViewport" in window &&
        windowWidth !== null &&
        windowWidth < 768
      ) {
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
    }, [windowWidth]);

    const sendMessage = async (msg: string) => {
      const trimmedMessage = msg.trim();
      if (trimmedMessage === "") return;

      // Add user's message to the conversation
      const updatedMessages: Message[] = [
        ...messages,
        { role: "user", content: trimmedMessage }, // Explicitly typed as Message
      ];
      setMessages(updatedMessages); // Update the state with the new message
      setMessage("");

      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      setLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            preferredCookingOil,
            dietaryPreferences,
          }), // Include preferences in the API call
        });

        const data = await response.json();
        if (data.assistantMessage) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.assistantMessage }, // Explicitly typed as Message
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Ah, my head! It\'s like I\'ve been up all night making sarma for a village wedding. Try refreshing the page, darling—I\'ll do better next time!." }, // Explicitly typed as Message
          ]);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error: Unable to get response." }, // Explicitly typed as Message
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
      isSidebarOpen && windowWidth !== null && windowWidth >= 768
        ? "ml-0"
        : "ml-0";

    // Base bottom padding for the messages container (enough for input)
    // Add extra padding equal to the keyboard offset to ensure messages are never hidden.
    const bottomPadding = windowWidth !== null && windowWidth < 768 ? 175 : 0; // base padding (enough space for input)
    const additionalPadding = Math.max(0, -translateY); // additional for keyboard offset

    // Submit callback for our image popup
    const handleImageSubmit = async (file: File | null) => {
      if (file) {
        setLoading(true);
        try {
          // Create a FormData object to send the file
          const formData = new FormData();
          formData.append('image', file);

          const response = await fetch('/api/analyzeImage', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (response.ok) {
            setMessages(prev => [
              ...prev,
              { role: 'user', content: 'I uploaded an image for analysis.' },
              { role: 'assistant', content: data.analysis }
            ]);
          } else {
            console.error('API Error:', data);
            const errorMessage = data.details 
              ? `Sorry dear, something went wrong: ${data.details}`
              : 'Sorry dear, I had trouble analyzing that image. Could you try uploading it again?';
            
            setMessages(prev => [
              ...prev,
              { role: 'user', content: 'I uploaded an image for analysis.' },
              { role: 'assistant', content: errorMessage }
            ]);
          }
        } catch (error) {
          console.error('Error analyzing image:', error);
          setMessages(prev => [
            ...prev,
            { role: 'user', content: 'I uploaded an image for analysis.' },
            { role: 'assistant', content: 'Oh dear, something went wrong while analyzing the image. Could you try again?' }
          ]);
        } finally {
          setLoading(false);
        }
      }
    };

    return (
      <div className="flex flex-col h-screen w-full">
        <div
          className={`flex-grow overflow-y-auto ml-4 p-6 transition-all duration-300 ${sidebarMarginClass} ${isImageUploadOpen ? 'pointer-events-none opacity-50' : ''}`}
          style={{
            paddingBottom: `${bottomPadding + additionalPadding}px`,
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
            onAssistantResponse={onAssistantResponse} // Pass the function here
          />
        </div>

        {/* Start chat input area */}
        <div
          className={`w-full max-w-2xl mx-auto px-4 md:px-0 ${
            windowWidth !== null && windowWidth < 768
              ? "fixed bottom-0 left-0 right-0"
              : "relative md:static"
          } ${isImageUploadOpen ? 'pointer-events-none opacity-50' : ''}`}
          style={{
            zIndex: 1000,
            backgroundColor:
              windowWidth !== null && windowWidth < 768
                ? "white"
                : "transparent",
            transform:
              windowWidth !== null && windowWidth < 768
                ? `translateY(${translateY}px)`
                : "none",
            transition: "transform 0.2s ease-in-out",
          }}
        >
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Chat with Baba Selo"
            className="w-full p-3 mt-1 rounded-t-3xl focus:outline-none resize-none text-black bg-gray-100 placeholder-gray-400 custom-scrollbar"
            style={{
              minHeight: "3rem",
              maxHeight: "8.75rem",
              overflowY: message.split("\n").length > 5 ? "auto" : "hidden",
              paddingRight: "1rem",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          />
          <div className="flex items-center justify-between bg-gray-100 p-2 rounded-b-3xl">
          <button
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 flex items-center justify-center"
              style={{ background: "transparent" }}
              onClick={() => setIsImageUploadOpen(true)} // <-- Open the popup
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
            Baba Selo is wise, but even I can mix things up. Double-check,
            dear—better safe than sorry!
          </p>
        </div>
        {/* End chat input area */}

        {/* Our Image Upload Popup */}
        <ImageUploadPopup
          isOpen={isImageUploadOpen}
          onClose={() => setIsImageUploadOpen(false)}
          onSubmit={handleImageSubmit}
        />
      </div>
    );
  },
);

ChatWindow.displayName = "ChatWindow";