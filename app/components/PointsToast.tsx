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
      // Show purchase and warning messages longer than success messages
      const duration = points <= 0 ? 4000 : 2000; // 4 seconds for purchases/warnings, 2 seconds for earning points

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

  // Helper function to determine toast style
  const getToastStyle = () => {
    if (points < 0) {
      // Purchase notification
      return {
        container: 'bg-purple-600 text-white',
        icon: 'bg-purple-500',
        textColor: 'text-white'
      };
    } else if (points > 0) {
      // Points earned
      return {
        container: 'bg-black text-white',
        icon: 'bg-yellow-500',
        textColor: 'text-white'
      };
    } else {
      // Warning or info message
      return {
        container: 'bg-gray-800 text-white',
        icon: 'bg-gray-600',
        textColor: 'text-white'
      };
    }
  };

  const style = getToastStyle();

  return (
    <div
      className={`transform transition-all duration-500 ease-in-out ${
        isShowing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 ${style.container}`}>
        <div className={`p-2 rounded-lg ${style.icon}`}>
          <FontAwesomeIcon icon={faSpoon} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-lg">
            {points > 0 ? `+${points} Spoons!` : 
             points < 0 ? 'Purchase Complete!' : 
             'Notice'}
          </div>
          <div className={`text-sm ${style.textColor} opacity-90`}>{message}</div>
        </div>
      </div>
    </div>
  );
}; 