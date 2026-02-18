import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faMicrophone, faCircleInfo, faPen, faStop } from "@fortawesome/free-solid-svg-icons";

interface VoiceRecordPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

export const VoiceRecordPopup: React.FC<VoiceRecordPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
    setIsRecording(false);
  }, []);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      setTranscribedText('');
      setError(null);
    }
  }, [isOpen, cleanup]);

  const startRecording = async () => {
    try {
      setError(null); // Clear any previous errors
      setTranscribedText(''); // Clear any previous transcription
      
      // Clean up any existing recording
      cleanup();

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log('Audio data chunk received:', e.data.size, 'bytes');
        } else {
          console.warn('Received empty audio data chunk');
        }
      };

      // Set up the onstop handler before starting
      mediaRecorder.onstop = async () => {
        try {
          setError(null);
          console.log('Recording stopped, processing audio...');
          
          if (!chunksRef.current.length) {
            throw new Error('No audio data recorded');
          }

          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          
          if (audioBlob.size === 0) {
            throw new Error('No audio data captured');
          }

          console.log('Audio blob size:', audioBlob.size, 'bytes');
          setIsTranscribing(true);

          const formData = new FormData();
          formData.append('file', audioBlob, 'recording.webm');
          formData.append('model', 'whisper-1');

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to transcribe audio');
          }

          if (!data.text) {
            throw new Error('No transcription received');
          }

          setTranscribedText(data.text);
        } catch (error: any) {
          console.error('Error transcribing audio:', error);
          
          if (error.message.includes('No audio data')) {
            setError('No speech detected. Please try recording again while speaking.');
          } else if (error.message.includes('Failed to fetch') || !navigator.onLine) {
            setError('Network error. Please check your internet connection and try again.');
          } else if (error.message.includes('No transcription')) {
            setError('No speech detected. Please try recording again while speaking clearly.');
          } else {
            setError('Something went wrong with the transcription. Please try recording again.');
          }
        } finally {
          setIsTranscribing(false);
          cleanup();
        }
      };

      // Start recording in smaller chunks for more frequent data
      mediaRecorder.start(100);
      setIsRecording(true);
      console.log('Recording started');
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      if (error.name === 'NotAllowedError') {
        setError('Please allow microphone access to use voice recording.');
      } else if (error.name === 'NotFoundError') {
        setError('No microphone found. Please ensure your microphone is properly connected.');
      } else {
        setError('Error accessing microphone. Please check your device settings.');
      }
      cleanup();
    }
  };

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmit = () => {
    if (transcribedText.trim()) {
      onSubmit(transcribedText);
      setTranscribedText('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-amber-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <FontAwesomeIcon icon={faMicrophone} className="text-xl text-amber-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Voice Message</h2>
              <div className="flex items-center gap-1">
                <p className="text-sm text-gray-600">Record your message for Baba</p>
                <div className="group relative">
                  <FontAwesomeIcon 
                    icon={faCircleInfo} 
                    className="text-gray-400 hover:text-gray-600 text-sm cursor-help"
                  />
                  <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 md:w-64 p-3 bg-amber-900 text-amber-50 text-xs md:text-sm rounded-lg shadow-lg z-50">
                    <div className="relative">
                      <p>Click the microphone button to start recording. Click the stop button to finish recording.</p>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full w-2 h-2 bg-amber-900 rotate-45"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-amber-600/70 hover:text-amber-800 hover:bg-amber-50 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Recording Button */}
        <div className="flex flex-col items-center justify-center mb-6">
          <button
            onClick={toggleRecording}
            disabled={isTranscribing}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 ${
              isRecording 
                ? 'bg-red-500 scale-110' 
                : isTranscribing
                  ? 'bg-amber-200 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            <FontAwesomeIcon 
              icon={isRecording ? faStop : faMicrophone} 
              className={`text-3xl text-white ${isRecording ? 'animate-pulse' : ''}`} 
            />
          </button>
          <p className="mt-4 text-sm text-gray-600">
            {isTranscribing 
              ? 'Transcribing...' 
              : isRecording 
                ? 'Recording in progress... Click to stop' 
                : 'Click to start recording'}
          </p>
        </div>

        {/* Transcribed Text - Only show if we have text and no error */}
        {transcribedText && !error && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <FontAwesomeIcon icon={faPen} className="text-gray-400" />
              <label className="text-sm font-medium text-gray-700">
                Edit your message
              </label>
            </div>
            <textarea
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              disabled={isTranscribing}
              className="w-full px-3 py-2 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 min-h-[100px] disabled:bg-amber-50/50"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-amber-800 hover:bg-amber-50 rounded-xl border border-amber-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!transcribedText.trim() || isTranscribing}
            className={`px-6 py-2 rounded-xl transition-colors flex items-center gap-2
              ${!transcribedText.trim() || isTranscribing
                ? "bg-amber-100 text-amber-400 cursor-not-allowed" 
                : "bg-amber-600 text-white hover:bg-amber-700"}`}
          >
            <FontAwesomeIcon icon={faMicrophone} />
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}; 