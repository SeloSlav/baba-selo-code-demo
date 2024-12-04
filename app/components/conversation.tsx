'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useConversation } from '@11labs/react';

export function Conversation() {
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [volume, setVolume] = useState(1);
  const [transcript, setTranscript] = useState<{ role: string; message: string }[]>([]);
  const [conversations, setConversations] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [nextCursor, setNextCursor] = useState('');

  const apiKey = 'sk_7fcb44554be4d7e2bac8451043141dc7702e874614d869d1'; // Replace with your actual API key

  const conversation = useConversation({
    onConnect: () => console.log('Connected to conversation.'),
    onDisconnect: () => console.log('Disconnected from conversation.'),
    onMessage: (message) => {
      if (message && typeof message.message === 'string') {
        setTranscript((prevTranscript) => [
          ...prevTranscript,
          { role: message.source || 'agent', message: message.message },
        ]);
      } else if (message && typeof message === 'string') {
        setTranscript((prevTranscript) => [
          ...prevTranscript,
          { role: 'agent', message },
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

  const fetchConversations = async (cursor = '') => {
    setLoadingConversations(true);
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations?${new URLSearchParams({
          page_size: '30',
          cursor,
        })}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.statusText}`);
      }

      const data = await response.json();
      setConversations((prev) => [...prev, ...data.conversations]);
      setHasMoreConversations(data.has_more);
      setNextCursor(data.next_cursor || '');
    } catch (error) {
      setErrorMessage(error.message || 'An error occurred while fetching conversations.');
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const startConversation = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophoneEnabled(true);

      await conversation.startSession({
        agentId: 'tRQ8VBuYOhpOecaDuGiX', // Replace with your actual Agent ID
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setErrorMessage(
        'Microphone access is required. Please allow microphone access in your browser settings.'
      );
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setMicrophoneEnabled(false);
  }, [conversation]);

  const adjustVolume = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const volumeLevel = parseFloat(event.target.value);
      setVolume(volumeLevel);
      conversation.setVolume({ volume: volumeLevel });
    },
    [conversation]
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-pink-100 via-rose-200 to-amber-100 p-4">
      <div className="max-w-xl w-full bg-white shadow-xl rounded-lg p-6 text-center">
        <h1 className="text-3xl font-extrabold text-rose-900 mb-4">
          Baba Selo - Your Warm Guide to Recipes, Wisdom, and More
        </h1>
        <p className="text-rose-800 mb-6">
          Discover Balkan recipes, timeless life advice, and a comforting chat with Baba. She's here
          to share her secrets, stories, and love—just like home.
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
          <div className="text-left overflow-y-auto max-h-48">
            {transcript.length > 0 ? (
              transcript.map((line, index) => (
                <div
                  key={index}
                  className={`flex ${
                    line.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg max-w-sm ${
                      line.role === 'user'
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
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

        <div className="bg-gray-50 p-4 rounded-lg w-full shadow-inner">
          <h2 className="text-xl font-semibold text-rose-900 mb-2">Past Conversations</h2>
          {loadingConversations && <p className="text-gray-500 italic">Loading conversations...</p>}
          {errorMessage && (
            <div className="bg-red-100 text-red-800 px-4 py-3 rounded mb-4">{errorMessage}</div>
          )}
          <ul className="space-y-4">
            {conversations.map((conv, index) => (
              <li
                key={conv.conversation_id || index}
                className="p-4 bg-gray-200 rounded-lg border border-gray-300"
              >
                <p>
                  <strong>Agent Name:</strong> {conv.agent_name || 'Unknown'}
                </p>
                <p>
                  <strong>Start Time:</strong>{' '}
                  {new Date(conv.start_time_unix_secs * 1000).toLocaleString()}
                </p>
                <p>
                  <strong>Duration:</strong> {conv.call_duration_secs} seconds
                </p>
                <p>
                  <strong>Status:</strong> {conv.status}
                </p>
              </li>
            ))}
          </ul>
          {hasMoreConversations && (
            <button
              onClick={() => fetchConversations(nextCursor)}
              disabled={loadingConversations}
              className="mt-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600"
            >
              Load More
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
