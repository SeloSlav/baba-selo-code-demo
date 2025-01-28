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

interface SpoonPoints {
  date: string;
  points: number;
}

interface UserSpoonData {
  totalPoints: number;
  pointsHistory: SpoonPoints[];
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
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
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
        // Get user's spoon data
        const userSpoonRef = doc(db, 'spoonPoints', user.uid);
        const userSpoonDoc = await getDoc(userSpoonRef);

        if (!userSpoonDoc.exists()) {
          // Initialize with empty data for new users
          const initialData = {
            totalPoints: 0,
            pointsHistory: [],
            username: 'Anonymous Chef'
          };
          await setDoc(userSpoonRef, initialData);
          setUserData(initialData);
        } else {
          setUserData(userSpoonDoc.data() as UserSpoonData);
        }

        // Fetch leaderboard
        await fetchLeaderboard();
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching spoon stats:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Function to aggregate data based on time range
  const aggregateDataByTimeRange = (data: SpoonPoints[]) => {
    if (!data.length) return [];
    
    const aggregated = new Map<string, number>();
    
    data.forEach(point => {
      const date = new Date(point.date);
      let key: string;
      
      switch (timeRange) {
        case 'weekly':
          // Get the Monday of the week
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(date.setDate(diff));
          key = monday.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case 'yearly':
          key = `${date.getFullYear()}-01-01`;
          break;
        default: // daily
          key = point.date;
      }
      
      aggregated.set(key, (aggregated.get(key) || 0) + point.points);
    });
    
    return Array.from(aggregated.entries())
      .map(([date, points]) => ({ date, points }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Chart configuration
  const chartData = {
    datasets: [
      {
        label: timeRange === 'daily' ? 'Daily Points' :
               timeRange === 'weekly' ? 'Weekly Points' :
               timeRange === 'monthly' ? 'Monthly Points' : 'Yearly Points',
        data: aggregateDataByTimeRange(userData?.pointsHistory || []).map(point => ({
          x: point.date,
          y: point.points,
        })),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: timeRange === 'daily' ? 'day' as const :
                timeRange === 'weekly' ? 'week' as const :
                timeRange === 'monthly' ? 'month' as const : 'year' as const,
          displayFormats: {
            day: 'MMM d',
            week: 'MMM d',
            month: 'MMM yyyy',
            year: 'yyyy'
          },
        },
        title: {
          display: true,
          text: 'Date',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: timeRange === 'daily' ? 'Daily Points' :
                timeRange === 'weekly' ? 'Points per Week' :
                timeRange === 'monthly' ? 'Points per Month' : 'Points per Year',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Points Over Time`,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const date = new Date(context[0].raw.x);
            switch (timeRange) {
              case 'weekly':
                return `Week of ${date.toLocaleDateString()}`;
              case 'monthly':
                return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
              case 'yearly':
                return date.getFullYear().toString();
              default:
                return date.toLocaleDateString();
            }
          },
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw.y}`;
          }
        }
      }
    },
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
      {/* Header with total points */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
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
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-600">{userData?.totalPoints || 0}</div>
            <div className="text-gray-600">Total Points</div>
          </div>
        </div>
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
                <li>Uploading your own recipe photos (25 points)</li>
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
          </div>
        )}
      </div>

      {/* Chart section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">Points History</h2>
          <div className="flex flex-wrap gap-2">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  timeRange === range
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px] sm:h-[400px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Leaderboard section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
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
    </div>
  );
};

export default SpoonStats; 