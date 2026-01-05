'use client';

import { Calendar, Edit, Trash2, ExternalLink, Heart, MessageCircle, Eye } from 'lucide-react';
import { formatDateTime, getStatusColor, getPlatformEmoji } from '@/lib/helpers';

interface Post {
    id: number;
    platform: string;
    content_type: string;
    caption: string;
    hashtags: string[];
    media_urls?: string[];
    status: string;
    scheduled_time?: string;
    posted_time?: string;
    post_url?: string;
    created_at: string;
}

interface ContentGridProps {
    posts: Post[];
    onEdit?: (post: Post) => void;
    onDelete?: (postId: number) => void;
}

const statusStyles: Record<string, string> = {
    draft: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    scheduled: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    posted: 'bg-green-500/20 text-green-400 border border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export default function ContentGrid({ posts, onEdit, onDelete }: ContentGridProps) {
    if (posts.length === 0) {
        return (
            <div className="text-center py-16 glass-card animate-fadeIn">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-purple-400 animate-float" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Content Yet</h3>
                <p className="text-gray-400">Create your first post to see it here</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
                <div
                    key={post.id}
                    className="group glass-card overflow-hidden hover:border-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 animate-fadeIn"
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                    {/* Image Preview */}
                    {post.media_urls && post.media_urls.length > 0 && (
                        <div className="aspect-square bg-gray-900 relative overflow-hidden">
                            <img
                                src={post.media_urls[0]}
                                alt="Post preview"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Image';
                                }}
                            />
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${statusStyles[post.status] || statusStyles.draft}`}>
                                    {post.status}
                                </span>
                            </div>

                            {/* Hover Actions */}
                            <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                {post.post_url && (
                                    <a
                                        href={post.post_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/20 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* No Image - Show Caption Preview */}
                    {(!post.media_urls || post.media_urls.length === 0) && (
                        <div className="aspect-square bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 flex items-center justify-center relative">
                            <div className="text-center">
                                <p className="text-gray-300 font-medium line-clamp-4 text-sm">
                                    {post.caption.slice(0, 150)}...
                                </p>
                            </div>
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${statusStyles[post.status] || statusStyles.draft}`}>
                                    {post.status}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Post Info */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{getPlatformEmoji(post.platform)}</span>
                                <span className="text-xs text-gray-400 capitalize font-medium">{post.platform}</span>
                            </div>
                            <span className="text-xs text-gray-500 capitalize px-2 py-1 rounded-md bg-white/5">
                                {post.content_type}
                            </span>
                        </div>

                        <p className="text-sm text-gray-300 line-clamp-2 mb-3 leading-relaxed">
                            {post.caption}
                        </p>

                        {/* Hashtags */}
                        {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {post.hashtags.slice(0, 3).map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="text-xs bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/20 hover:bg-purple-500/25 transition-colors cursor-default"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                                {post.hashtags.length > 3 && (
                                    <span className="text-xs text-gray-500">+{post.hashtags.length - 3}</span>
                                )}
                            </div>
                        )}

                        {/* Timestamps */}
                        <div className="text-xs text-gray-500 mb-3 space-y-1">
                            {post.scheduled_time && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    <span>Scheduled: {formatDateTime(post.scheduled_time)}</span>
                                </div>
                            )}
                            {post.posted_time && (
                                <div className="flex items-center gap-1.5">
                                    <span>Posted: {formatDateTime(post.posted_time)}</span>
                                </div>
                            )}
                            {!post.scheduled_time && !post.posted_time && (
                                <div>Created: {formatDateTime(post.created_at)}</div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t border-white/5">
                            {post.post_url && (
                                <a
                                    href={post.post_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium py-2 rounded-lg hover:bg-blue-500/10 transition-all"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View Post
                                </a>
                            )}
                            {post.status === 'draft' && onEdit && (
                                <button
                                    onClick={() => onEdit(post)}
                                    className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-white font-medium py-2 rounded-lg hover:bg-white/5 transition-all"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                            )}
                            {onDelete && post.status !== 'posted' && (
                                <button
                                    onClick={() => onDelete(post.id)}
                                    className="flex items-center justify-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-medium px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}