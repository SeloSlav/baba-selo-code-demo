import React, { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Chart } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
);

interface MusicEvent {
    timestamp: Date;
    eventType: string;
    songId: string;
    songTitle: string;
    duration?: number;
    context: {
        timeOfDay: number;
        dayOfWeek: number;
        hasActiveCats: boolean;
        activeFood: number;
        activeToys: number;
    };
}

interface SongStats {
    songId: string;
    totalPlays: number;
    totalStops: number;
    totalPlayDuration: number;
    averagePlayDuration: number;
    lastPlayed: Date;
}

interface MusicAnalytics {
    userId: string;
    lastUpdated: Date;
    events: MusicEvent[];
    songStats: Record<string, SongStats>;
}

export const MusicAnalytics: React.FC = () => {
    const [analytics, setAnalytics] = useState<MusicAnalytics[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const analyticsRef = collection(db, 'musicAnalytics');
                const analyticsSnap = await getDocs(analyticsRef);
                const data = analyticsSnap.docs.map(doc => ({
                    userId: doc.id,
                    lastUpdated: doc.data().lastUpdated.toDate(),
                    events: doc.data().events.map((event: any) => ({
                        ...event,
                        timestamp: event.timestamp.toDate()
                    })),
                    songStats: Object.entries(doc.data().songStats || {}).reduce((acc, [songId, stats]: [string, any]) => ({
                        ...acc,
                        [songId]: {
                            ...stats,
                            lastPlayed: stats.lastPlayed?.toDate() || null
                        }
                    }), {})
                } as MusicAnalytics));
                setAnalytics(data);
            } catch (error) {
                console.error('Error fetching music analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const calculateSongMetrics = (events: MusicEvent[], stats: SongStats) => {
        const songEvents = events.filter(e => e.songId === stats.songId);
        const totalEvents = songEvents.length;
        
        // Calculate retention metrics
        const uniqueDays = new Set(songEvents.map(e => 
            new Date(e.timestamp).toDateString()
        )).size;

        const averageListensPerDay = totalEvents / uniqueDays || 0;

        // Calculate skip rate (stops before 1 minute)
        const earlyStops = songEvents.filter(e => 
            e.eventType === 'music_off' && e.duration && e.duration < 60
        ).length;
        const skipRate = (earlyStops / stats.totalStops) * 100;

        // Calculate peak listening hours
        const hourCounts = new Array(24).fill(0);
        songEvents.forEach(e => hourCounts[e.context.timeOfDay]++);
        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

        // Calculate cat interaction quality
        const withCatsEvents = songEvents.filter(e => e.context.hasActiveCats);
        const avgCatPlayDuration = withCatsEvents.reduce((sum, e) => 
            sum + (e.duration || 0), 0) / withCatsEvents.length || 0;

        return {
            averageListensPerDay,
            skipRate,
            peakHour,
            avgCatPlayDuration: avgCatPlayDuration / 60, // convert to minutes
            uniqueDays,
            withCatsPercentage: (withCatsEvents.length / totalEvents * 100) || 0,
            avgToys: songEvents.reduce((sum, e) => sum + e.context.activeToys, 0) / totalEvents || 0,
            avgFood: songEvents.reduce((sum, e) => sum + e.context.activeFood, 0) / totalEvents || 0
        };
    };

    const generateTimeOfDayChart = (data: MusicAnalytics[]) => {
        // Get total plays across all songs for each hour
        const totalPlaysByHour = new Array(24).fill(0);
        const songHourCounts: Record<string, number[]> = {};

        // Initialize counts for each song
        data.forEach(userAnalytics => {
            userAnalytics.events.forEach(event => {
                if (event.eventType === 'music_on') {
                    if (!songHourCounts[event.songId]) {
                        songHourCounts[event.songId] = new Array(24).fill(0);
                    }
                    songHourCounts[event.songId][event.context.timeOfDay]++;
                    totalPlaysByHour[event.context.timeOfDay]++;
                }
            });
        });

        // Sort the songs to put Stray Cat Serenade first
        const sortedSongs = Object.entries(songHourCounts).sort(([idA], [idB]) => {
            return idA === 'stray_cat_serenade' ? -1 : 1;
        });
        
        const datasets = sortedSongs.map(([songId, counts], index) => ({
            label: data[0]?.events.find(e => e.songId === songId)?.songTitle || songId,
            data: counts.map((count, hour) => 
                totalPlaysByHour[hour] > 0 ? (count / totalPlaysByHour[hour]) * 100 : 0
            ),
            backgroundColor: `hsla(${index === 0 ? 137.5 : 0}, 70%, 50%, 0.5)`,
            borderColor: `hsla(${index === 0 ? 137.5 : 0}, 70%, 50%, 1)`,
            borderWidth: 1
        }));

        return {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets
        };
    };

    if (isLoading) {
        return (
            <div className="p-6 text-center text-gray-500">
                Loading music analytics...
            </div>
        );
    }

    const timeOfDayData = generateTimeOfDayChart(analytics);

    return (
        <div className="p-6 space-y-6">
            {/* Song Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(analytics[0]?.songStats || {}).map(([songId, stats]) => {
                    const songTitle = analytics[0]?.events.find(e => e.songId === songId)?.songTitle || songId;
                    const metrics = calculateSongMetrics(analytics[0].events, { ...stats, songId });
                    
                    // Calculate color based on song index (same as chart)
                    const colorHue = songId === 'stray_cat_serenade_2' ? '0' : '137.5';
                    const titleColor = `hsla(${colorHue}, 70%, 50%, 1)`;
                    
                    return (
                        <div key={songId} className="bg-white rounded-2xl shadow-sm p-6">
                            <h4 className="font-medium mb-4 text-lg" style={{ color: titleColor }}>{songTitle}</h4>
                            
                            {/* Basic Stats */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-600">Total Plays</div>
                                    <div className="font-medium text-gray-900">{stats.totalPlays}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Days Active</div>
                                    <div className="font-medium text-gray-900">{metrics.uniqueDays}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Avg. Plays/Day</div>
                                    <div className="font-medium text-gray-900">
                                        {metrics.averageListensPerDay.toFixed(1)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Skip Rate</div>
                                    <div className="font-medium text-gray-900">
                                        {metrics.skipRate.toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            {/* Engagement Metrics */}
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                                <div>
                                    <div className="text-gray-600 text-sm mb-2">Duration & Timing</div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-gray-500">Avg. Duration</div>
                                            <div className="font-medium text-gray-900">
                                                {(stats.totalPlayDuration / stats.totalPlays / 60).toFixed(1)} min
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500">Peak Hour</div>
                                            <div className="font-medium text-gray-900">
                                                {metrics.peakHour}:00
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Cat Interaction Metrics */}
                                <div>
                                    <div className="text-gray-600 text-sm mb-2">Cat Interactions</div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-gray-500">With Cats Present</div>
                                            <div className="font-medium text-gray-900">
                                                {metrics.withCatsPercentage.toFixed(1)}%
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500">Avg. Duration with Cats</div>
                                            <div className="font-medium text-gray-900">
                                                {metrics.avgCatPlayDuration.toFixed(1)} min
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500">Avg. Active Toys</div>
                                            <div className="font-medium text-gray-900">
                                                {metrics.avgToys.toFixed(1)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500">Avg. Active Food</div>
                                            <div className="font-medium text-gray-900">
                                                {metrics.avgFood.toFixed(1)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-amber-50 rounded-xl p-4 mt-4">
                                    <div className="text-amber-800 text-sm">
                                        <strong>Key Insights:</strong>
                                        <ul className="mt-2 space-y-1">
                                            <li>• {metrics.skipRate > 30 ? 'High' : 'Low'} skip rate ({metrics.skipRate.toFixed(1)}%) suggests {metrics.skipRate > 30 ? 'potential issues with' : 'good'} user retention</li>
                                            <li>• Most effective at {metrics.peakHour}:00 with {metrics.withCatsPercentage.toFixed(1)}% cat presence</li>
                                            <li>• Average session {metrics.avgCatPlayDuration > 3 ? 'extends to' : 'limited to'} {metrics.avgCatPlayDuration.toFixed(1)} minutes with cats present</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time of Day Chart */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Popular Listening Times</h3>
                <div className="h-[400px]">
                    <Chart
                        type="bar"
                        data={timeOfDayData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: '% of Total Plays per Hour'
                                    },
                                    max: 100
                                }
                            },
                            plugins: {
                                legend: {
                                    position: 'top',
                                    labels: {
                                        usePointStyle: true,
                                        padding: 20
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: (context) => {
                                            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}% of plays at ${context.label}`;
                                        }
                                    }
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default MusicAnalytics; 