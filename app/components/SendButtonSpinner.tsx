import React from 'react';

interface SendButtonSpinnerProps {
  className?: string;
}

export const SendButtonSpinner: React.FC<SendButtonSpinnerProps> = ({ className = "" }) => {
  return (
    <div className={`relative w-5 h-5 ${className}`}>
      <div className="absolute w-full h-full border-2 border-white rounded-full animate-spin border-t-transparent" />
    </div>
  );
}; 