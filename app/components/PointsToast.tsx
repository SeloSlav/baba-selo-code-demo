import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpoon, faXmark } from "@fortawesome/free-solid-svg-icons";

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
      
      // Show all toasts for 4 seconds
      const duration = 4000;

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
  }, [isVisible, onHide]);

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

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShowing(false);
    setTimeout(onHide, 500); // Wait for exit animation before removing
  };

  return (
    <div
      className={`transform transition-all duration-500 ease-in-out ${
        isShowing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 relative ${style.container}`}>
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
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded-full transition-colors"
          aria-label="Close notification"
        >
          <FontAwesomeIcon icon={faXmark} className="text-white w-4 h-4" />
        </button>
      </div>
    </div>
  );
}; 