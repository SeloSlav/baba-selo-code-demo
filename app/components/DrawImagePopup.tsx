"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";

interface DrawImagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, userId: string | null, drawingId: string) => void;
}

export const DrawImagePopup: React.FC<DrawImagePopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const { user } = useAuth();

  const handleSubmit = () => {
    if (!prompt.trim()) {
      setError("Please enter a description for what you'd like Baba to draw.");
      return;
    }
    if (!user) {
      setError("Please sign in to use the drawing feature.");
      return;
    }

    // Check if the prompt is asking about Baba Selo herself
    const babaSelfPromptPatterns = [
      /baba\s*selo/i,
      /yourself/i,
      /your\s*portrait/i,
      /draw\s*you/i,
      /draw\s*baba/i,
      /draw\s*yourself/i,
      /what\s*do\s*you\s*look\s*like/i
    ];

    const isBabaSelfPortrait = babaSelfPromptPatterns.some(pattern => pattern.test(prompt.trim()));

    // If it's a self-portrait request, use the consistent Baba Selo description
    const finalPrompt = isBabaSelfPortrait
      ? "A warm and lovable Croatian grandmother in her 70s wearing a traditional brown dress with a white apron and beige woven babushka headscarf, holding a wooden shepherd's crook. She has a kind, weathered face with laugh lines and wise eyes, standing in a rustic kitchen setting. Photorealistic style."
      : prompt.trim();

    // Generate a unique ID for the drawing
    const drawingId = `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    onSubmit(finalPrompt, user.uid, drawingId);
    setPrompt("");
    setError("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <FontAwesomeIcon icon={faMagicWandSparkles} className="text-xl text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Let Baba Draw</h2>
              <p className="text-sm text-gray-600">Describe what you'd like Baba to create</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Prompt Input */}
        <div className="mb-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="E.g., Draw a cozy Balkan kitchen with a pot of sarma simmering on the stove, warm sunlight streaming through lace curtains..."
            className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              Be descriptive! The more details you provide, the better Baba can bring your vision to life.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faMagicWandSparkles} />
            Let's Draw
          </button>
        </div>
      </div>
    </div>
  );
}; 