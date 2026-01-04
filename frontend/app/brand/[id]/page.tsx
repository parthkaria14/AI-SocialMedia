'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBrand, generateContent, getBrandAnalytics, syncBrand, getBrandPosts } from '@/lib/api';
import { RefreshCw, Sparkles, Calendar, Target, Activity, CheckCircle, Lightbulb, X, Eye } from 'lucide-react';
import Link from 'next/link';
import BrandNavBar from '@/components/BrandNavBar';

export default function BrandDetailPage() {
    const params = useParams();
    const router = useRouter();
    const brandId = parseInt(params.id as string);

    const [brand, setBrand] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [contentIdeas, setContentIdeas] = useState<any[]>([]);
    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [generatingContent, setGeneratingContent] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'content'>('overview');

    useEffect(() => {
        loadBrandData();
    }, [brandId]);

    const loadBrandData = async () => {
        try {
            const [brandData, analyticsData, postsData] = await Promise.all([
                getBrand(brandId),
                getBrandAnalytics(brandId).catch(() => null),
                getBrandPosts(brandId).catch(() => []),
            ]);
            setBrand(brandData);
            setAnalytics(analyticsData);
            setSavedPosts(postsData || []);
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
            {/* Shared Navigation Bar */}
            <BrandNavBar brandId={brandId} brandName={brand.brand?.name} />

            {/* Action Bar */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-600">@{brand.brand?.instagram_handle}</p>
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
            </div>

            {/* Sub-tabs for Overview/Content */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-3 border-b-2 font-medium text-sm transition ${activeTab === 'overview'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Profile Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`py-3 border-b-2 font-medium text-sm transition ${activeTab === 'content'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Content Ideas
                        </button>
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
                    <div className="space-y-8">
                        {/* Saved Posts Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Your Posts</h2>
                                <Link
                                    href={`/brand/${brandId}/create`}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                >
                                    + Create New Post
                                </Link>
                            </div>

                            {savedPosts.length === 0 ? (
                                <div className="bg-white rounded-lg shadow p-8 text-center">
                                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                                    <p className="text-gray-600 text-sm">
                                        Create your first post to see it here
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {savedPosts.map((post: any) => (
                                        <div key={post.id} className="bg-white rounded-lg shadow overflow-hidden group hover:shadow-lg transition">
                                            {/* Post Image */}
                                            {post.media_urls && post.media_urls.length > 0 ? (
                                                <div className="aspect-square bg-gray-100 relative">
                                                    <img
                                                        src={post.media_urls[0]}
                                                        alt="Post image"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Status Badge */}
                                                    <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-medium ${post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                                        post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                            post.status === 'posted' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {post.status}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                                                    <Calendar className="w-16 h-16 text-gray-400" />
                                                    {/* Status Badge */}
                                                    <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-medium ${post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                                        post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                                            post.status === 'posted' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {post.status}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Post Details */}
                                            <div className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs text-gray-500 capitalize">{post.platform}</span>
                                                    <span className="text-xs text-gray-300">•</span>
                                                    <span className="text-xs text-gray-500 capitalize">{post.content_type}</span>
                                                </div>

                                                <p className="text-gray-900 text-sm line-clamp-3 mb-3">
                                                    {post.caption || 'No caption'}
                                                </p>

                                                {/* Hashtags */}
                                                {post.hashtags && post.hashtags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {post.hashtags.slice(0, 3).map((tag: string, i: number) => (
                                                            <span key={i} className="text-xs text-blue-600">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                        {post.hashtags.length > 3 && (
                                                            <span className="text-xs text-gray-400">
                                                                +{post.hashtags.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Scheduled Time */}
                                                {post.scheduled_time && (
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(post.scheduled_time).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* AI Content Ideas Section */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">AI Content Ideas</h2>
                            {contentIdeas.length === 0 ? (
                                <div className="bg-white rounded-lg shadow p-8 text-center">
                                    <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Ideas Yet</h3>
                                    <p className="text-gray-600 text-sm mb-4">
                                        Click &quot;Generate Content&quot; to create AI-powered content ideas
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {contentIdeas.map((idea, idx) => (
                                        <div key={idx} className="bg-white rounded-lg shadow p-6">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {idea.title}
                                                </h3>
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${idea.content_type === 'image' ? 'bg-blue-100 text-blue-800' :
                                                    idea.content_type === 'carousel' ? 'bg-purple-100 text-purple-800' :
                                                        idea.content_type === 'video' || idea.content_type === 'reel' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {idea.content_type}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 mb-4">{idea.description}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-wrap gap-1">
                                                    {idea.hashtag_suggestions?.slice(0, 3).map((tag: string, i: number) => (
                                                        <span key={i} className="text-xs text-blue-600">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <Link
                                                    href={{
                                                        pathname: `/brand/${brandId}/create`,
                                                        query: {
                                                            title: idea.title,
                                                            description: idea.description,
                                                            contentType: idea.content_type,
                                                            captionHook: idea.caption_hook,
                                                            hashtags: JSON.stringify(idea.hashtag_suggestions || [])
                                                        }
                                                    }}
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
                    </div>
                )}
            </main>
        </div>
    );
}