"use client";

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpoon, faChevronDown, faChevronUp, faLightbulb, faTrophy, faGear } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import Link from 'next/link';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { POINT_ACTIONS } from '../lib/spoonPoints';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface PointTransaction {
  actionType: string;
  points: number;
  timestamp: Timestamp;
  details?: string;
  targetId?: string;
}

interface UserSpoonData {
  totalPoints: number;
  transactions: PointTransaction[];
  username: string;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
}

const SpoonStats = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserSpoonData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  // Function to fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      // Query top 25 users by total points
      const leaderboardQuery = query(
        collection(db, 'spoonPoints'),
        orderBy('totalPoints', 'desc'),
        limit(25)
      );
      const leaderboardDocs = await getDocs(leaderboardQuery);
      
      // Get all user documents for additional user data
      const userDocs = await Promise.all(
        leaderboardDocs.docs.map(async (doc) => {
          const userRef = doc.ref;
          const userDoc = await getDoc(userRef);
          return {
            spoonData: doc.data(),
            userData: userDoc.exists() ? userDoc.data() : null,
            id: doc.id
          };
        })
      );

      // Map the data to our leaderboard format
      const leaderboardData = userDocs.map(({ spoonData, userData, id }) => ({
        userId: id,
        username: spoonData.username || userData?.username || 'Anonymous Chef',
        totalPoints: spoonData.totalPoints || 0,
      }));

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const userSpoonRef = doc(db, 'spoonPoints', user.uid);
        const userSpoonDoc = await getDoc(userSpoonRef);

        if (!userSpoonDoc.exists()) {
          const initialData = {
            totalPoints: 0,
            transactions: [],
            username: 'Anonymous Chef'
          };
          await setDoc(userSpoonRef, initialData);
          setUserData(initialData);
        } else {
          setUserData(userSpoonDoc.data() as UserSpoonData);
        }

        await fetchLeaderboard();
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching spoon stats:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

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
        return '🤝';
      default:
        return '🎯';
    }
  };

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
            <div className="font-medium">{transaction.details || POINT_ACTIONS[transaction.actionType]?.displayName}</div>
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <img src="/baba-removebg.png" alt="Baba" className="w-32 h-32 mb-6" />
        <div className="typing-indicator flex space-x-2">
          <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
          <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
          <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Add Baba Selo logo and title */}
      <div className="flex flex-col items-center mb-12">
        <img src="/baba-removebg.png" alt="Baba" className="w-32 h-32 mb-4" />
        <h1 className="text-center text-2xl font-semibold mb-4">
          Let's see how many points you've earned, dear!
        </h1>
        <p className="text-lg text-gray-600">Every interaction with Baba counts!</p>
      </div>

      {/* Header with total points */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        {userData?.totalPoints ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-4 rounded-full mr-4">
                <FontAwesomeIcon icon={faSpoon} className="text-2xl text-yellow-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Your Spoon Stats</h1>
                <p className="text-gray-600">Track your cooking achievements</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-yellow-600">{userData.totalPoints}</div>
              <div className="text-gray-600">Total Spoons Earned</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-2xl font-bold mb-4">No Points Yet!</div>
            <p className="text-gray-600 mb-6">Time to start your cooking journey with Baba!</p>
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              <span className="mr-2">✨</span>
              Start by Generating a Recipe
            </Link>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 transition-all duration-200">
        <button 
          onClick={() => setIsInfoExpanded(!isInfoExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <FontAwesomeIcon icon={faLightbulb} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">How do Spoon Points work?</h2>
          </div>
          <FontAwesomeIcon 
            icon={isInfoExpanded ? faChevronUp : faChevronDown} 
            className="text-gray-400"
          />
        </button>
        
        {isInfoExpanded && (
          <div className="mt-4 space-y-4 text-gray-600 animate-fadeIn">
            <p>
              <span className="font-semibold">Spoon Points</span> are your cooking achievement score! 
              Earn them by interacting with Baba Selo and building your recipe collection.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="font-semibold">Ways to earn points:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Generating new recipes (5 points)</li>
                <li>Generating recipe summaries (15 points)</li>
                <li>Getting calorie and nutritional information (20 points)</li>
                <li>Discovering perfect dish pairings (15 points)</li>
                <li>Generating AI recipe images (10 points)</li>
                <li>Uploading your own recipe photos (250-1000 points for authentic food photos, 0 points if unrelated)</li>
                <li>Chatting with Baba about your recipe (5 points per meaningful interaction)</li>
                <li>Having others save your shared recipes (10 points per save)</li>
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="font-semibold text-yellow-800">🌟 Pro tips:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-yellow-800">
                <li>Completing all recipe sections in one session earns bonus points!</li>
                <li>Regular interactions with Baba unlock special achievements</li>
                <li>Try asking Baba about traditional cooking techniques</li>
                <li>Share your recipes to earn points from the community</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="font-semibold text-blue-800">⚡ Important Notes:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-blue-800">
                <li>Each activity has hourly and daily limits - experiment to discover them!</li>
                <li>Submitting the same recipes repeatedly won't earn points - get creative!</li>
                <li>Points are awarded for meaningful interactions, not repetitive actions</li>
                <li>The more unique and diverse your contributions, the more points you can earn</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-4 mt-4">
              <p className="font-semibold text-green-800">🎁 Coming Soon:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-green-800">
                <li>Exclusive discounts on SELO olive oil and partnering brands</li>
                <li>Special rewards and free product giveaways</li>
                <li>Seasonal cooking contests with exciting prizes</li>
                <li>Early access to new Baba Selo features</li>
              </ul>
              <p className="mt-2 text-sm text-green-700 italic">Baba Selo is currently finalizing these exciting rewards - keep earning those points!</p>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Global Leaderboard</h2>
        {leaderboard.length > 0 ? (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: index === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                                index === 1 ? 'linear-gradient(135deg, #C0C0C0, #E0E0E0)' :
                                index === 2 ? 'linear-gradient(135deg, #CD7F32, #DEB887)' :
                                'bg-yellow-100'
                    }}
                  >
                    {index < 3 ? (
                      <FontAwesomeIcon 
                        icon={faTrophy} 
                        className={`${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-gray-600' :
                          'text-orange-600'
                        }`}
                      />
                    ) : (
                      <span className="font-bold text-yellow-600">#{index + 1}</span>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">
                        {entry.username === 'Anonymous Chef' && entry.userId === user?.uid ? (
                          <span className="text-gray-400">Set your username</span>
                        ) : (
                          entry.username
                        )}
                      </div>
                      {entry.userId === user?.uid && entry.username === 'Anonymous Chef' && (
                        <Link 
                          href="/settings"
                          className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
                        >
                          <FontAwesomeIcon icon={faGear} className="text-xs" />
                          <span>Set Username</span>
                        </Link>
                      )}
                      {entry.userId === user?.uid && entry.username !== 'Anonymous Chef' && (
                        <div className="text-xs text-yellow-600">That's you!</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faSpoon} className="text-yellow-600 mr-2" />
                  <span className="font-bold">{entry.totalPoints.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No spoon points recorded yet. Start interacting with recipes to earn points!
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Points History</h2>
        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {userData?.transactions && userData.transactions.length > 0 ? (
            userData.transactions
              .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime())
              .map((transaction, index) => renderTransaction(transaction, index))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No points history yet. Start interacting with recipes to earn points!
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SpoonStats; 