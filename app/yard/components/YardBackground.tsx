import React from 'react';
import Image from 'next/image';

interface YardBackgroundProps {
    showInstallBanner: boolean;
}

export default function YardBackground({ showInstallBanner }: YardBackgroundProps) {
    return (
        <div className={`relative h-screen w-screen overflow-x-auto custom-scrollbar ${showInstallBanner ? 'mt-12' : ''}`}>
            <div className="absolute inset-0">
                <Image
                    src="/yard_mobile.png"
                    alt="Your Yard"
                    fill
                    className="object-contain object-top md:hidden"
                    priority
                    quality={100}
                    sizes="100vw"
                />
                <Image
                    src="/yard.png"
                    alt="Your Yard"
                    fill
                    className="hidden md:block object-cover"
                    priority
                    quality={100}
                    sizes="100vw"
                />
            </div>
        </div>
    );
} 