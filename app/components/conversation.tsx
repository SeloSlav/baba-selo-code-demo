'use client';

import { useConversation } from '@11labs/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import dotenv from 'dotenv';
dotenv.config();

export function Conversation() {
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [volume, setVolume] = useState(1); // Default volume at 100%
  const [transcript, setTranscript] = useState<{ role: string; message: string }[]>([]); // State to store transcript lines
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const conversation = useConversation({
    onConnect: () => console.log('Connected to conversation.'),
    onDisconnect: () => console.log('Disconnected from conversation.'),
    onMessage: (message) => {
      console.log('Message received:', message);
      // Update transcript when a new message is received
      if (message && typeof message.message === 'string') {
        setTranscript((prevTranscript) => [...prevTranscript, { role: message.source || 'agent', message: message.message }]);
      } else if (message && typeof message === 'string') {
        // In case the `message` itself is the text
        setTranscript((prevTranscript) => [...prevTranscript, { role: 'user', message }]);
      } else {
        console.warn('Unexpected message structure:', message);
      }
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      setErrorMessage('An error occurred while connecting.');
    },
  });

  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  // Fetch conversation details to get conversation ID
  useEffect(() => {
    if (!conversationId && conversation.status === 'connected') {
      const fetchConversations = async () => {
        try {
          console.log('Fetching conversations...');
          const response = await fetch('/api/conversations', {
            method: 'GET',
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch conversations: ${response.statusText}`);
          }
          const data = await response.json();
          console.log('Conversations data:', data);
          if (data && data.conversations && data.conversations.length > 0) {
            const currentConversation = data.conversations.find(conv => conv.agent_id === 'tRQ8VBuYOhpOecaDuGiX' && conv.status === 'processing');
            if (currentConversation) {
              setConversationId(currentConversation.conversation_id);
              console.log('Current conversation ID set:', currentConversation.conversation_id);
            } else {
              const latestConversation = data.conversations[0];
              setConversationId(latestConversation.conversation_id);
              console.log('Latest conversation ID set:', latestConversation.conversation_id);
            }
          }
        } catch (error) {
          console.error('Error fetching conversations:', error);
        }
      };
      fetchConversations();
    }
  }, [conversation.status, conversationId]);

  // Fetch transcript updates based on conversation ID
  useEffect(() => {
    if (conversationId) {
      const fetchTranscript = async () => {
        try {
          console.log(`Fetching transcript for conversation ID: ${conversationId}`);
          const response = await fetch(`/api/conversations/${conversationId}`, {
            method: 'GET',
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch transcript: ${response.statusText}`);
          }
          const data = await response.json();
          console.log('Transcript data:', data);
          if (data && data.transcript) {
            setTranscript(data.transcript.map(item => ({ role: item.role, message: item.message })));
          }
        } catch (error) {
          console.error('Error fetching conversation transcript:', error);
        }
      };

      const interval = setInterval(fetchTranscript, 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [conversationId]);

  // Handle starting the conversation
  const startConversation = useCallback(async () => {
    try {
      // Request microphone access
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophoneEnabled(true);

      // Start the conversation
      console.log('Starting conversation session...');
      await conversation.startSession({
        agentId: 'tRQ8VBuYOhpOecaDuGiX', // Replace with your actual Agent ID
      });
    } catch (error) {
      console.error('Microphone access denied or failed to start conversation:', error);
      setErrorMessage('Microphone access is required. Please allow microphone access in your browser settings.');
    }
  }, [conversation]);

  // Handle stopping the conversation
  const stopConversation = useCallback(async () => {
    console.log('Ending conversation session...');
    await conversation.endSession();
    setMicrophoneEnabled(false);
    setConversationId(null);

    if (socket) {
      socket.close();
    }
  }, [conversation, socket]);

  // Handle volume adjustment
  const adjustVolume = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const volumeLevel = parseFloat(event.target.value);
    setVolume(volumeLevel);
    conversation.setVolume({ volume: volumeLevel });
    console.log('Volume set to:', volumeLevel);
  }, [conversation]);

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
