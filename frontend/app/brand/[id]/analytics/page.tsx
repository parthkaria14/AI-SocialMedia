'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getBrand, getChartData } from '@/lib/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import BrandNavBar from '@/components/BrandNavBar';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AnalyticsPage() {
    const params = useParams();
    const brandId = parseInt(params.id as string);

    const [brand, setBrand] = useState<any>(null);
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(30);

    useEffect(() => {
        loadData();
    }, [brandId, timeRange]);

    const loadData = async () => {
        try {
            const [brandData, analytics] = await Promise.all([
                getBrand(brandId),
                getChartData(brandId, timeRange),
            ]);
            setBrand(brandData);
            setChartData(analytics);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const engagementData = chartData?.engagement_over_time || [];
    const contentPerformance = chartData?.content_performance || [];
    const platformBreakdown = chartData?.platform_breakdown || {};

    // Calculate trends
    const calculateTrend = (data: any[]) => {
        if (data.length < 2) return 0;
        const recent = data.slice(-7).reduce((sum, d) => sum + d.engagement_rate, 0) / 7;
        const previous = data.slice(-14, -7).reduce((sum, d) => sum + d.engagement_rate, 0) / 7;
        return ((recent - previous) / previous * 100).toFixed(1);
    };

    const trend = engagementData.length > 0 ? calculateTrend(engagementData) : 0;

    // Platform data for pie chart
    const platformData = Object.entries(platformBreakdown).map(([platform, stats]: [string, any]) => ({
        name: platform,
        value: stats.total_posts,
        engagement: stats.avg_engagement,
    }));

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Shared Navigation Bar */}
            <BrandNavBar brandId={brandId} brandName={brand?.brand?.name} />

            {/* Time Range Selector */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h2>
                        <div className="flex gap-2">
                            {[7, 30, 90].map((days) => (
                                <button
                                    key={days}
                                    onClick={() => setTimeRange(days)}
                                    className={`px-4 py-2 rounded-lg text-sm transition ${timeRange === days
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {days} days
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">Avg Engagement</p>
                        <div className="flex items-end justify-between">
                            <p className="text-3xl font-bold text-gray-900">
                                {engagementData.length > 0
                                    ? (engagementData.reduce((sum: number, d: any) => sum + d.engagement_rate, 0) / engagementData.length).toFixed(2)
                                    : '0.00'}%
                            </p>
                            {trend !== 0 && (
                                <div className={`flex items-center gap-1 text-sm ${Number(trend) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {Number(trend) > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    {Math.abs(Number(trend))}%
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">Total Likes</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {engagementData.reduce((sum: number, d: any) => sum + d.likes, 0).toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">Total Comments</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {engagementData.reduce((sum: number, d: any) => sum + d.comments, 0).toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">Posts Analyzed</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {engagementData.length}
                        </p>
                    </div>
                </div>

                {/* Engagement Over Time Chart */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Engagement Over Time</h2>
                    {engagementData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={engagementData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="engagement_rate" stroke="#3B82F6" strokeWidth={2} name="Engagement Rate %" />
                                <Line type="monotone" dataKey="likes" stroke="#10B981" strokeWidth={2} name="Likes" />
                                <Line type="monotone" dataKey="comments" stroke="#F59E0B" strokeWidth={2} name="Comments" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-gray-600 py-12">No data available for selected time range</p>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Top Performing Content */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performing Content</h2>
                        {contentPerformance.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={contentPerformance.slice(0, 5)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="caption" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="engagement_rate" fill="#3B82F6" name="Engagement Rate %" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-gray-600 py-12">No content performance data</p>
                        )}
                    </div>

                    {/* Platform Breakdown */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Distribution</h2>
                        {platformData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={platformData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {platformData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-gray-600 py-12">No platform data</p>
                        )}
                    </div>
                </div>

                {/* Content Performance Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Content Performance Details</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-y">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caption</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Engagement</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Comments</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {contentPerformance.slice(0, 10).map((post: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">{post.caption}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                                {post.platform}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">{post.engagement_rate}%</td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-900">{post.likes.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-900">{post.comments.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}