import React, { useEffect, useState } from 'react';
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
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      // Show warning messages (0 points) longer than success messages
      const duration = points > 0 ? 2000 : 4000; // 2 seconds for success, 4 seconds for warnings

      // Start exit animation before completely removing
      const hideTimer = setTimeout(() => {
        setIsShowing(false);
      }, duration - 500); // Start hiding 500ms before removal

      // Remove from queue after animation
      const removeTimer = setTimeout(() => {
        onHide();
      }, duration);

      return () => {
        clearTimeout(hideTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [isVisible, points, onHide]);

  return (
    <div
      className={`transform transition-all duration-500 ease-in-out ${
        isShowing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
        points > 0 ? 'bg-black text-white' : 'bg-gray-800 text-white'
      }`}>
        <div className={`p-2 rounded-lg ${points > 0 ? 'bg-yellow-500' : 'bg-gray-600'}`}>
          <FontAwesomeIcon icon={faSpoon} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-lg">
            {points > 0 ? `+${points} Spoons!` : 'No Spoons Awarded'}
          </div>
          <div className="text-sm text-gray-300">{message}</div>
        </div>
      </div>
    </div>
  );
}; 