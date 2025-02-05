import React, { useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpoon, faCheck, faCheckDouble } from "@fortawesome/free-solid-svg-icons";
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { POINT_ACTIONS } from '../lib/spoonPoints';

interface PointTransaction {
  actionType: string;
  points: number;
  timestamp: Timestamp;
  details?: string;
  targetId?: string;
  read?: boolean;
}

interface SpoonHistoryMenuProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: PointTransaction[];
  totalPoints: number;
  onTransactionRead: (transactionId: string) => void;
  onMarkAllRead: () => void;
  unreadCount: number;
}

// Function to get emoji for action type
const getActionEmoji = (actionType: string): string => {
  switch (actionType) {
    case 'SAVE_RECIPE':
      return '💾';
    case 'GENERATE_RECIPE':
      return '✨';
    case 'GENERATE_SUMMARY':
      return '📝';
    case 'GENERATE_NUTRITION':
      return '📊';
    case 'GENERATE_PAIRINGS':
      return '🍷';
    case 'GENERATE_IMAGE':
      return '🎨';
    case 'UPLOAD_IMAGE':
      return '📸';
    case 'CHAT_INTERACTION':
      return '💬';
    case 'RECIPE_SAVED_BY_OTHER':
      return '❤️';
    case 'MARKETPLACE_PURCHASE':
      return '🛍️';
    default:
      return '🎯';
  }
};

export const SpoonHistoryMenu: React.FC<SpoonHistoryMenuProps> = ({ 
  isOpen, 
  onClose, 
  transactions,
  totalPoints,
  onTransactionRead,
  onMarkAllRead,
  unreadCount
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Function to render a transaction row
  const renderTransaction = (transaction: PointTransaction, index: number) => {
    const date = transaction.timestamp.toDate();
    const uniqueKey = `${date.getTime()}-${transaction.actionType}-${transaction.targetId || ''}`;
    
    return (
      <div 
        key={uniqueKey} 
        className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group relative ${!transaction.read ? 'bg-yellow-50' : ''}`}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div className="text-xl mr-3 flex-shrink-0" role="img" aria-label={transaction.actionType}>
            {getActionEmoji(transaction.actionType)}
          </div>
          <div className="min-w-0">
            <div 
              className="font-medium truncate"
              title={transaction.details || POINT_ACTIONS[transaction.actionType]?.displayName}
            >
              {transaction.details || POINT_ACTIONS[transaction.actionType]?.displayName}
            </div>
            <div className="text-xs text-gray-500">{format(date, 'MMM d, h:mm a')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center ml-2 flex-shrink-0 ${
            transaction.actionType === 'MARKETPLACE_PURCHASE' ? 'text-red-500' : 'text-yellow-600'
          }`}>
            <FontAwesomeIcon icon={faSpoon} className="mr-1" />
            <span className="font-bold">
              {transaction.actionType === 'MARKETPLACE_PURCHASE' 
                ? `-${String(transaction.points).replace(/[^0-9]/g, '')}`
                : `+${String(transaction.points).replace(/[^0-9]/g, '')}`
              }
            </span>
          </div>
          {!transaction.read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTransactionRead(uniqueKey);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-gray-100 rounded-full"
              title="Mark as read"
            >
              <FontAwesomeIcon icon={faCheck} className="text-gray-500 w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={menuRef}
      className="absolute top-full right-0 mt-1 z-40 bg-white rounded-3xl shadow-lg w-80 border border-gray-300 p-3"
      style={{ maxHeight: 'calc(100vh - 5rem)', overflowY: 'auto' }}
    >
      <div className="mb-3 px-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <p className="text-sm text-gray-500">Track your cooking achievements</p>
          </div>
          <div className="flex items-center text-yellow-600">
            <FontAwesomeIcon icon={faSpoon} className="mr-2" />
            <span className="text-lg font-bold">{totalPoints}</span>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </span>
            <button
              onClick={onMarkAllRead}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <FontAwesomeIcon icon={faCheckDouble} className="w-3 h-3" />
              <span>Mark all as read</span>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {transactions && transactions.length > 0 ? (
          transactions
            .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime())
            .slice(0, 10) // Show only the 10 most recent transactions
            .map((transaction, index) => renderTransaction(transaction, index))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No points history yet. Start interacting with recipes to earn points!
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <Link 
          href="/spoons" 
          className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View Full History
        </Link>
      </div>
    </div>
  );
}; 