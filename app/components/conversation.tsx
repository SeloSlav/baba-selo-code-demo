'use client';

import { useConversation } from '@11labs/react';
import React, { useCallback, useState, useEffect } from 'react';

export function Conversation() {
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [volume, setVolume] = useState(1); // Default volume at 100%
  const [transcript, setTranscript] = useState<string[]>([]); // State to store transcript lines

  const conversation = useConversation({
    onConnect: () => console.log('Connected to conversation.'),
    onDisconnect: () => console.log('Disconnected from conversation.'),
    onMessage: (message) => {
      console.log('Message:', message);
      // Update transcript when new message is received
      if (message && message.type === 'text') {
        setTranscript((prevTranscript) => [...prevTranscript, message.text]);
      }
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      setErrorMessage('An error occurred while connecting.');
    },
  });

  // Handle starting the conversation
  const startConversation = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophoneEnabled(true);

      // Start the conversation
      await conversation.startSession({
        agentId: 'tRQ8VBuYOhpOecaDuGiX', // Replace with your actual Agent ID
      });
    } catch (error) {
      console.error('Microphone access denied or failed to start conversation:', error);
      setErrorMessage(
        'Microphone access is required. Please allow microphone access in your browser settings.'
      );
    }
  }, [conversation]);

  // Handle stopping the conversation
  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setMicrophoneEnabled(false);
  }, [conversation]);

  // Handle volume adjustment
  const adjustVolume = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const volumeLevel = parseFloat(event.target.value);
    setVolume(volumeLevel);
    conversation.setVolume({ volume: volumeLevel });
  }, [conversation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-pink-100 via-rose-200 to-amber-100 p-4">
      <div className="max-w-xl w-full bg-white shadow-xl rounded-lg p-6 text-center">
        <h1 className="text-3xl font-extrabold text-rose-900 mb-4">
          Baba Selo - Your Warm Guide to Recipes, Wisdom, and More
        </h1>
        <p className="text-rose-800 mb-6">
          Discover Balkan recipes, timeless life advice, and a comforting chat with Baba. She's here to share her secrets, stories, and love—just like home.
        </p>

        {/* Baba GIF */}
        <div className="mb-6">
          <img src="/baba.png" alt="Baba" className="w-64 h-64 mx-auto" />
        </div>

        {!microphoneEnabled && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded mb-4">
            Please enable your microphone to start a conversation with Baba.
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-100 text-red-800 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-4 justify-center mb-4">
          <button
            onClick={startConversation}
            disabled={conversation.status === 'connected'}
            className="px-4 py-2 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 disabled:bg-gray-300"
          >
            Enable Microphone
          </button>
          <button
            onClick={stopConversation}
            disabled={conversation.status !== 'connected'}
            className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:bg-gray-300"
          >
            End Conversation
          </button>
        </div>

        {conversation.status === 'connected' && (
          <div className="flex flex-col items-center mb-4">
            <p className="text-green-700 font-medium">
              Status: Connected
            </p>
            <p className="text-gray-600">
              Baba is currently {conversation.isSpeaking ? 'speaking' : 'listening'}.
            </p>
          </div>
        )}

        <div className="flex flex-col items-center mb-4">
          <label htmlFor="volume" className="text-gray-700 mb-2">
            Adjust Baba's Volume
          </label>
          <input
            id="volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={adjustVolume}
            className="w-full accent-rose-500"
          />
        </div>

        {/* Transcript Section */}
        <div className="bg-amber-50 p-4 rounded-lg w-full shadow-inner">
          <h2 className="text-xl font-semibold text-rose-900 mb-2">Conversation Transcript</h2>
          <div className="text-left overflow-y-auto max-h-48">
            {transcript.length > 0 ? (
              transcript.map((line, index) => (
                <p key={index} className="text-rose-800 mb-2">
                  {line}
                </p>
              ))
            ) : (
              <p className="text-gray-500 italic">No messages yet. Start talking to Baba!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
