'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getPost } from '@/lib/api';
import { ArrowLeft, Copy, Check, Calendar, Instagram, Twitter, Linkedin, Sparkles, Clock, Tag } from 'lucide-react';
import Link from 'next/link';

export default function PostDetailPage() {
    const params = useParams();
    const brandId = parseInt(params.id as string);
    const postId = parseInt(params.postId as string);

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copiedCaption, setCopiedCaption] = useState(false);

    useEffect(() => {
        loadPost();
    }, [postId]);

    const loadPost = async () => {
        try {
            const data = await getPost(postId);
            setPost(data);
        } catch (error) {
            console.error('Failed to load post:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCaption = () => {
        if (!post) return;
        const fullText = post.caption + (post.hashtags?.length > 0 ? '\n\n' + post.hashtags.map((tag: string) => `#${tag}`).join(' ') : '');
        navigator.clipboard.writeText(fullText);
        setCopiedCaption(true);
        setTimeout(() => setCopiedCaption(false), 2000);
    };

    const platformConfig: Record<string, { icon: any; gradient: string; color: string }> = {
        instagram: { icon: Instagram, gradient: 'from-pink-500 via-purple-500 to-orange-500', color: 'text-pink-400' },
        twitter: { icon: Twitter, gradient: 'from-blue-400 to-blue-600', color: 'text-blue-400' },
        linkedin: { icon: Linkedin, gradient: 'from-blue-600 to-blue-800', color: 'text-blue-500' },
    };

    const statusConfig: Record<string, string> = {
        draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        posted: 'bg-green-500/20 text-green-400 border-green-500/30',
        failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center animate-fadeIn">
                    <h2 className="text-2xl font-bold text-white mb-3">Post Not Found</h2>
                    <Link href={`/brand/${brandId}`} className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-2">
                        ← Back to Brand
                    </Link>
                </div>
            </div>
        );
    }

    const config = platformConfig[post.platform] || platformConfig.instagram;
    const PlatformIcon = config.icon;

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="glass-card border-x-0 border-t-0 rounded-none sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={`/brand/${brandId}`} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Post Details</h1>
                                    <p className="text-sm text-gray-500 capitalize">{post.status} · {post.platform}</p>
                                </div>
                            </div>
                        </div>
                        <span className={`text-xs px-4 py-1.5 rounded-full font-semibold border capitalize ${statusConfig[post.status] || statusConfig.draft}`}>
                            {post.status}
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column — Image */}
                    <div className="space-y-6 animate-fadeIn">
                        {post.media_urls && post.media_urls.length > 0 ? (
                            <div className="glass-card overflow-hidden">
                                <img
                                    src={post.media_urls[0]}
                                    alt="Post image"
                                    className="w-full h-auto"
                                />
                            </div>
                        ) : (
                            <div className="glass-card aspect-square flex items-center justify-center">
                                <div className="text-center">
                                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">No image attached</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column — Details */}
                    <div className="space-y-6 animate-fadeIn stagger-1">
                        {/* Platform & Content Type */}
                        <div className="glass-card p-6">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <PlatformIcon className={`w-5 h-5 ${config.color}`} />
                                Platform & Type
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-xs text-gray-500 mb-1">Platform</p>
                                    <p className="text-white font-medium capitalize flex items-center gap-2">
                                        <PlatformIcon className={`w-4 h-4 ${config.color}`} />
                                        {post.platform}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-xs text-gray-500 mb-1">Content Type</p>
                                    <p className="text-white font-medium capitalize">{post.content_type}</p>
                                </div>
                            </div>
                        </div>

                        {/* Caption */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white">Caption</h3>
                                <button
                                    onClick={handleCopyCaption}
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    {copiedCaption ? (
                                        <><Check className="w-4 h-4 text-green-400" /> Copied</>
                                    ) : (
                                        <><Copy className="w-4 h-4" /> Copy</>
                                    )}
                                </button>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                                    {post.caption || 'No caption'}
                                </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{post.caption?.length || 0} characters</p>
                        </div>

                        {/* Hashtags */}
                        {post.hashtags && post.hashtags.length > 0 && (
                            <div className="glass-card p-6">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-purple-400" />
                                    Hashtags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {post.hashtags.map((tag: string, idx: number) => (
                                        <span
                                            key={idx}
                                            className="bg-purple-500/15 text-purple-300 px-3 py-1.5 rounded-lg text-sm border border-purple-500/20"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Schedule & Timestamps */}
                        <div className="glass-card p-6">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                Timestamps
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-sm text-gray-400">Created</span>
                                    <span className="text-sm text-white">
                                        {new Date(post.created_at).toLocaleString()}
                                    </span>
                                </div>
                                {post.scheduled_time && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <span className="text-sm text-blue-300 flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Scheduled
                                        </span>
                                        <span className="text-sm text-blue-200">
                                            {new Date(post.scheduled_time).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                {post.posted_time && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                        <span className="text-sm text-green-300">Posted</span>
                                        <span className="text-sm text-green-200">
                                            {new Date(post.posted_time).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
