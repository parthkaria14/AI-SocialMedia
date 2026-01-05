'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { analyzeCompetitors, getTrendingContent } from '@/lib/api';
import { Users, TrendingUp, Target, Lightbulb, AlertTriangle } from 'lucide-react';
import BrandNavBar from '@/components/BrandNavBar';

export default function CompetitorAnalysisPage() {
    const params = useParams();
    const brandId = parseInt(params.id as string);

    const [competitorHandles, setCompetitorHandles] = useState<string[]>(['']);
    const [analysis, setAnalysis] = useState<any>(null);
    const [trending, setTrending] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'analysis' | 'trending'>('analysis');

    const addCompetitorField = () => {
        setCompetitorHandles([...competitorHandles, '']);
    };

    const updateCompetitor = (index: number, value: string) => {
        const updated = [...competitorHandles];
        updated[index] = value;
        setCompetitorHandles(updated);
    };

    const removeCompetitor = (index: number) => {
        setCompetitorHandles(competitorHandles.filter((_, i) => i !== index));
    };

    const handleAnalyze = async () => {
        const handles = competitorHandles.filter(h => h.trim() !== '');
        if (handles.length === 0) {
            alert('Please add at least one competitor');
            return;
        }

        setLoading(true);
        try {
            const result = await analyzeCompetitors(brandId, handles);
            setAnalysis(result);
            setActiveTab('analysis');
        } catch (error) {
            alert('Failed to analyze competitors');
        } finally {
            setLoading(false);
        }
    };

    const handleFindTrending = async () => {
        const handles = competitorHandles.filter(h => h.trim() !== '');
        if (handles.length === 0) {
            alert('Please add at least one competitor');
            return;
        }

        setLoading(true);
        try {
            const result = await getTrendingContent(handles);
            setTrending(result);
            setActiveTab('trending');
        } catch (error) {
            alert('Failed to get trending content');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Shared Navigation Bar */}
            <BrandNavBar brandId={brandId} />

            {/* Page Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Competitor Analysis</h2>
                    </div>
                    <p className="text-sm text-gray-600">Analyze competitors and identify opportunities</p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Input Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Add Competitors</h2>
                    <div className="space-y-3">
                        {competitorHandles.map((handle, index) => (
                            <div key={index} className="flex gap-3">
                                <div className="flex-1 flex items-center">
                                    <span className="bg-gray-100 px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                                        @
                                    </span>
                                    <input
                                        type="text"
                                        value={handle}
                                        onChange={(e) => updateCompetitor(index, e.target.value)}
                                        placeholder="competitor_handle"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                {competitorHandles.length > 1 && (
                                    <button
                                        onClick={() => removeCompetitor(index)}
                                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={addCompetitorField}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            + Add Another
                        </button>
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Analyzing...' : 'Analyze Competitors'}
                        </button>
                        <button
                            onClick={handleFindTrending}
                            disabled={loading}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Finding...' : 'Find Trending Content'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                {(analysis || trending) && (
                    <div className="bg-white border-b mb-8">
                        <div className="flex gap-8 px-6">
                            <button
                                onClick={() => setActiveTab('analysis')}
                                className={`py-4 border-b-2 font-medium transition ${activeTab === 'analysis'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Competitive Analysis
                            </button>
                            <button
                                onClick={() => setActiveTab('trending')}
                                className={`py-4 border-b-2 font-medium transition ${activeTab === 'trending'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Trending Content
                            </button>
                        </div>
                    </div>
                )}

                {/* Analysis Results */}
                {activeTab === 'analysis' && analysis && (
                    <div className="space-y-6">
                        {/* Metrics Comparison */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Metrics Comparison</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Your Brand</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {analysis.brand_metrics?.followers?.toLocaleString() || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Followers</p>
                                    <p className="text-lg font-semibold text-blue-600 mt-2">
                                        {analysis.brand_metrics?.engagement_rate?.toFixed(2) || 0}% Eng.
                                    </p>
                                </div>

                                {analysis.competitors?.slice(0, 2).map((comp: any, idx: number) => (
                                    <div key={idx} className="text-center p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">@{comp.handle}</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {comp.metrics?.followers?.toLocaleString() || 0}
                                        </p>
                                        <p className="text-sm text-gray-600">Followers</p>
                                        <p className="text-lg font-semibold text-gray-700 mt-2">
                                            {comp.metrics?.engagement_rate?.toFixed(2) || 0}% Eng.
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SWOT Analysis */}
                        {analysis.analysis && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Strengths */}
                                <div className="bg-white rounded-lg shadow p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        <h3 className="text-lg font-bold text-gray-900">Strengths</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {analysis.analysis.strengths?.map((item: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-green-600 mt-1">✓</span>
                                                <span className="text-gray-700">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Weaknesses */}
                                <div className="bg-white rounded-lg shadow p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                        <h3 className="text-lg font-bold text-gray-900">Weaknesses</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {analysis.analysis.weaknesses?.map((item: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-red-600 mt-1">✗</span>
                                                <span className="text-gray-700">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Opportunities */}
                                <div className="bg-white rounded-lg shadow p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Target className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-lg font-bold text-gray-900">Opportunities</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {analysis.analysis.opportunities?.map((item: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-blue-600 mt-1">→</span>
                                                <span className="text-gray-700">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Threats */}
                                <div className="bg-white rounded-lg shadow p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                                        <h3 className="text-lg font-bold text-gray-900">Threats</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {analysis.analysis.threats?.map((item: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-orange-600 mt-1">⚠</span>
                                                <span className="text-gray-700">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Recommendations */}
                        {analysis.analysis?.recommendations && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                                    <h3 className="text-lg font-bold text-gray-900">Strategic Recommendations</h3>
                                </div>
                                <div className="space-y-4">
                                    {analysis.analysis.recommendations.map((rec: any, idx: number) => (
                                        <div key={idx} className="border-l-4 border-blue-600 pl-4 py-2">
                                            <h4 className="font-semibold text-gray-900 capitalize mb-1">{rec.area}</h4>
                                            <p className="text-gray-700 mb-2">{rec.insight}</p>
                                            <p className="text-sm text-blue-600 font-medium">Action: {rec.action}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Trending Content Results */}
                {activeTab === 'trending' && trending && (
                    <div className="space-y-6">
                        {/* Trending Topics */}
                        {trending.trends && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Trending Topics</h3>
                                <div className="flex flex-wrap gap-2">
                                    {trending.trends.trending_topics?.map((topic: string, idx: number) => (
                                        <span key={idx} className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Performing Posts */}
                        {trending.top_posts && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performing Posts</h3>
                                <div className="space-y-4">
                                    {trending.top_posts.map((post: any, idx: number) => (
                                        <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="font-medium text-gray-900">Post #{idx + 1}</p>
                                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                                    {post.engagement_rate?.toFixed(2)}% engagement
                                                </span>
                                            </div>
                                            <p className="text-gray-700 mb-3">{post.caption?.slice(0, 150)}...</p>
                                            <div className="flex gap-4 text-sm text-gray-600">
                                                <span>❤️ {post.likes?.toLocaleString()}</span>
                                                <span>💬 {post.comments?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actionable Insights */}
                        {trending.trends?.actionable_insights && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Actionable Insights</h3>
                                <ul className="space-y-3">
                                    {trending.trends.actionable_insights.map((insight: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                                                {idx + 1}
                                            </span>
                                            <span className="text-gray-700 flex-1">{insight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}