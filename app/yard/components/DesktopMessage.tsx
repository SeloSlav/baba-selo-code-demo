import React from 'react';

export default function DesktopMessage() {
    return (
        <div className="hidden md:flex fixed inset-0 items-center justify-center bg-black bg-opacity-70 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-lg mx-4 text-center shadow-2xl transform transition-all duration-300 hover:scale-105">
                <div className="text-4xl mb-4">📱</div>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Best Experienced on Mobile</h2>
                <p className="text-gray-600 mb-6">
                    The Yard is optimized for mobile play. Visit{' '}
                    <a 
                        href="/yard" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors underline"
                    >
                        babaselo.com/yard
                    </a>
                    {' '}on your phone for the optimal gaming experience!
                </p>
            </div>
        </div>
    );
} 