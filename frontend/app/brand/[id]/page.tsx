'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBrand, generateContent, getBrandAnalytics, syncBrand, getBrandPosts, getBrandCampaigns, createCampaign, updateCampaignStatus, deleteCampaign, analyzeCampaign, generateCampaignStrategy } from '@/lib/api';
import { RefreshCw, Sparkles, Calendar, Instagram, Rocket, Plus, Target, TrendingUp, Activity, Play, Pause, CheckCircle, Trash2, Lightbulb, X, Eye } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'campaigns'>('overview');
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        loadBrandData();
    }, [brandId]);

    const loadBrandData = async () => {
        try {
            const [brandData, analyticsData, postsData, campaignsData] = await Promise.all([
                getBrand(brandId),
                getBrandAnalytics(brandId).catch(() => null),
                getBrandPosts(brandId).catch(() => []),
                getBrandCampaigns(brandId).catch(() => []),
            ]);
            setBrand(brandData);
            setAnalytics(analyticsData);
            setSavedPosts(postsData || []);
            setCampaigns(campaignsData || []);
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

            {/* Sub-tabs for Overview/Content/Campaigns */}
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
                        <button
                            onClick={() => setActiveTab('campaigns')}
                            className={`py-3 border-b-2 font-medium text-sm transition ${activeTab === 'campaigns'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Campaigns
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

                {activeTab === 'campaigns' && (
                    <div className="space-y-6">
                        {/* Campaign Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg shadow p-4">
                                <p className="text-sm text-gray-600">Total Campaigns</p>
                                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <p className="text-sm text-gray-600">Active</p>
                                <p className="text-2xl font-bold text-green-600">{campaigns.filter(c => c.status === 'active').length}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <p className="text-sm text-gray-600">Total Budget</p>
                                <p className="text-2xl font-bold text-gray-900">${campaigns.reduce((sum, c) => sum + (c.budget || 0), 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <p className="text-sm text-gray-600">Total Spent</p>
                                <p className="text-2xl font-bold text-orange-600">${campaigns.reduce((sum, c) => sum + (c.spent || 0), 0).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Header with Create Button */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Your Campaigns</h2>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                <Plus className="w-4 h-4" />
                                Create Campaign
                            </button>
                        </div>

                        {/* Campaigns List */}
                        {campaigns.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <Rocket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Campaigns Yet</h3>
                                <p className="text-gray-600 mb-4">Create your first campaign to start reaching your audience</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Create Your First Campaign
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {campaigns.map((campaign) => (
                                    <div key={campaign.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-bold text-gray-900">{campaign.name}</h3>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                                            campaign.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                                'bg-blue-100 text-blue-800'
                                                        }`}>{campaign.status}</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${campaign.campaign_type === 'paid' ? 'bg-purple-100 text-purple-800' :
                                                        campaign.campaign_type === 'organic' ? 'bg-emerald-100 text-emerald-800' :
                                                            'bg-orange-100 text-orange-800'
                                                        }`}>{campaign.campaign_type}</span>
                                                </div>
                                                <p className="text-gray-600 text-sm">{campaign.description}</p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <div className="text-sm text-gray-500">Budget</div>
                                                <div className="text-xl font-bold text-gray-900">${campaign.budget?.toLocaleString()}</div>
                                            </div>
                                        </div>

                                        {/* Campaign Details */}
                                        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Target className="w-4 h-4 text-blue-500" />
                                                <span className="text-gray-600">{campaign.objectives?.slice(0, 2).join(', ') || 'Not set'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-purple-500" />
                                                <span className="text-gray-600 capitalize">{campaign.platforms?.slice(0, 2).join(', ') || 'Not set'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-green-500" />
                                                <span className="text-gray-600">
                                                    {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'Not started'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => { setSelectedCampaign(campaign); setShowDetailModal(true); }}
                                                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </button>

                                            {campaign.status === 'draft' && (
                                                <button
                                                    onClick={async () => { await updateCampaignStatus(campaign.id, 'active'); loadBrandData(); }}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    Activate
                                                </button>
                                            )}

                                            {campaign.status === 'active' && (
                                                <>
                                                    <button
                                                        onClick={async () => { await updateCampaignStatus(campaign.id, 'paused'); loadBrandData(); }}
                                                        className="flex items-center gap-2 px-3 py-2 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition"
                                                    >
                                                        <Pause className="w-4 h-4" />
                                                        Pause
                                                    </button>
                                                    <button
                                                        onClick={async () => { await updateCampaignStatus(campaign.id, 'completed'); loadBrandData(); }}
                                                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Complete
                                                    </button>
                                                </>
                                            )}

                                            {campaign.status === 'paused' && (
                                                <button
                                                    onClick={async () => { await updateCampaignStatus(campaign.id, 'active'); loadBrandData(); }}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    Resume
                                                </button>
                                            )}

                                            <div className="flex-1"></div>

                                            <button
                                                onClick={async () => {
                                                    if (confirm('Are you sure you want to delete this campaign?')) {
                                                        await deleteCampaign(campaign.id);
                                                        loadBrandData();
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Create Campaign Modal */}
            {showCreateModal && (
                <CreateCampaignModal
                    brandId={brandId}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { setShowCreateModal(false); loadBrandData(); }}
                />
            )}
        </div>
    );
}

// Create Campaign Modal Component
function CreateCampaignModal({ brandId, onClose, onSuccess }: { brandId: number; onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        campaign_type: 'organic',
        platforms: [] as string[],
        objectives: [] as string[],
        budget: 0,
        start_date: '',
        end_date: ''
    });
    const [loading, setLoading] = useState(false);

    const platformOptions = ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'Google Ads', 'TikTok'];
    const objectiveOptions = ['Brand Awareness', 'Engagement', 'Conversions', 'Traffic', 'Leads'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createCampaign({ brand_id: brandId, ...formData });
            onSuccess();
        } catch (error) {
            alert('Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Create Campaign</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Summer 2024 Launch"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={2}
                            placeholder="Describe your campaign..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Type *</label>
                        <div className="flex gap-2">
                            {['organic', 'paid', 'mixed'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, campaign_type: type })}
                                    className={`flex-1 px-4 py-2 rounded-lg capitalize ${formData.campaign_type === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >{type}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Platforms *</label>
                        <div className="flex flex-wrap gap-2">
                            {platformOptions.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, platforms: formData.platforms.includes(p) ? formData.platforms.filter(x => x !== p) : [...formData.platforms, p] })}
                                    className={`px-3 py-1.5 rounded-lg text-sm ${formData.platforms.includes(p) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >{p}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Objectives *</label>
                        <div className="flex flex-wrap gap-2">
                            {objectiveOptions.map((o) => (
                                <button
                                    key={o}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, objectives: formData.objectives.includes(o) ? formData.objectives.filter(x => x !== o) : [...formData.objectives, o] })}
                                    className={`px-3 py-1.5 rounded-lg text-sm ${formData.objectives.includes(o) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >{o}</button>
                            ))}
                        </div>
                    </div>
                    {formData.campaign_type !== 'organic' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                            <input
                                type="number"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                            />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading || !formData.name || formData.platforms.length === 0} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Creating...' : 'Create Campaign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}