import React, { useEffect, useState } from 'react';

interface SleepingAnimationProps {
    onAnimationComplete: () => void;
}

// Babushka's thought emojis grouped by category
const BABUSHKA_THOUGHTS = [
    // Food
    '🥘', '🥖', '🥫', '🍯', '🥩',
    // Garden & Nature
    '🌺', '🍅', '🥔', '🧄',
    // Family & Home
    '👶', '🧶', '🧦',
    // Traditional Items
    '🍷', '📿', '🕯️',
    // Animals
    '🐈', '🐓'
];

export default function SleepingAnimation({ onAnimationComplete }: SleepingAnimationProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [emoji] = useState(() => {
        // Select random emoji on mount
        const randomIndex = Math.floor(Math.random() * BABUSHKA_THOUGHTS.length);
        return BABUSHKA_THOUGHTS[randomIndex];
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onAnimationComplete();
        }, 4000);

        return () => clearTimeout(timer);
    }, [onAnimationComplete]);

    if (!isVisible) return null;

    return (
        <div className="absolute -top-24 -left-0 transform">
            {/* Thought bubble container */}
            <div className="relative bg-white rounded-full p-4 shadow-lg border border-gray-200 aspect-square flex items-center justify-center" style={{ width: '60px', height: '60px' }}>
                {/* Thought bubble tail */}
                <div className="absolute -bottom-12 right-0 transform">
                    <div className="w-4 h-4 bg-white border border-gray-200 rounded-full mb-1"></div>
                    <div className="w-3 h-3 bg-white border border-gray-200 rounded-full mb-1 ml-3"></div>
                    <div className="w-2 h-2 bg-white border border-gray-200 rounded-full ml-5"></div>
                </div>
                
                {/* Bouncing emoji container */}
                <div className="text-2xl animate-slow-bounce">
                    {emoji}
                </div>
            </div>
        </div>
    );
}