"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

const PWABanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the banner
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Clear the deferredPrompt variable
    setDeferredPrompt(null);
    
    // Hide the banner
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-black text-white py-2 px-4 flex items-center justify-between z-[9999] shadow-lg">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faDownload} className="w-6 h-6" />
        <span className="text-sm">Install Baba Selo for a better experience</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsVisible(false)}
          className="text-sm px-3 py-1 hover:bg-gray-800 rounded transition-colors"
        >
          Not now
        </button>
        <button
          onClick={handleInstallClick}
          className="text-sm px-3 py-1 bg-white text-black rounded hover:bg-gray-100 transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
};

export default PWABanner; 