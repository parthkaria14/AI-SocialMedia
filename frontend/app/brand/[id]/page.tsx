'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBrand, generateContent, getBrandAnalytics, syncBrand } from '@/lib/api';
import { ArrowLeft, RefreshCw, Sparkles, BarChart3, Calendar, Instagram, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';

export default function BrandDetailPage() {
    const params = useParams();
    const router = useRouter();
    const brandId = parseInt(params.id as string);

    const [brand, setBrand] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [contentIdeas, setContentIdeas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [generatingContent, setGeneratingContent] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'analytics' | 'competitors'>('overview');

    useEffect(() => {
        loadBrandData();
    }, [brandId]);

    const loadBrandData = async () => {
        try {
            const [brandData, analyticsData] = await Promise.all([
                getBrand(brandId),
                getBrandAnalytics(brandId).catch(() => null),
            ]);
            setBrand(brandData);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Failed to load brand:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await syncBrand(brandId);
            alert('Sync started! This may take 1-2 minutes.');
            setTimeout(() => loadBrandData(), 60000);
        } catch (error) {
            alert('Failed to sync brand');
        } finally {
            setSyncing(false);
        }
    };

    const handleGenerateContent = async () => {
        setGeneratingContent(true);
        try {
            const result = await generateContent(brandId, 'instagram', 5);
            setContentIdeas(result.content_ideas);
            setActiveTab('content');
        } catch (error) {
            alert('Failed to generate content');
        } finally {
            setGeneratingContent(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading brand...</p>
                </div>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Brand Not Found</h2>
                    <Link href="/" className="text-blue-600 hover:text-blue-700">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const brandProfile = brand.brand?.brand_profile;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-gray-600 hover:text-gray-900">
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{brand.brand?.name}</h1>
                                <p className="text-gray-600">@{brand.brand?.instagram_handle}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Syncing...' : 'Sync'}
                            </button>
                            <button
                                onClick={handleGenerateContent}
                                disabled={generatingContent || !brandProfile}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                <Sparkles className="w-4 h-4" />
                                {generatingContent ? 'Generating...' : 'Generate Content'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-4 border-b-2 font-medium transition ${activeTab === 'overview'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Instagram className="w-4 h-4" />
                                Overview
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`py-4 border-b-2 font-medium transition ${activeTab === 'content'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Content
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`py-4 border-b-2 font-medium transition ${activeTab === 'analytics'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Analytics
                            </div>
                        </button>
                        <Link
                            href={`/brand/${brandId}/analytics`}
                            className="py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-900 font-medium transition"
                        >
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Full Analytics
                            </div>
                        </Link>
                        <Link
                            href={`/brand/${brandId}/competitors`}
                            className="py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-900 font-medium transition"
                        >
                            <div className="flex items-center gap-2">
                                <UsersIcon className="w-4 h-4" />
                                Competitors
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {!brandProfile ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                                <p className="text-yellow-800">
                                    Brand analysis in progress... This usually takes 1-2 minutes.
                                </p>
                                <button
                                    onClick={() => loadBrandData()}
                                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Refresh Status
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Brand Profile</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="font-semibold text-gray-700 mb-2">Brand Voice</h3>
                                            <p className="text-gray-900 capitalize">{brandProfile.brand_voice}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-700 mb-2">Target Audience</h3>
                                            <p className="text-gray-900">
                                                {(() => {
                                                    const audience = brandProfile.target_audience;
                                                    if (typeof audience === 'string') {
                                                        return audience;
                                                    } else if (audience && typeof audience === 'object') {
                                                        const demo = audience.demographics || '';
                                                        const interests = audience.interests || '';
                                                        return demo || interests || 'Various audiences';
                                                    }
                                                    return 'N/A';
                                                })()}
                                            </p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <h3 className="font-semibold text-gray-700 mb-2">Content Themes</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(() => {
                                                    const themes = brandProfile.content_themes;
                                                    if (Array.isArray(themes)) {
                                                        return themes.map((theme: string, idx: number) => (
                                                            <span
                                                                key={idx}
                                                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                                            >
                                                                {theme}
                                                            </span>
                                                        ));
                                                    } else if (typeof themes === 'string') {
                                                        return (
                                                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                                                {themes}
                                                            </span>
                                                        );
                                                    }
                                                    return <span className="text-gray-600 text-sm">No themes available</span>;
                                                })()}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <h3 className="font-semibold text-gray-700 mb-2">Content Pillars</h3>
                                            <ul className="list-disc list-inside space-y-1">
                                                {(() => {
                                                    const pillars = brandProfile.content_pillars;
                                                    if (Array.isArray(pillars)) {
                                                        return pillars.map((pillar: string, idx: number) => (
                                                            <li key={idx} className="text-gray-900">{pillar}</li>
                                                        ));
                                                    } else if (typeof pillars === 'string') {
                                                        return <li className="text-gray-900">{pillars}</li>;
                                                    }
                                                    return <li className="text-gray-600">No pillars defined</li>;
                                                })()}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Posts</h2>
                                    {brand.recent_posts?.length > 0 ? (
                                        <div className="space-y-4">
                                            {brand.recent_posts.slice(0, 5).map((post: any) => (
                                                <div key={post.id} className="border-l-4 border-blue-600 pl-4 py-2">
                                                    <p className="text-gray-900">{post.caption?.slice(0, 100)}...</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {post.platform} • {post.status}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-600">No posts yet</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-6">
                        {contentIdeas.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    No Content Ideas Yet
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Click "Generate Content" to create AI-powered content ideas
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {contentIdeas.map((idea, idx) => (
                                    <div key={idx} className="bg-white rounded-lg shadow p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {idea.title}
                                        </h3>
                                        <p className="text-gray-600 mb-4">{idea.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded">
                                                {idea.content_type}
                                            </span>
                                            <Link
                                                href={`/brand/${brandId}/create?idea=${idx}`}
                                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                            >
                                                Create Post →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {analytics?.summary && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-sm text-gray-600">Total Posts</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {analytics.summary.total_posts}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-sm text-gray-600">Avg Engagement</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {analytics.summary.avg_engagement_rate}%
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-sm text-gray-600">Total Likes</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {analytics.summary.total_likes.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-sm text-gray-600">Total Comments</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {analytics.summary.total_comments.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}
                        {!analytics && (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No analytics data available yet</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}