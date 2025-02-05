"use client";

import React from 'react';
import Image from 'next/image';

export default function Yard() {
    return (
        <div className="relative min-h-screen w-full bg-gray-50">
            {/* Container with max width for desktop */}
            <div className="max-w-[1800px] mx-auto h-screen relative">
                {/* Image container with aspect ratio preservation */}
                <div className="absolute inset-0 md:inset-x-8 lg:inset-x-16">
                    <Image
                        src="/yard.png"
                        alt="Your Yard"
                        fill
                        className="object-cover md:object-contain"
                        priority
                        quality={100}
                        sizes="(max-width: 768px) 100vw, (max-width: 1800px) 90vw"
                    />
                </div>

                {/* Overlay content */}
                <div className="relative z-10 flex flex-col h-screen">
                    {/* Title overlay */}
                    <div className="w-full p-4 sm:p-6 md:p-8">
                        <div className="inline-block bg-black bg-opacity-50 rounded-2xl px-6 py-3 backdrop-blur-sm">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">The Yard</h1>
                        </div>
                    </div>

                    {/* Spacer to push the bottom message down */}
                    <div className="flex-grow" />

                    {/* Bottom message overlay */}
                    <div className="w-full p-4 sm:p-6 md:p-8">
                        <div className="max-w-xl mx-auto bg-black bg-opacity-50 rounded-2xl px-6 py-4 backdrop-blur-sm">
                            <p className="text-lg text-white text-center">
                                Your play space is getting ready... More features coming soon! 🌱
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 