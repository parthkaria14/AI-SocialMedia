'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBrand, generateContent, getBrandAnalytics, syncBrand, getBrandPosts } from '@/lib/api';
import { RefreshCw, Sparkles, Calendar, Target, Activity, CheckCircle, Lightbulb, Plus, ArrowRight, Zap, Image, Video, Layout } from 'lucide-react';
import Link from 'next/link';
import BrandNavBar from '@/components/BrandNavBar';
import { RingLoader, InlineLoader, AILoader } from '@/components/Loaders';

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
            <div className="min-h-screen flex flex-col items-center justify-center gap-6">
                <RingLoader size={56} />
                <div className="text-center">
                    <p className="text-[var(--text-secondary)] text-sm">Loading brand...</p>
                    <div className="w-48 mt-4">
                        <div className="loader-wave" />
                    </div>
                </div>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center animate-fadeIn">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                        <Target className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Brand Not Found</h2>
                    <Link href="/" className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-2">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const brandProfile = brand.brand?.brand_profile;

    const contentTypeIcon = (type: string) => {
        switch (type) {
            case 'carousel': return <Layout className="w-4 h-4" />;
            case 'video': case 'reel': return <Video className="w-4 h-4" />;
            default: return <Image className="w-4 h-4" />;
        }
    };

    return (
        <div className="min-h-screen">
            {/* Shared Navigation Bar */}
            <BrandNavBar brandId={brandId} brandName={brand.brand?.name} />

            {/* Action Bar */}
            <div className="glass-card border-x-0 border-t-0 rounded-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-400">@{brand.brand?.instagram_handle}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="group flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 transition-all disabled:opacity-50"
                            >
                                {syncing ? (
                                    <InlineLoader text="Syncing" />
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4 text-gray-400 group-hover:text-white" />
                                        <span className="text-gray-300">Sync</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleGenerateContent}
                                disabled={generatingContent || !brandProfile}
                                className="group flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 font-medium"
                            >
                                {generatingContent ? (
                                    <InlineLoader text="Generating" />
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Generate Content
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub-tabs for Overview/Content */}
            <div className="border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`relative py-4 px-6 font-medium text-sm transition-all ${activeTab === 'overview'
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            Profile Overview
                            {activeTab === 'overview' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`relative py-4 px-6 font-medium text-sm transition-all ${activeTab === 'content'
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            Content Ideas
                            {activeTab === 'content' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-fadeIn">
                        {!brandProfile ? (
                            <div className="glass-card p-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center animate-pulse">
                                    <Activity className="w-8 h-8 text-yellow-400" />
                                </div>
                                <p className="text-yellow-400 font-medium mb-2">
                                    Brand analysis in progress...
                                </p>
                                <p className="text-gray-400 text-sm mb-4">This usually takes 1-2 minutes.</p>
                                <button
                                    onClick={() => loadBrandData()}
                                    className="text-purple-400 hover:text-purple-300 font-medium text-sm"
                                >
                                    Refresh Status
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="glass-card p-6">
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                            <Target className="w-5 h-5 text-purple-400" />
                                        </div>
                                        Brand Profile
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <h3 className="font-medium text-gray-400 mb-2 text-sm">Brand Voice</h3>
                                            <p className="text-white text-lg capitalize">{brandProfile.brand_voice}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <h3 className="font-medium text-gray-400 mb-2 text-sm">Target Audience</h3>
                                            <p className="text-white">
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
                                        <div className="md:col-span-2 p-4 rounded-xl bg-white/5 border border-white/5">
                                            <h3 className="font-medium text-gray-400 mb-3 text-sm">Content Themes</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(() => {
                                                    const themes = brandProfile.content_themes;
                                                    if (Array.isArray(themes)) {
                                                        return themes.map((theme: string, idx: number) => (
                                                            <span
                                                                key={idx}
                                                                className="badge badge-purple"
                                                            >
                                                                {theme}
                                                            </span>
                                                        ));
                                                    } else if (typeof themes === 'string') {
                                                        return (
                                                            <span className="badge badge-purple">
                                                                {themes}
                                                            </span>
                                                        );
                                                    }
                                                    return <span className="text-gray-500 text-sm">No themes available</span>;
                                                })()}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 p-4 rounded-xl bg-white/5 border border-white/5">
                                            <h3 className="font-medium text-gray-400 mb-3 text-sm">Content Pillars</h3>
                                            <ul className="space-y-2">
                                                {(() => {
                                                    const pillars = brandProfile.content_pillars;
                                                    if (Array.isArray(pillars)) {
                                                        return pillars.map((pillar: string, idx: number) => (
                                                            <li key={idx} className="flex items-start gap-3">
                                                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                                                <span className="text-gray-300">{pillar}</span>
                                                            </li>
                                                        ));
                                                    } else if (typeof pillars === 'string') {
                                                        return (
                                                            <li className="flex items-start gap-3">
                                                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                                                                <span className="text-gray-300">{pillars}</span>
                                                            </li>
                                                        );
                                                    }
                                                    return <li className="text-gray-500">No pillars defined</li>;
                                                })()}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card p-6">
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-blue-400" />
                                        </div>
                                        Recent Posts
                                    </h2>
                                    {brand.recent_posts?.length > 0 ? (
                                        <div className="space-y-3">
                                            {brand.recent_posts.slice(0, 5).map((post: any) => (
                                                <div key={post.id} className="p-4 rounded-xl bg-white/5 border-l-2 border-purple-500 hover:bg-white/[0.07] transition-colors">
                                                    <p className="text-gray-300 line-clamp-2">{post.caption?.slice(0, 100)}...</p>
                                                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                                        <span className="capitalize">{post.platform}</span>
                                                        <span>•</span>
                                                        <span className="capitalize">{post.status}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No posts yet</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-8 animate-fadeIn">
                        {/* Saved Posts Section */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Your Posts</h2>
                                <Link
                                    href={`/brand/${brandId}/create`}
                                    className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create New Post
                                </Link>
                            </div>

                            {savedPosts.length === 0 ? (
                                <div className="glass-card p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                        <Calendar className="w-8 h-8 text-purple-400 animate-float" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">No Posts Yet</h3>
                                    <p className="text-gray-400 text-sm">
                                        Create your first post to see it here
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {savedPosts.map((post: any, index: number) => (
                                        <div key={post.id} className="group glass-card overflow-hidden hover:border-white/15 transition-all duration-300 animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                                            {/* Post Image */}
                                            {post.media_urls && post.media_urls.length > 0 ? (
                                                <div className="aspect-square bg-gray-900 relative overflow-hidden">
                                                    <img
                                                        src={post.media_urls[0]}
                                                        alt="Post image"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <span className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-sm ${post.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                        post.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                            post.status === 'posted' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                                'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                        }`}>
                                                        {post.status}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="aspect-square bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center relative">
                                                    <Calendar className="w-16 h-16 text-gray-600" />
                                                    <span className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-full font-semibold ${post.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        post.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-green-500/20 text-green-400'
                                                        }`}>
                                                        {post.status}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Post Details */}
                                            <div className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs text-gray-500 capitalize">{post.platform}</span>
                                                    <span className="text-xs text-gray-600">•</span>
                                                    <span className="text-xs text-gray-500 capitalize">{post.content_type}</span>
                                                </div>

                                                <p className="text-gray-300 text-sm line-clamp-3 mb-3">
                                                    {post.caption || 'No caption'}
                                                </p>

                                                {/* Hashtags */}
                                                {post.hashtags && post.hashtags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {post.hashtags.slice(0, 3).map((tag: string, i: number) => (
                                                            <span key={i} className="text-xs text-purple-400">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                        {post.hashtags.length > 3 && (
                                                            <span className="text-xs text-gray-500">
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
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <Lightbulb className="w-5 h-5 text-yellow-400" />
                                AI Content Ideas
                            </h2>
                            {generatingContent ? (
                                <div className="glass-card p-8">
                                    <AILoader
                                        message="Generating content ideas"
                                        variant="content"
                                        steps={[
                                            'Analyzing brand profile',
                                            'Researching trends',
                                            'Creating unique ideas',
                                            'Optimizing for engagement'
                                        ]}
                                        currentStep={1}
                                    />
                                </div>
                            ) : contentIdeas.length === 0 ? (
                                <div className="glass-card p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-yellow-400 animate-float" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">No Content Ideas Yet</h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Click "Generate Content" to create AI-powered content ideas
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {contentIdeas.map((idea, idx) => (
                                        <div key={idx} className="glass-card p-6 hover:border-white/15 transition-all animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="text-lg font-bold text-white pr-4">
                                                    {idea.title}
                                                </h3>
                                                <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0 ${idea.content_type === 'image' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                    idea.content_type === 'carousel' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                                        idea.content_type === 'video' || idea.content_type === 'reel' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                    }`}>
                                                    {contentTypeIcon(idea.content_type)}
                                                    {idea.content_type}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 mb-4">{idea.description}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-wrap gap-1">
                                                    {idea.hashtag_suggestions?.slice(0, 3).map((tag: string, i: number) => (
                                                        <span key={i} className="text-xs text-purple-400">
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
                                                    className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-medium text-sm group"
                                                >
                                                    Create Post
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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