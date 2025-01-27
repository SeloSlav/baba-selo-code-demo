"use client";

import React from "react";

export default function UpgradePlan() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            {/* Enhanced header section */}
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-3">Upgrade to Pro</h2>
                <p className="text-gray-600 max-w-xl mx-auto">Get the full Baba Selo experience with real-time audio conversations and advanced features.</p>
            </div>

            {/* Social proof section */}
            <div className="flex justify-center gap-8 mb-12">
                <div className="flex items-center">
                    <span className="text-2xl mr-2">⭐</span>
                    <div>
                        <div className="font-bold">4.9/5 rating</div>
                        <div className="text-sm text-gray-600">from 100+ users</div>
                    </div>
                </div>
                <div className="flex items-center">
                    <span className="text-2xl mr-2">🔒</span>
                    <div>
                        <div className="font-bold">Secure payments</div>
                        <div className="text-sm text-gray-600">256-bit encryption</div>
                    </div>
                </div>
                <div className="flex items-center">
                    <span className="text-2xl mr-2">💫</span>
                    <div>
                        <div className="font-bold">Cancel anytime</div>
                        <div className="text-sm text-gray-600">No commitments</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Free Plan - More subdued */}
                <div className="p-8 border border-gray-200 rounded-2xl bg-white flex flex-col relative">
                    <div className="absolute -top-3 left-8 bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
                        Basic
                    </div>
                    
                    {/* Title + Price */}
                    <h3 className="text-2xl font-bold mb-2">Free</h3>
                    <div className="text-5xl font-extrabold text-gray-900 mb-1">$0</div>
                    <div className="text-sm text-gray-500 mb-6">USD/month</div>

                    {/* Short description */}
                    <p className="text-gray-700 mb-4">
                        Perfect for trying out Baba Selo's core features
                    </p>

                    {/* Current plan indicator */}
                    <button
                        disabled
                        className="w-full py-3 mt-auto mb-6 text-gray-500 text-sm font-medium bg-gray-100 rounded-xl cursor-not-allowed"
                    >
                        Your current plan
                    </button>

                    {/* Feature list */}
                    <ul className="flex-1 space-y-3 text-sm text-gray-700">
                        <li className="flex items-start">
                            <span className="text-lg mr-3">🗨️</span>
                            <span>Unlimited text-based conversations with Baba Selo</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-lg mr-3">🍲</span>
                            <span>Unlimited recipe generation</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-lg mr-3">💾</span>
                            <span>Ability to save recipes</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-lg mr-3">🤔</span>
                            <span>Ask Baba Selo anything about life, cooking, etc.</span>
                        </li>
                    </ul>
                </div>

                {/* Pro Plan - More prominent */}
                <div className="p-8 border-2 border-black rounded-2xl bg-white flex flex-col relative transform hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute -top-3 left-8 bg-black text-white text-sm font-medium px-3 py-1 rounded-full">
                        Most Popular
                    </div>

                    {/* Title + Price */}
                    <h3 className="text-2xl font-bold mb-2">Pro</h3>
                    <div className="text-5xl font-extrabold text-gray-900 mb-1">$8</div>
                    <div className="text-sm text-gray-500 mb-6">USD/month</div>

                    {/* Enhanced description */}
                    <p className="text-gray-700 mb-4">
                        The complete Baba Selo experience with voice chat
                    </p>

                    {/* Enhanced CTA */}
                    <a 
                        href="mailto:martin@selooils.com?subject=I'm%20very%20interested%20in%20getting%20Pro&body=Just%20sending%20this%20message%20as%20is%20will%20give%20me%20an%20idea%20of%20how%20many%20people%20are%20interested."
                        className="w-full py-3 mt-auto mb-6 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-900 transition-all duration-300 text-center relative overflow-hidden group"
                    >
                        <span className="relative z-10">Get Pro Access</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </a>

                    {/* Enhanced feature list */}
                    <ul className="flex-1 space-y-3 text-sm text-gray-700">
                        <li className="flex items-start">
                            <span className="text-lg mr-3">✨</span>
                            <span>Everything in Free, plus:</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-lg mr-3">🗣️</span>
                            <span><strong>Real-time voice chat</strong> with Baba Selo</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-lg mr-3">📜</span>
                            <span>Unlimited chat history</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-lg mr-3">📌</span>
                            <span>Save and pin multiple chats</span>
                        </li>
                    </ul>

                    {/* Money-back guarantee */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-center text-sm text-gray-600">
                            <span className="mr-2">🔄</span>
                            30-day money-back guarantee
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
