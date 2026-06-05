'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBrand, generateContent, getBrandAnalytics, syncBrand, getBrandPosts, getBrandDNA, predictEngagement, compareClip } from '@/lib/api';
import { RefreshCw, Sparkles, Calendar, Target, Activity, CheckCircle, Lightbulb, Plus, ArrowRight, Zap, Image, Video, Layout, Wand2, FlaskConical, Brain, TrendingUp, Hash, Clock, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
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
    const [agentCollaboration, setAgentCollaboration] = useState<any>(null);
    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [generatingContent, setGeneratingContent] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'research'>('overview');

    // Research tab state
    const [brandDNA, setBrandDNA] = useState<any>(null);
    const [loadingDNA, setLoadingDNA] = useState(false);
    const [draftCaption, setDraftCaption] = useState('');
    const [draftHashtags, setDraftHashtags] = useState('');
    const [draftType, setDraftType] = useState('GraphImage');
    const [draftHour, setDraftHour] = useState(9);
    const [predicting, setPredicting] = useState(false);
    const [prediction, setPrediction] = useState<any>(null);

    // CLIP compare state
    const [clipIdea, setClipIdea] = useState('');
    const [clipDescription, setClipDescription] = useState('');
    const [comparing, setComparing] = useState(false);
    const [clipResult, setClipResult] = useState<any>(null);
    const [showPrompts, setShowPrompts] = useState(false);

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
            if (result.agent_collaboration) {
                setAgentCollaboration(result.agent_collaboration);
            }
            setActiveTab('content');
        } catch (error) {
            alert('Failed to generate content');
        } finally {
            setGeneratingContent(false);
        }
    };

    const handleLoadDNA = async () => {
        setLoadingDNA(true);
        try {
            const result = await getBrandDNA(brandId);
            setBrandDNA(result.brand_dna);
        } catch (error) {
            alert('Failed to load Brand-DNA. Sync the brand first.');
        } finally {
            setLoadingDNA(false);
        }
    };

    const handlePredict = async () => {
        setPredicting(true);
        setPrediction(null);
        try {
            const now = new Date();
            now.setHours(draftHour, 0, 0, 0);
            const tags = draftHashtags.split(',').map(t => t.trim().replace('#', '')).filter(Boolean);
            const result = await predictEngagement(brandId, {
                timestamp: now.toISOString(),
                caption: draftCaption,
                hashtags: tags,
                typename: draftType,
                mentions: [],
            }, true);
            setPrediction(result);
        } catch (error: any) {
            alert(error?.response?.data?.detail || 'Prediction failed. Sync the brand first.');
        } finally {
            setPredicting(false);
        }
    };

    const handleCompare = async () => {
        if (!clipIdea.trim()) return;
        setComparing(true);
        setClipResult(null);
        try {
            const result = await compareClip(brandId, clipIdea.trim(), clipDescription.trim());
            setClipResult(result);
        } catch (error: any) {
            alert(error?.response?.data?.detail || 'Comparison failed. Sync the brand first.');
        } finally {
            setComparing(false);
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
                        <button
                            onClick={() => { setActiveTab('research'); if (!brandDNA) handleLoadDNA(); }}
                            className={`relative py-4 px-6 font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'research'
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <FlaskConical className="w-4 h-4" />
                            Research
                            {activeTab === 'research' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-cyan-400" />
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
                                        <Link key={post.id} href={`/brand/${brandId}/post/${post.id}`} className="group glass-card overflow-hidden hover:border-white/15 transition-all duration-300 animate-fadeIn block cursor-pointer" style={{ animationDelay: `${index * 0.1}s` }}>
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
                                        </Link>
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
                                <div className="space-y-6">
                                    {/* Agent Collaboration Badge */}
                                    {agentCollaboration?.enriched && (
                                        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4 flex items-start gap-3 animate-fadeIn mb-6">
                                            <Wand2 className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="text-sm font-bold text-purple-400">Multi-Agent Enrichment Active</h4>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {agentCollaboration.enrichment_details || "These ideas were enhanced by competitor insights."}
                                                    <span className="block mt-1 text-xs text-gray-500 font-medium">
                                                        Agents involved: {agentCollaboration.agents_involved?.join(' + ')}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    )}
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
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'research' && (
                    <div className="space-y-6 animate-fadeIn">

                        {/* Header */}
                        <div className="glass-card p-6 border border-green-500/20 bg-gradient-to-r from-green-500/5 to-cyan-500/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-cyan-500/20 flex items-center justify-center">
                                    <FlaskConical className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Research Modules</h2>
                                    <p className="text-xs text-gray-500">Novel AI contributions — measurable before/after improvements</p>
                                </div>
                            </div>
                        </div>

                        {/* Brand DNA */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-cyan-400" />
                                    Module 1-A — Brand-DNA
                                </h3>
                                <button
                                    onClick={handleLoadDNA}
                                    disabled={loadingDNA}
                                    className="text-xs px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                                >
                                    {loadingDNA ? 'Extracting...' : 'Re-extract'}
                                </button>
                            </div>

                            {loadingDNA && (
                                <div className="text-center py-8 text-gray-500 text-sm">Extracting brand aesthetic identity from scraped posts...</div>
                            )}

                            {brandDNA && !loadingDNA && (
                                <div className="space-y-4">
                                    {/* Style tokens */}
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Engagement-Weighted Style Tokens</p>
                                        <div className="flex flex-wrap gap-2">
                                            {brandDNA.style_tokens?.length > 0
                                                ? brandDNA.style_tokens.map((t: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">{t}</span>
                                                ))
                                                : <span className="text-gray-500 text-xs">None extracted yet</span>
                                            }
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                            <p className="text-xs text-gray-500 mb-1">Color Mood</p>
                                            <p className="text-white font-medium capitalize">{brandDNA.color_mood}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                            <p className="text-xs text-gray-500 mb-1">Avg Engagement</p>
                                            <p className="text-white font-medium">{brandDNA.avg_er?.toFixed(2)}%</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                            <p className="text-xs text-gray-500 mb-1">Content Bias</p>
                                            <p className="text-white font-medium text-xs">
                                                {brandDNA.content_bias && Object.entries(brandDNA.content_bias as Record<string,number>)
                                                    .sort((a,b) => b[1]-a[1])[0]?.[0]}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Aesthetic text anchor */}
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <p className="text-xs text-gray-500 mb-1">CLIP Text Anchor</p>
                                        <p className="text-gray-300 text-sm italic">"{brandDNA.aesthetic_text}"</p>
                                    </div>
                                    {/* Top hashtags */}
                                    {brandDNA.top_hashtags?.length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Top Hashtags</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {brandDNA.top_hashtags.map((t: string, i: number) => (
                                                    <span key={i} className="text-xs text-purple-400">#{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!brandDNA && !loadingDNA && (
                                <p className="text-gray-500 text-sm">Click Re-extract to load brand aesthetic identity.</p>
                            )}
                        </div>

                        {/* Engagement Predictor */}
                        <div className="glass-card p-6">
                            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                                Module 2 — Pre-Publication Engagement Predictor
                            </h3>
                            <p className="text-xs text-gray-500 mb-5">
                                Self-supervised Ridge regression trained on your scraped posts. Predicts engagement rate before posting.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Draft Caption</label>
                                    <textarea
                                        value={draftCaption}
                                        onChange={e => setDraftCaption(e.target.value)}
                                        placeholder="Write your draft caption..."
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm resize-none focus:outline-none focus:border-white/20 h-24"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1"><Hash className="w-3 h-3 inline mr-1" />Hashtags (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={draftHashtags}
                                            onChange={e => setDraftHashtags(e.target.value)}
                                            placeholder="fashion, style, ootd"
                                            className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Content Type</label>
                                        <select
                                            value={draftType}
                                            onChange={e => setDraftType(e.target.value)}
                                            className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none"
                                        >
                                            <option value="GraphImage">Image</option>
                                            <option value="GraphVideo">Video</option>
                                            <option value="GraphSidecar">Carousel</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1"><Clock className="w-3 h-3 inline mr-1" />Planned Hour (0-23)</label>
                                        <input
                                            type="number"
                                            min={0} max={23}
                                            value={draftHour}
                                            onChange={e => setDraftHour(Number(e.target.value))}
                                            className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/20"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handlePredict}
                                    disabled={predicting}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50 text-sm"
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    {predicting ? 'Training model & predicting...' : 'Predict Engagement Rate'}
                                </button>
                            </div>

                            {/* Prediction Result */}
                            {prediction && (
                                <div className="mt-6 space-y-4 animate-fadeIn">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                                            <p className="text-xs text-gray-500 mb-1">Predicted ER</p>
                                            <p className="text-2xl font-bold text-green-400">{prediction.prediction?.predicted_er?.toFixed(2)}%</p>
                                            <p className="text-xs text-gray-500">{prediction.prediction?.confidence_interval}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                                            <p className="text-xs text-gray-500 mb-1">Best Hour</p>
                                            <p className="text-2xl font-bold text-cyan-400">{String(prediction.prediction?.best_hour).padStart(2,'0')}:00</p>
                                            <p className="text-xs text-gray-500">{prediction.prediction?.best_day}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                                            <p className="text-xs text-gray-500 mb-1">Optimal ER</p>
                                            <p className="text-2xl font-bold text-purple-400">{prediction.prediction?.best_predicted_er?.toFixed(2)}%</p>
                                            <p className="text-xs text-gray-500">if timed right</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                                            <p className="text-xs text-gray-500 mb-1">Model R²</p>
                                            <p className="text-2xl font-bold text-white">{prediction.train_metrics?.r2?.toFixed(3)}</p>
                                            <p className="text-xs text-gray-500">MAE {prediction.train_metrics?.mae?.toFixed(3)}%</p>
                                        </div>
                                    </div>

                                    {/* Insight */}
                                    <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                                        <p className="text-sm text-green-300">💡 {prediction.prediction?.insight}</p>
                                    </div>

                                    {/* Feature importances */}
                                    {prediction.prediction?.feature_importances && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Feature Importances (for paper table)</p>
                                            <div className="space-y-2">
                                                {Object.entries(prediction.prediction.feature_importances as Record<string,number>).slice(0,6).map(([feat, imp]) => (
                                                    <div key={feat} className="flex items-center gap-3">
                                                        <span className="text-xs text-gray-400 w-32 flex-shrink-0">{feat}</span>
                                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-full"
                                                                style={{ width: `${Math.min((imp / (Object.values(prediction.prediction.feature_importances)[0] as number)) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-500 w-12 text-right">{(imp as number).toFixed(3)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* LOO-CV */}
                                    {prediction.loo_cv && (
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-xs text-gray-500 mb-1">Leave-One-Out Cross-Validation ({prediction.loo_cv.n_folds} folds)</p>
                                            <p className="text-sm text-white">MAE: <span className="text-cyan-400 font-medium">{prediction.loo_cv.loo_cv_mae}</span> &nbsp;|&nbsp; RMSE: <span className="text-cyan-400 font-medium">{prediction.loo_cv.loo_cv_rmse}</span></p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Module 1 — CLIP Live Comparison */}
                        <div className="glass-card p-6 border border-purple-500/20">
                            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                                <Wand2 className="w-5 h-5 text-purple-400" />
                                Module 1 — CLIP Score: How It Works
                            </h3>
                            <p className="text-xs text-gray-500 mb-5">Cosine similarity in CLIP's shared 512-dim image-text embedding space</p>

                            {/* Pipeline Diagram */}
                            <div className="mb-6 p-4 rounded-xl bg-black/30 border border-white/5">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Pipeline</p>
                                <div className="flex flex-wrap items-center gap-1 text-xs">
                                    {[
                                        { label: 'Scraped Posts', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
                                        { arrow: true },
                                        { label: 'Brand-DNA Extraction', sub: 'engagement-weighted tokens', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
                                        { arrow: true },
                                        { label: 'CLIP Text Encoder', sub: 'aesthetic_text → 512-dim', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                                        { arrow: true },
                                        { label: 'Enriched Prompt → Image', sub: 'Pollinations generation', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
                                        { arrow: true },
                                        { label: 'CLIP Image Encoder', sub: 'image → 512-dim', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                                        { arrow: true },
                                        { label: 'Cosine Similarity', sub: '→ CLIP Score [0–1]', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
                                    ].map((step, i) =>
                                        step.arrow
                                            ? <span key={i} className="text-gray-600">→</span>
                                            : (
                                                <div key={i} className={`px-2 py-1.5 rounded-lg border ${step.color}`}>
                                                    <div className="font-medium">{step.label}</div>
                                                    {step.sub && <div className="text-[10px] opacity-70">{step.sub}</div>}
                                                </div>
                                            )
                                    )}
                                </div>
                                {/* Score scale */}
                                <div className="mt-4">
                                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                        <span>0.0 — no alignment</span>
                                        <span>0.25 — moderate</span>
                                        <span>0.35+ — strong ✓</span>
                                    </div>
                                    <div className="relative h-2 rounded-full overflow-hidden bg-white/5">
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/60 via-yellow-500/60 to-green-500/60" />
                                        {/* Baseline marker */}
                                        <div className="absolute top-0 bottom-0 w-0.5 bg-white/60" style={{ left: '23%' }} />
                                        {/* Brand-conditioned marker */}
                                        <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: '37%' }} />
                                    </div>
                                    <div className="flex gap-4 mt-1.5 text-[10px]">
                                        <span className="text-gray-500">│ Baseline ~0.23</span>
                                        <span className="text-purple-400">│ Brand-conditioned ~0.35+</span>
                                    </div>
                                </div>
                            </div>

                            {/* Live demo */}
                            <p className="text-xs font-medium text-gray-300 mb-3">Live Comparison Demo</p>
                            <div className="space-y-3">
                                <div>
                                    <input
                                        type="text"
                                        value={clipIdea}
                                        onChange={e => setClipIdea(e.target.value)}
                                        placeholder="Content idea title — e.g. New Summer Collection"
                                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={clipDescription}
                                        onChange={e => setClipDescription(e.target.value)}
                                        placeholder="Optional description"
                                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                                <button
                                    onClick={handleCompare}
                                    disabled={comparing || !clipIdea.trim()}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 text-sm"
                                >
                                    <Wand2 className="w-4 h-4" />
                                    {comparing ? 'Generating & scoring both images...' : 'Generate & Compare CLIP Scores'}
                                </button>
                            </div>

                            {/* Results */}
                            {clipResult && (
                                <div className="mt-6 space-y-5 animate-fadeIn">
                                    {/* Delta badge */}
                                    <div className="flex items-center gap-3">
                                        {clipResult.delta !== null && clipResult.delta !== undefined ? (
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
                                                clipResult.delta > 0
                                                    ? 'bg-green-500/15 text-green-400 border-green-500/30'
                                                    : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                                            }`}>
                                                {clipResult.delta > 0 ? '+' : ''}{(clipResult.delta * 100).toFixed(1)}% CLIP improvement
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-500/15 text-gray-400 border border-gray-500/30">
                                                {clipResult.clip_enabled ? 'CLIP scored' : 'CLIP not available (torch missing) — images generated'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Side-by-side images */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Baseline */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-400 font-medium">Baseline</span>
                                                {clipResult.baseline?.clip_score != null && (
                                                    <CLIPScoreBadge score={clipResult.baseline.clip_score} />
                                                )}
                                            </div>
                                            {clipResult.baseline?.url && (
                                                <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
                                                    <img
                                                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${clipResult.baseline.url}`}
                                                        alt="Baseline"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            {clipResult.baseline?.clip_score != null && (
                                                <CLIPScoreBar score={clipResult.baseline.clip_score} color="from-gray-400 to-gray-500" />
                                            )}
                                        </div>

                                        {/* Brand-conditioned */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-purple-400 font-medium">Brand-Conditioned</span>
                                                {clipResult.conditioned?.clip_score != null && (
                                                    <CLIPScoreBadge score={clipResult.conditioned.clip_score} highlight />
                                                )}
                                            </div>
                                            {clipResult.conditioned?.url && (
                                                <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-purple-500/30">
                                                    <img
                                                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${clipResult.conditioned.url}`}
                                                        alt="Brand-conditioned"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-purple-500/80 text-white text-[10px] rounded-full backdrop-blur-sm">Brand-DNA</div>
                                                </div>
                                            )}
                                            {clipResult.conditioned?.clip_score != null && (
                                                <CLIPScoreBar score={clipResult.conditioned.clip_score} color="from-purple-400 to-pink-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* CLIP anchor */}
                                    {clipResult.conditioned?.clip_anchor && (
                                        <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">CLIP Text Anchor (brand aesthetic_text)</p>
                                            <p className="text-sm text-purple-300 italic">"{clipResult.conditioned.clip_anchor}"</p>
                                        </div>
                                    )}

                                    {/* Prompt toggle */}
                                    <button
                                        onClick={() => setShowPrompts(p => !p)}
                                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        {showPrompts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        {showPrompts ? 'Hide prompts' : 'Show prompts'}
                                    </button>
                                    {showPrompts && (
                                        <div className="space-y-3 animate-fadeIn">
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                <p className="text-[10px] text-gray-500 uppercase mb-1">Baseline prompt</p>
                                                <p className="text-xs text-gray-300">{clipResult.baseline?.prompt || clipResult.conditioned?.baseline_prompt}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                                <p className="text-[10px] text-purple-400 uppercase mb-1">Enriched prompt (brand-conditioned)</p>
                                                <p className="text-xs text-gray-300">{clipResult.conditioned?.prompt}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </main>
        </div>
    );
}

// ── CLIP score helper components ──────────────────────────────────────────────

function CLIPScoreBadge({ score, highlight }: { score: number; highlight?: boolean }) {
    const pct = Math.round(score * 100);
    const level = score >= 0.35 ? 'high' : score >= 0.25 ? 'moderate' : 'low';
    const colors: Record<string, string> = {
        high:     highlight ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-green-500/20 text-green-300 border-green-500/40',
        moderate: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
        low:      'bg-red-500/20 text-red-300 border-red-500/40',
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-bold ${colors[level]}`}>
            CLIP {pct}%
        </span>
    );
}

function CLIPScoreBar({ score, color }: { score: number; color: string }) {
    const pct = Math.min(Math.round((score / 0.5) * 100), 100); // 0.5 = max expected
    return (
        <div className="space-y-1">
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
                <span>0.0</span>
                <span className="text-gray-400">{score.toFixed(4)}</span>
                <span>0.50</span>
            </div>
        </div>
    );
}