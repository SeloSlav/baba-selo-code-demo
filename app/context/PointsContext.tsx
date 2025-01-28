"use client";

import React, { createContext, useContext, useState } from 'react';
import { PointsToast } from '../components/PointsToast';

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
  const [toastVisible, setToastVisible] = useState(false);
  const [toastData, setToastData] = useState<{ points: number; message: string }>({
    points: 0,
    message: ''
  });

  const showPointsToast = (points: number, message: string) => {
    setToastData({ points, message });
    setToastVisible(true);
  };

  return (
    <PointsContext.Provider value={{ showPointsToast }}>
      {children}
      <PointsToast
        points={toastData.points}
        message={toastData.message}
        isVisible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </PointsContext.Provider>
  );
}; 