import React from 'react';

interface PWAInstallBannerProps {
    showInstallBanner: boolean;
    setShowInstallBanner: (show: boolean) => void;
    handleInstallClick: () => void;
}

export default function PWAInstallBanner({ 
    showInstallBanner, 
    setShowInstallBanner, 
    handleInstallClick 
}: PWAInstallBannerProps) {
    if (!showInstallBanner) return null;

    return (
        <div className="fixed top-0 left-0 right-0 bg-black text-white z-50 shadow-lg">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <span className="text-lg">📱</span>
                    <span className="text-sm font-medium">Add to Home Screen for the best experience!</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowInstallBanner(false)}
                        className="text-white/60 hover:text-white px-2 py-1 text-sm"
                    >
                        Later
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="bg-white text-black px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 active:bg-gray-200"
                    >
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
} 