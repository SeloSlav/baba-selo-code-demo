"use client";

import React from 'react';
import Image from 'next/image';

export default function Yard() {
    return (
        <div className="relative min-h-screen w-full bg-gray-50">
            {/* Full-width background container */}
            <div className="absolute inset-0 bg-gray-50" />
            
            {/* Centered content container */}
            <div className="relative max-w-[1800px] mx-auto h-screen">
                {/* Image container with horizontal scroll on mobile */}
                <div className="absolute inset-0 md:inset-x-8 lg:inset-x-16">
                    <div className="relative h-full md:h-auto md:absolute md:inset-0 overflow-x-auto md:overflow-visible">
                        <div className="relative h-full w-[200%] md:w-full">
                            <Image
                                src="/yard.png"
                                alt="Your Yard"
                                fill
                                className="object-contain md:object-contain"
                                priority
                                quality={100}
                                sizes="(max-width: 768px) 200vw, (max-width: 1800px) 90vw"
                            />
                        </div>
                    </div>
                </div>

                {/* Overlay content */}
                <div className="relative z-10 flex flex-col h-screen pointer-events-none">
                    {/* Title overlay */}
                    <div className="w-full p-4 sm:p-6 md:p-8 pointer-events-auto">
                        <div className="inline-flex items-center bg-white bg-opacity-95 rounded-3xl px-6 py-3 shadow-lg backdrop-blur-sm border border-gray-200">
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#5d5d5d]">The Yard</h1>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 