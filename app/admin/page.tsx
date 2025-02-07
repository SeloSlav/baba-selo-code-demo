"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePoints } from '../context/PointsContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import RecipeModernizer from './components/RecipeModernizer';
import MarketplaceManager from './components/MarketplaceManager';
import PointsManager from './components/PointsManager';
import { isAdmin } from '../config/admin';

export default function AdminPage() {
    const [initializing, setInitializing] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const { user } = useAuth();
    const { showPointsToast } = usePoints();
    const router = useRouter();

    // First, wait for auth to initialize
    useEffect(() => {
        const checkAuth = async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setAuthLoading(false);
        };
        checkAuth();
    }, []);

    // Then check admin status
    useEffect(() => {
        if (authLoading) {
            console.log('Waiting for auth to initialize...');
            return;
        }

        const checkAdmin = async () => {
            console.log('=== Admin Check Debug ===');
            console.log('Auth initialized, user:', user);
            console.log('User UID:', user?.uid);

            if (!user) {
                console.log('No user found');
                showPointsToast(0, "Access denied: Please log in");
                router.push('/');
                setInitializing(false);
                return;
            }

            try {
                const adminCheck = await isAdmin(user.uid);
                console.log('Admin check result:', adminCheck);
                
                if (!adminCheck) {
                    console.log('User is not admin');
                    console.log('Your UID:', user.uid);
                    showPointsToast(0, "Access denied: Admin privileges required");
                    router.push('/');
                }
                
                // Always set initializing to false after the check
                setInitializing(false);
            } catch (error) {
                console.error('Error checking admin status:', error);
                setInitializing(false);
                showPointsToast(0, "Error checking admin status");
                router.push('/');
            }
        };

        checkAdmin();
    }, [user, router, showPointsToast, authLoading]);

    // Show loading state while checking authentication
    if (initializing || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <LoadingSpinner />
                <p className="mt-4 text-gray-600">
                    {authLoading ? 'Initializing authentication...' : 'Checking admin status...'}
                </p>
            </div>
        );
    }

    // If not user or not admin, don't render anything
    if (!user) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            {/* Recipe Modernizer Section */}
            <RecipeModernizer showPointsToast={showPointsToast} />

            {/* Marketplace Management */}
            <MarketplaceManager user={user} showPointsToast={showPointsToast} />

            {/* Points Management */}
            <PointsManager user={user} showPointsToast={showPointsToast} />
        </div>
    );
} 