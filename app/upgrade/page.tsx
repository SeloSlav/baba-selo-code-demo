"use client";

import React from "react";

export default function UpgradePlan() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <h2 className="text-3xl font-bold text-center mb-12">Upgrade your plan</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left (Free) */}
                <div className="p-8 border border-gray-200 rounded-lg shadow-sm bg-white flex flex-col">
                    {/* Title + Price */}
                    <h3 className="text-2xl font-bold mb-2">Free</h3>
                    <div className="text-5xl font-extrabold text-gray-900 mb-1">$0</div>
                    <div className="text-sm text-gray-500 mb-6">USD/month</div>

                    {/* Short description */}
                    <p className="text-gray-700 mb-4">
                        Enjoy all the core features at no cost
                    </p>

                    {/* Action button (disabled) */}
                    <button
                        disabled
                        className="w-full py-2 mt-auto mb-4 text-gray-500 text-sm font-bold bg-gray-100 rounded-full cursor-not-allowed"
                    >
                        Your current plan
                    </button>

                    {/* Feature list */}
                    <ul className="flex-1 space-y-2 text-sm text-gray-700 mb-6">
                        <li>🗨️ Unlimited text-based conversations with Baba Selo</li>
                        <li>🍲 Unlimited recipe generation</li>
                        <li>💾 Ability to save recipes</li>
                        <li>🤔 Ask Baba Selo anything about life, cooking, etc.</li>
                    </ul>

                </div>

                {/* Right (Pro) */}
                <div className="p-8 border border-gray-200 rounded-lg shadow-sm bg-white flex flex-col">
                    {/* Title + Price */}
                    <h3 className="text-2xl font-bold mb-2">Pro</h3>
                    <div className="text-5xl font-extrabold text-gray-900 mb-1">$8</div>
                    <div className="text-sm text-gray-500 mb-6">USD/month</div>

                    {/* Short description */}
                    <p className="text-gray-700 mb-4">
                        Unlock real-time audio conversations and more
                    </p>

                    {/* Action button */}
                    <button className="w-full py-2 mt-auto mb-4 bg-black text-white text-sm rounded-full hover:bg-[#212121] transition-colors">
                        Get Pro
                    </button>

                    {/* Feature list */}
                    <ul className="flex-1 space-y-2 text-sm text-gray-700 mb-6">
                        <li>🔓 Everything in Free</li>
                        <li>📜 Persistent chat history</li>
                        <li>📌 Save and pin multiple chats for easy organization</li>
                        <li>🗣️ Real-time low latency audio with Baba Selo</li>
                    </ul>

                </div>
            </div>
        </div>
    );
}
