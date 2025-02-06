"use client";

import React from 'react';

export default function Terms() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
                
                <div className="prose prose-gray max-w-none">
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
                        <p className="text-gray-600 mb-4">
                            Welcome to Baba Selo. By accessing our service, you agree to these terms. Please read them carefully.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Using Our Services</h2>
                        <p className="text-gray-600 mb-4">
                            Our services include chat interactions, recipe generation, and digital goods. You must follow any policies made available to you within the services.
                        </p>
                        <p className="text-gray-600 mb-4">
                            Don't misuse our services. For example, don't interfere with our services or try to access them using a method other than the interface and instructions we provide.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Your Baba Selo Account</h2>
                        <p className="text-gray-600 mb-4">
                            You need a Google Account to use our services. You are responsible for maintaining the security of your account.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Digital Content and Virtual Items</h2>
                        <p className="text-gray-600 mb-4">
                            Our service includes virtual items and digital content. These items are licensed, not sold, to you. Your right to use these items is limited to personal, non-commercial use.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Content Generation</h2>
                        <p className="text-gray-600 mb-4">
                            Our AI-generated content, including recipes and conversations, is provided "as is." While we strive for accuracy, we cannot guarantee the completeness or reliability of generated content.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Modifications to the Service</h2>
                        <p className="text-gray-600 mb-4">
                            We are constantly changing and improving our services. We may add or remove functionalities or features, and we may suspend or stop a service altogether.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Contact Information</h2>
                        <p className="text-gray-600">
                            For any questions about these terms, please contact us at support@babaselo.com
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