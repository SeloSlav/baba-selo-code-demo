"use client";

import React, { useState } from "react";

export default function UpgradePlan() {
    const [isAnnual, setIsAnnual] = useState(false);
    const monthlyPrice = 8;
    const annualDiscount = 0.15;
    const annualPrice = monthlyPrice * 12 * (1 - annualDiscount);

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            {/* Enhanced header section */}
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-3">Upgrade to Pro</h2>
                <p className="text-gray-600 max-w-xl mx-auto">Get the full Baba Selo experience with real-time audio conversations and advanced features.</p>
            </div>

            {/* Social proof section - Compact on mobile */}
            <div className="flex justify-center gap-4 md:gap-8 mb-12">
                <div className="flex items-center">
                    <span className="text-xl md:text-2xl mr-1.5 md:mr-2">⭐</span>
                    <div>
                        <div className="text-sm md:text-base font-bold">4.9/5 rating</div>
                        <div className="text-xs md:text-sm text-gray-600">100+ users</div>
                    </div>
                </div>
                <div className="flex items-center">
                    <span className="text-xl md:text-2xl mr-1.5 md:mr-2">🔒</span>
                    <div>
                        <div className="text-sm md:text-base font-bold">Secure</div>
                        <div className="text-xs md:text-sm text-gray-600">256-bit SSL</div>
                    </div>
                </div>
                <div className="flex items-center">
                    <span className="text-xl md:text-2xl mr-1.5 md:mr-2">💫</span>
                    <div>
                        <div className="text-sm md:text-base font-bold">Flexible</div>
                        <div className="text-xs md:text-sm text-gray-600">Cancel anytime</div>
                    </div>
                </div>
            </div>

            {/* Billing cycle toggle */}
            <div className="flex justify-center items-center gap-4 mb-12">
                <span className={`text-sm ${!isAnnual ? 'font-semibold' : 'text-gray-600'}`}>Monthly</span>
                <button
                    onClick={() => setIsAnnual(!isAnnual)}
                    className="relative w-14 h-7 bg-gray-200 rounded-full transition-colors duration-300"
                >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                        isAnnual ? 'transform translate-x-7 bg-black' : ''
                    }`} />
                </button>
                <div className="flex items-center gap-2">
                    <span className={`text-sm ${isAnnual ? 'font-semibold' : 'text-gray-600'}`}>Annual</span>
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Save 15%</span>
                </div>
            </div>

            {/* Grid with reordered cards on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pro Plan First on Mobile */}
                <div className="md:order-2 p-8 border-2 border-black rounded-2xl bg-white flex flex-col relative transform hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute -top-3 left-8 bg-black text-white text-sm font-medium px-3 py-1 rounded-full">
                        Most Popular
                    </div>
                    
                    {/* Title + Price */}
                    <h3 className="text-2xl font-bold mb-2">Pro</h3>
                    <div className="text-5xl font-extrabold text-gray-900 mb-1">
                        ${isAnnual ? Math.round(annualPrice / 12) : monthlyPrice}
                    </div>
                    <div className="text-sm text-gray-500 mb-1">USD/month</div>
                    {isAnnual && (
                        <div className="text-sm text-green-600 mb-6">
                            Billed annually (${Math.round(annualPrice)}/year)
                        </div>
                    )}

                    {/* Enhanced description */}
                    <p className="text-gray-700 mb-4">
                        The complete Baba Selo experience with voice chat
                    </p>

                    {/* Updated CTA */}
                    <a 
                        href={`/checkout?plan=${isAnnual ? 'annual' : 'monthly'}`}
                        className="w-full py-3 mt-auto mb-6 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-900 transition-all duration-300 text-center relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative z-10">Get Pro Access</span>
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
                            <span className="text-lg mr-3">📅</span>
                            <span><strong>Custom meal plans</strong> tailored to your preferences</span>
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

                {/* Free Plan Second on Mobile */}
                <div className="md:order-1 p-8 border border-gray-200 rounded-2xl bg-white flex flex-col relative">
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
                        <li className="flex items-start">
                            <span className="text-lg mr-3">🌟</span>
                            <span><strong>Unlimited spoon points</strong> - earn as many as you want!</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-lg mr-3">🛍️</span>
                            <span>Full access to the marketplace with no restrictions</span>
                        </li>
                    </ul>

                    {/* Added clarification about free tier */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-center text-sm text-gray-600">
                            <span className="mr-2">💫</span>
                            No limits on points or core features
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
