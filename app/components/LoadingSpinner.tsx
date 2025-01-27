import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = "" }) => {
  return (
    <div className={`typing-indicator flex space-x-2 ${className}`}>
      <div className="dot bg-white rounded-full w-2 h-2"></div>
      <div className="dot bg-white rounded-full w-2 h-2"></div>
      <div className="dot bg-white rounded-full w-2 h-2"></div>
    </div>
  );
}; 