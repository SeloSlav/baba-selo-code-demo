import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCat, faSpoon, faXmark } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import { format } from 'date-fns';
import { CatHistoryEntry } from '../types';
import { getRarityColor } from '../utils/colors';
import { capitalize } from '../utils/helpers';

interface CatHistoryMenuProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    history: CatHistoryEntry[];
}

export default function CatHistoryMenu({ isOpen, setIsOpen, history }: CatHistoryMenuProps) {
    if (!isOpen) return null;

    // Count unread visits
    const unreadCount = history.filter(entry => !entry.visit.read).length;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4"
            onClick={() => setIsOpen(false)}
        >
            <div 
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faCat} className="text-[#5d5d5d]" />
                            <h2 className="font-semibold text-lg">Cat History</h2>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FontAwesomeIcon icon={faXmark} className="text-gray-500" />
                        </button>
                    </div>
                    {unreadCount > 0 && (
                        <div className="text-sm text-gray-500">
                            {unreadCount} new cat {unreadCount === 1 ? 'visit' : 'visits'}
                        </div>
                    )}
                </div>

                {/* History content */}
                <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(80vh - 85px)' }}>
                    {history.length > 0 ? (
                        <div className="space-y-4">
                            {history.map((entry, index) => (
                                <div 
                                    key={`${entry.visit.catId}-${entry.visit.timestamp.getTime()}`}
                                    className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 transition-colors ${
                                        !entry.visit.read ? 'bg-yellow-50' : ''
                                    }`}
                                >
                                    <div className="flex items-center p-4">
                                        <div className="relative h-16 w-16 flex-shrink-0">
                                            <Image
                                                src={entry.cat.imageUrl}
                                                alt={entry.cat.name}
                                                fill
                                                className="object-cover rounded-lg"
                                            />
                                        </div>
                                        <div className="ml-4 flex-grow">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold">{entry.cat.name}</h3>
                                                <span className="text-sm text-gray-500">
                                                    {format(entry.visit.timestamp, 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRarityColor(entry.cat.rarity)}`}>
                                                    {capitalize(entry.cat.rarity)}
                                                </span>
                                                <div className="flex items-center text-yellow-600 text-sm">
                                                    <FontAwesomeIcon icon={faSpoon} className="mr-1" />
                                                    <span>+{entry.visit.spoonReward}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <FontAwesomeIcon icon={faCat} className="text-4xl mb-2" />
                            <p>No cat visits yet. Try placing some food and toys!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 