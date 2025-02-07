"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
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
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToastQueue(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showPointsToast = useCallback((points: number, message: string) => {
    const newToast: ToastItem = {
      id: Math.random().toString(36).substr(2, 9),
      points,
      message
    };

    setToastQueue(prev => {
      const newQueue = [...prev, newToast];
      // If we exceed 5 toasts, clear them all immediately
      if (newQueue.length > 5) {
        return [];
      }
      return newQueue;
    });
  }, []);

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
            onHide={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </PointsContext.Provider>
  );
}; 