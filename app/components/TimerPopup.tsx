"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faClock } from "@fortawesome/free-solid-svg-icons";

interface TimerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (seconds: number) => void;
}

export const TimerPopup: React.FC<TimerPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [error, setError] = useState("");

  // Request notification permission when popup opens so timer can alert when tab is backgrounded
  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    
    if (totalSeconds < 5) {
      setError("Timer must be at least 5 seconds");
      return;
    }
    
    if (totalSeconds > 7200) {
      setError("Timer cannot exceed 2 hours");
      return;
    }

    onSubmit(totalSeconds);
    setHours(0);
    setMinutes(0);
    setSeconds(0);
    setError("");
    onClose();
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setHours(Math.max(0, Math.min(value, 2))); // Max 2 hours
    setError("");
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setMinutes(Math.max(0, Math.min(value, 59))); // Max 59 minutes
    setError("");
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setSeconds(Math.max(0, Math.min(value, 59))); // Max 59 seconds
    setError("");
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
            <div className="p-2 bg-yellow-100 rounded-xl">
              <FontAwesomeIcon icon={faClock} className="text-xl text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Set a Timer</h2>
              <p className="text-sm text-gray-600">Let Baba keep track of time for you</p>
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

        {/* Timer Input */}
        <div className="mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
              <input
                type="number"
                value={hours}
                onChange={handleHoursChange}
                min="0"
                max="2"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
              <input
                type="number"
                value={minutes}
                onChange={handleMinutesChange}
                min="0"
                max="59"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Seconds</label>
              <input
                type="number"
                value={seconds}
                onChange={handleSecondsChange}
                min="0"
                max="59"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500">
              Set a timer between 5 seconds and 2 hours
            </p>
            <p className="text-xs text-gray-400">
              Examples: 1 hour 30 minutes, 45 seconds, 2 hours
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
            disabled={hours === 0 && minutes === 0 && seconds === 0}
            className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2
              ${hours === 0 && minutes === 0 && seconds === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
              }`}
          >
            <FontAwesomeIcon icon={faClock} />
            Start Timer
          </button>
        </div>
      </div>
    </div>
  );
}; 