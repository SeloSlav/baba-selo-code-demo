"use client";

import React from 'react';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
                
                <div className="prose prose-gray max-w-none">
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Information We Collect</h2>
                        <p className="text-gray-600 mb-4">
                            When you use Baba Selo, we collect:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>Information from your Google account (name, email, profile picture)</li>
                            <li>Chat interactions and recipe requests</li>
                            <li>Usage data and preferences</li>
                            <li>Virtual item inventory and transaction history</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">2. How We Use Your Information</h2>
                        <p className="text-gray-600 mb-4">
                            We use your information to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>Provide and personalize our services</li>
                            <li>Improve our AI interactions and recipe generation</li>
                            <li>Maintain and enhance your virtual inventory</li>
                            <li>Send important updates about our services</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Data Storage and Security</h2>
                        <p className="text-gray-600 mb-4">
                            We store your data securely using industry-standard practices. Your data is hosted on Google Cloud Platform with appropriate security measures in place.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Data Sharing</h2>
                        <p className="text-gray-600 mb-4">
                            We do not sell your personal data. We may share your information with:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>Service providers who assist in operating our platform</li>
                            <li>Law enforcement when required by law</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Your Rights</h2>
                        <p className="text-gray-600 mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>Access your personal data</li>
                            <li>Request deletion of your data</li>
                            <li>Export your data</li>
                            <li>Opt-out of non-essential data collection</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Cookies and Tracking</h2>
                        <p className="text-gray-600 mb-4">
                            We use cookies and similar technologies to maintain your session and preferences. You can control cookie settings through your browser.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Contact Us</h2>
                        <p className="text-gray-600">
                            For privacy-related questions or to exercise your rights, contact us at privacy@babaselo.com
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500 text-center">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>
            </div>
        </div>
    );
} 