'use client';

import { useConversation } from '@11labs/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import dotenv from 'dotenv';
dotenv.config();

export function ConversationComponent() {
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [volume, setVolume] = useState(1); // Default volume at 100%
  const [transcript, setTranscript] = useState<{ role: string; message: string }[]>([]); // State to store transcript lines
  const transcriptRef = useRef<HTMLDivElement>(null);
  const { startSession, endSession, setVolume: setConversationVolume, status, isSpeaking } = useConversation({
    agentId: 'tRQ8VBuYOhpOecaDuGiX', // Replace with your actual Agent ID
    onConnect: () => console.log('Connected to conversation.'),
    onDisconnect: () => console.log('Disconnected from conversation.'),
    onMessage: (message) => {
      console.log('Message received:', message);
      // Update transcript when a new message is received
      if (message.type === 'user_transcript') {
        // Add user transcript to the state
        setTranscript((prevTranscript) => [
          ...prevTranscript,
          { role: 'user', message: message.user_transcription_event.user_transcript },
        ]);
      } else if (message.type === 'agent_response') {
        // Add agent response to the state
        setTranscript((prevTranscript) => [
          ...prevTranscript,
          { role: 'agent', message: message.agent_response_event.agent_response },
        ]);
      } else {
        console.warn('Unexpected message structure:', message);
      }
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      setErrorMessage('An error occurred while connecting.');
    },
  });

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  // Handle starting the conversation
  const startConversation = useCallback(async () => {
    try {
      // Request microphone access
      console.log('Requesting microphone access...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophoneEnabled(true);

      // Start the conversation
      console.log('Starting conversation session...');
      await startSession();

      // Clear transcript when starting a new conversation
      setTranscript([]);
    } catch (error) {
      console.error('Microphone access denied or failed to start conversation:', error);
      setErrorMessage('Microphone access is required. Please allow microphone access in your browser settings.');
    }
  }, [startSession]);

  // Handle stopping the conversation
  const stopConversation = useCallback(async () => {
    console.log('Ending conversation session...');
    await endSession();
    setMicrophoneEnabled(false);
  }, [endSession]);

  // Handle volume adjustment
  const adjustVolume = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const volumeLevel = parseFloat(event.target.value);
    setVolume(volumeLevel);
    await setConversationVolume({ volume: volumeLevel });
    console.log('Volume set to:', volumeLevel);
  }, [setConversationVolume]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-pink-100 via-rose-200 to-amber-100 p-4">
      <div className="max-w-xl w-full bg-white shadow-xl rounded-lg p-6 text-center">
        <h1 className="text-3xl font-extrabold text-rose-900 mb-4">
          Baba Selo - Your Warm Guide to Recipes, Wisdom, and More
        </h1>
        <p className="text-rose-800 mb-6">
          Discover Balkan recipes, timeless life advice, and a comforting chat with Baba Selo. She's here to share her secrets, stories, and love.
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
            disabled={status === 'connected'}
            className="px-4 py-2 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 disabled:bg-gray-300"
          >
            Enable Microphone
          </button>
          <button
            onClick={stopConversation}
            disabled={status !== 'connected'}
            className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:bg-gray-300"
          >
            End Conversation
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <label htmlFor="volume-slider" className="text-rose-900 font-semibold">Volume:</label>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={adjustVolume}
            className="w-48"
          />
        </div>

        {status === 'connected' && isSpeaking && (
          <div className="mb-4">
            <div className="w-8 h-8 rounded-full bg-rose-500 animate-pulse mx-auto"></div>
            <p className="text-rose-900 font-semibold mt-2">Baba is speaking...</p>
          </div>
        )}

        <div className="bg-amber-50 p-4 rounded-lg w-full shadow-inner mb-6">
          <h2 className="text-xl font-semibold text-rose-900 mb-2">Conversation Transcript</h2>
          <div ref={transcriptRef} className="text-left overflow-y-auto max-h-48">
            {transcript.length > 0 ? (
              transcript.map((line, index) => (
                <div key={index} className={`flex ${line.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div
                    className={`inline-block p-2 rounded-lg ${line.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                  >
                    {line.message}
                  </div>
                </div>
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