"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

const FAQ_ITEMS = [
    {
        q: "What's included in Pro?",
        a: "Pro gives you unlimited chat history (so you never lose a conversation), custom meal plans emailed daily or on your schedule, and the ability to save and pin multiple chats. Everything in Free, plus these premium features.",
    },
    {
        q: "Can I cancel anytime?",
        a: "Yes. You can cancel your subscription at any time. You'll keep Pro access until the end of your billing period, and we won't charge you again.",
    },
    {
        q: "What's the 30-day money-back guarantee?",
        a: "The 30-day money-back guarantee applies to monthly subscriptions only. If you're on monthly and not satisfied within 30 days of your first payment, contact us for a full refund—no questions asked. Annual subscribers can cancel anytime for a pro-rated refund.",
    },
    {
        q: "How do custom meal plans work?",
        a: "Once you're on Pro, you can enable daily meal plans in Settings. Baba Selo will generate personalized meal plans based on your dietary preferences and cooking oil choices, and email them to you on the schedule you choose.",
    },
    {
        q: "What payment methods do you accept?",
        a: "We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure payment provider, Stripe. Your payment information is never stored on our servers.",
    },
];

function FaqItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
    return (
        <div
            className={`group border-b border-gray-100 last:border-0 transition-colors ${
                isOpen ? "bg-amber-50/60" : "hover:bg-gray-50/80"
            }`}
        >
            <button
                onClick={onToggle}
                className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-inset rounded-lg mx-2 my-1"
            >
                <span className={`font-semibold text-base pr-4 transition-colors ${isOpen ? "text-amber-900" : "text-gray-900 group-hover:text-amber-800"}`}>
                    {question}
                </span>
                <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isOpen
                            ? "bg-amber-600 text-white rotate-180"
                            : "bg-amber-100 text-amber-700 group-hover:bg-amber-200"
                    }`}
                >
                    <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                </span>
            </button>
            <div
                className={`overflow-hidden transition-all duration-200 ease-out ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <p className="px-6 pb-5 pt-0 text-gray-600 text-[15px] leading-relaxed max-w-[90%]">
                    {answer}
                </p>
            </div>
        </div>
    );
}

export default function UpgradePlan() {
    const [isAnnual, setIsAnnual] = useState(true); // Default to annual (better value = higher conversion)
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const monthlyPrice = 8;
    const annualDiscount = 0.15;
    const annualPrice = monthlyPrice * 12 * (1 - annualDiscount);
    const pricePerDay = (isAnnual ? annualPrice / 365 : monthlyPrice / 30).toFixed(2);

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
            <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
                {/* Hero - benefit-led headline */}
                <div className="text-center mb-10 md:mb-14">
                    <p className="text-amber-600 font-semibold text-sm uppercase tracking-wider mb-3">
                        Pro Plan
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 max-w-2xl mx-auto leading-tight">
                        Never lose a conversation again. Get custom meal plans in your inbox.
                    </h1>
                    <p className="text-gray-600 max-w-xl mx-auto text-lg">
                        Join Pro and unlock the full Baba Selo experience—for less than a coffee per month.
                    </p>
                </div>

                {/* Social proof + trust - more prominent */}
                <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10 md:mb-12">
                    <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-amber-100">
                        <span className="text-2xl">⭐</span>
                        <div>
                            <div className="font-bold text-gray-900">4.9/5</div>
                            <div className="text-xs text-gray-500">Trusted by home cooks</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-amber-100">
                        <span className="text-2xl">🔄</span>
                        <div>
                            <div className="font-bold text-gray-900">{isAnnual ? "Cancel" : "30-day"}</div>
                            <div className="text-xs text-gray-500">{isAnnual ? "Pro-rated refund" : "Money-back guarantee"}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-amber-100">
                        <span className="text-2xl">🔒</span>
                        <div>
                            <div className="font-bold text-gray-900">Cancel anytime</div>
                            <div className="text-xs text-gray-500">No commitment</div>
                        </div>
                    </div>
                </div>

                {/* Billing toggle - emphasize savings */}
                <div className="flex justify-center items-center gap-4 mb-10">
                    <span className={`text-sm transition-colors ${!isAnnual ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setIsAnnual(!isAnnual)}
                        className="relative w-14 h-7 bg-gray-200 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                        aria-label="Toggle billing cycle"
                    >
                        <div
                            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
                                isAnnual ? "translate-x-7 bg-amber-600" : ""
                            }`}
                        />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm transition-colors ${isAnnual ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                            Annual
                        </span>
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                            Save 15%
                        </span>
                    </div>
                </div>

                {/* Cards - Pro first on all screen sizes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
                    {/* Pro Plan - primary CTA */}
                    <div className="lg:order-2 relative">
                        <div className="h-full p-8 border-2 border-amber-600 rounded-2xl bg-white shadow-xl shadow-amber-900/5 flex flex-col">
                            <div className="absolute -top-3 left-8 bg-amber-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md">
                                Most Popular
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-1 mt-2">Pro</h2>
                            <div className="flex items-baseline gap-1 mb-0">
                                <span className="text-4xl md:text-5xl font-extrabold text-gray-900">
                                    ${isAnnual ? Math.round(annualPrice / 12) : monthlyPrice}
                                </span>
                                <span className="text-gray-500">/month</span>
                            </div>
                            <p className="text-sm text-amber-700 font-medium mb-4">
                                That&apos;s only ${pricePerDay}/day
                            </p>
                            {isAnnual && (
                                <p className="text-sm text-gray-500 mb-4">
                                    Billed ${Math.round(annualPrice)}/year
                                </p>
                            )}

                            <p className="text-gray-700 mb-6">
                                The complete Baba Selo experience—unlimited chats, custom meal plans, and more.
                            </p>

                            <Link
                                href={`/checkout?plan=${isAnnual ? "annual" : "monthly"}`}
                                className="w-full py-4 mt-auto mb-6 bg-amber-600 hover:bg-amber-700 text-white text-base font-bold rounded-xl transition-all duration-200 text-center shadow-lg shadow-amber-600/25 hover:shadow-xl hover:shadow-amber-600/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                            >
                                Get Pro Access{!isAnnual && " — 30-Day Guarantee"}
                            </Link>

                            <ul className="space-y-3 text-sm text-gray-700 flex-1">
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-500 mt-0.5">✓</span>
                                    <span><strong>Custom meal plans</strong> emailed daily or on your schedule</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-500 mt-0.5">✓</span>
                                    <span>Unlimited chat history—never lose a conversation</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-500 mt-0.5">✓</span>
                                    <span>Save and pin multiple chats</span>
                                </li>
                            </ul>

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <p className="text-center text-sm text-gray-600 font-medium">
                                    {isAnnual ? "Cancel anytime. Pro-rated refund available." : "🔄 30-day money-back guarantee. Cancel anytime."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Free Plan - de-emphasized */}
                    <div className="lg:order-1">
                        <div className="relative h-full p-8 border border-gray-200 rounded-2xl bg-gray-50/80 flex flex-col opacity-90">
                            <div className="absolute -top-3 left-8 bg-gray-200 text-gray-600 text-sm font-medium px-3 py-1 rounded-full">
                                Current Plan
                            </div>

                            <h2 className="text-2xl font-bold text-gray-700 mb-1 mt-2">Free</h2>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-extrabold text-gray-600">$0</span>
                                <span className="text-gray-500">/month</span>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Core features to get started with Baba Selo.
                            </p>

                            <button
                                disabled
                                className="w-full py-3 mb-6 text-gray-400 text-sm font-medium bg-gray-200 rounded-xl cursor-not-allowed"
                            >
                                Your current plan
                            </button>

                            <ul className="space-y-3 text-sm text-gray-600 flex-1">
                                <li className="flex items-start gap-3">
                                    <span className="text-gray-400">•</span>
                                    <span>Chat with Baba Selo</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-gray-400">•</span>
                                    <span>Unlimited recipe generation</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-gray-400">•</span>
                                    <span>Save recipes</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-gray-400">•</span>
                                    <span>One session—chats don&apos;t save</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-16 md:mt-20 max-w-2xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-3">
                        Frequently asked questions
                    </h2>
                    <p className="text-gray-500 text-center mb-10 text-sm md:text-base">
                        Everything you need to know about Pro
                    </p>
                    <div className="bg-white rounded-2xl border border-amber-100 shadow-lg shadow-amber-900/5 overflow-hidden">
                        {FAQ_ITEMS.map((item, i) => (
                            <FaqItem
                                key={i}
                                question={item.q}
                                answer={item.a}
                                isOpen={openFaq === i}
                                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                            />
                        ))}
                    </div>
                </div>

                {/* Trust footer */}
                <div className="mt-12 text-center">
                    <p className="text-xs text-gray-500">
                        Secure payment via Stripe. Your data is protected.
                    </p>
                </div>
            </div>
        </div>
    );
}
