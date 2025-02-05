import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpoon } from "@fortawesome/free-solid-svg-icons";
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

interface PointTransaction {
  actionType: string;
  points: number;
  timestamp: Timestamp;
  details?: string;
  targetId?: string;
}

interface PointsHistoryProps {
  transactions: PointTransaction[];
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

export const PointsHistory: React.FC<PointsHistoryProps> = ({ transactions }) => {
  // Function to render a transaction row
  const renderTransaction = (transaction: PointTransaction, index: number) => {
    const date = transaction.timestamp.toDate();
    const uniqueKey = `${date.getTime()}-${transaction.actionType}-${transaction.targetId || ''}-${index}`;
    
    return (
      <div key={uniqueKey} className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50">
        <div className="flex items-center flex-1">
          <div className="text-xl mr-3" role="img" aria-label={transaction.actionType}>
            {getActionEmoji(transaction.actionType)}
          </div>
          <div>
            <div className="font-medium">{transaction.details}</div>
            <div className="text-xs text-gray-500">{format(date, 'MMM d, yyyy h:mm a')}</div>
          </div>
        </div>
        <div className="flex items-center text-yellow-600 ml-4">
          <FontAwesomeIcon icon={faSpoon} className="mr-2" />
          <span className="font-bold">+{transaction.points}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Points History</h2>
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {transactions && transactions.length > 0 ? (
          transactions
            .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime())
            .map((transaction, index) => renderTransaction(transaction, index))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No points history yet. Start interacting with recipes to earn points!
          </div>
        )}
      </div>
    </div>
  );
}; 