import React, { useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpoon } from "@fortawesome/free-solid-svg-icons";

interface PointsToastProps {
  points: number;
  message: string;
  isVisible: boolean;
  onHide: () => void;
}

export const PointsToast: React.FC<PointsToastProps> = ({
  points,
  message,
  isVisible,
  onHide
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onHide();
      }, 2000); // Show for 2 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  return (
    <div
      className={`fixed top-4 right-4 transform transition-transform duration-500 ease-in-out z-50 ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="bg-black text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <div className="bg-yellow-500 p-2 rounded-lg">
          <FontAwesomeIcon icon={faSpoon} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-lg">+{points} Spoons!</div>
          <div className="text-sm text-gray-300">{message}</div>
        </div>
      </div>
    </div>
  );
}; 