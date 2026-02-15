import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpoon, faTrophy, faGear } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
}

interface LeaderboardListProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: string;
}

export const LeaderboardList: React.FC<LeaderboardListProps> = ({ leaderboard, currentUserId }) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-amber-100 p-6 mb-8 shadow-amber-900/5">
      <h2 className="text-xl font-semibold mb-6">Global Leaderboard</h2>
      <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {leaderboard.length > 0 ? (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className="flex items-center justify-between p-4 rounded-xl bg-amber-50/50 hover:bg-amber-50 transition-colors"
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
                        className={`${index === 0 ? 'text-yellow-600' :
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
                        {entry.username === 'Anonymous Chef' && entry.userId === currentUserId ? (
                          <span className="text-gray-400">Set your username</span>
                        ) : entry.username === 'Anonymous Chef' ? (
                          <span>{entry.username}</span>
                        ) : (
                          <Link 
                            href={`/${entry.username}`}
                            className="hover:text-amber-600 transition-colors"
                          >
                            {entry.username}
                          </Link>
                        )}
                      </div>
                      {entry.userId === currentUserId && entry.username === 'Anonymous Chef' && (
                        <Link
                          href="/settings"
                          className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition-colors"
                        >
                          <FontAwesomeIcon icon={faGear} className="text-xs" />
                          <span>Set Username</span>
                        </Link>
                      )}
                      {entry.userId === currentUserId && entry.username !== 'Anonymous Chef' && (
                        <div className="text-xs text-amber-600">That's you!</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faSpoon} className="text-amber-600 mr-2" />
                  <span className="font-bold">{entry.totalPoints.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-amber-800/70 py-8">
            No spoon points recorded yet. Start interacting with recipes to earn points!
          </div>
        )}
      </div>
    </div>
  );
}; 