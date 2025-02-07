"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PointsToast } from '../components/PointsToast';

interface ToastItem {
  id: string;
  points: number;
  message: string;
}

interface PointsContextType {
  showPointsToast: (points: number, message: string) => void;
}

const PointsContext = createContext<PointsContextType | null>(null);

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};

export const PointsProvider = ({ children }: { children: React.ReactNode }) => {
  // Queue to store all toast notifications
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);
  const [showClearAll, setShowClearAll] = useState(false);

  const removeToast = useCallback((id: string) => {
    setToastQueue(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToastQueue([]);
    setShowClearAll(false);
  }, []);

  const showPointsToast = useCallback((points: number, message: string) => {
    const newToast: ToastItem = {
      id: Math.random().toString(36).substr(2, 9), // Generate unique ID
      points,
      message
    };
    setToastQueue(prev => [...prev, newToast]);
  }, []);

  // Effect to handle showing/hiding the "Clear All" toast
  useEffect(() => {
    if (toastQueue.length > 5 && !showClearAll) {
      const clearAllToast: ToastItem = {
        id: 'clear-all-toast',
        points: 0,
        message: 'Clear all notifications'
      };
      setShowClearAll(true);
      setToastQueue(prev => [...prev, clearAllToast]);
    } else if (toastQueue.length <= 5 && showClearAll) {
      setShowClearAll(false);
      setToastQueue(prev => prev.filter(toast => toast.id !== 'clear-all-toast'));
    }
  }, [toastQueue.length, showClearAll]);

  return (
    <PointsContext.Provider value={{ showPointsToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toastQueue.map((toast) => (
          <PointsToast
            key={toast.id}
            points={toast.points}
            message={toast.message}
            isVisible={true}
            onHide={() => toast.id === 'clear-all-toast' ? clearAllToasts() : removeToast(toast.id)}
            isClearAll={toast.id === 'clear-all-toast'}
          />
        ))}
      </div>
    </PointsContext.Provider>
  );
}; 