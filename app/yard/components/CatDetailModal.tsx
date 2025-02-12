import React, { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPaw, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Cat } from '../types';
import { getRarityColor } from '../utils/colors';
import { capitalize } from '../utils/helpers';

const SPOON_MULTIPLIERS = {
    common: 5,
    uncommon: 10,
    rare: 15,
    epic: 25,
    legendary: 40,
};

interface CatDetailModalProps {
    cat: Cat;
    visitCount: number;
    onClose: () => void;
    onBack?: () => void;
}

export default function CatDetailModal({ cat, visitCount, onClose, onBack }: CatDetailModalProps) {
    const [isImageExpanded, setIsImageExpanded] = useState(false);

    const toggleImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsImageExpanded(!isImageExpanded);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative z-10 flex items-center justify-between p-4 bg-white border-b border-gray-200">
                    <button 
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-xl" />
                    </button>
                </div>

                {/* Cat Image with Zoom */}
                <div 
                    className={`relative cursor-pointer transition-all duration-500 ease-in-out overflow-hidden ${
                        isImageExpanded ? 'h-[80vh]' : 'h-48'
                    }`}
                    onClick={toggleImage}
                >
                    <div className={`absolute inset-0 transition-transform duration-500 ${
                        isImageExpanded ? 'scale-100' : 'scale-110 hover:scale-105'
                    }`}>
                        <Image
                            src={cat.imageUrl}
                            alt={cat.name}
                            fill
                            className={`object-cover transition-all duration-500 ${
                                isImageExpanded ? 'object-contain' : 'object-cover'
                            }`}
                        />
                    </div>
                    {/* Sliding overlays */}
                    <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black to-transparent opacity-50 transition-transform duration-500 ${
                        isImageExpanded ? '-translate-y-full' : 'translate-y-0'
                    }`} />
                    <div className={`absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent opacity-50 transition-transform duration-500 ${
                        isImageExpanded ? 'translate-y-full' : 'translate-y-0'
                    }`} />
                </div>

                {/* Cat Info */}
                <div className="p-6 space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{cat.name}</h2>
                        <div className="flex items-center gap-3">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRarityColor(cat.rarity)}`}>
                                {capitalize(cat.rarity)}
                            </span>
                            <div className="flex items-center text-purple-600">
                                <FontAwesomeIcon icon={faPaw} className="mr-1.5" />
                                <span>{visitCount} {visitCount === 1 ? 'visit' : 'visits'}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">About</h3>
                        <p className="text-gray-600">{cat.description}</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Rewards</h3>
                        <p className="text-gray-600">
                            This {cat.rarity} cat rewards {SPOON_MULTIPLIERS[cat.rarity]}x spoons on each visit!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 