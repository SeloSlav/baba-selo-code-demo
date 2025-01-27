"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';

// This would be your actual Stripe configuration
const STRIPE_CONFIG = {
    // Replace with your actual publishable key
    publishableKey: 'pk_test_your_publishable_key',
    prices: {
        monthly: 'price_monthly_id', // Replace with your Stripe price ID for monthly
        annual: 'price_annual_id',   // Replace with your Stripe price ID for annual
    }
};

export default function Checkout() {
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan') || 'monthly';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeCheckout = async () => {
            try {
                // This is where you would initialize Stripe and create a checkout session
                // Example implementation:
                /*
                const stripe = await loadStripe(STRIPE_CONFIG.publishableKey);
                const response = await fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        priceId: STRIPE_CONFIG.prices[plan],
                        successUrl: window.location.origin + '/success',
                        cancelUrl: window.location.origin + '/upgrade',
                    }),
                });
                
                const session = await response.json();
                await stripe.redirectToCheckout({
                    sessionId: session.id
                });
                */

                // For now, we'll just simulate loading
                await new Promise(resolve => setTimeout(resolve, 1500));
                setError('Stripe integration is not yet implemented');
            } catch (err) {
                setError('Failed to initialize checkout');
            } finally {
                setLoading(false);
            }
        };

        initializeCheckout();
    }, [plan]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                {loading ? (
                    <div className="py-8 flex flex-col items-center">
                        <LoadingSpinner className="mb-4" />
                        <p className="text-gray-600">Preparing your checkout...</p>
                    </div>
                ) : error ? (
                    <div className="py-8">
                        <div className="text-red-600 mb-4 text-5xl">⚠️</div>
                        <p className="text-gray-800 font-medium mb-2">Checkout Unavailable</p>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <a 
                            href="/upgrade"
                            className="inline-block bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-900 transition-colors"
                        >
                            Go Back
                        </a>
                    </div>
                ) : null}
            </div>
        </div>
    );
} 