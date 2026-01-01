'use client';

import { Calendar, Edit, Trash2, ExternalLink } from 'lucide-react';
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

export default function ContentGrid({ posts, onEdit, onDelete }: ContentGridProps) {
    if (posts.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Content Yet</h3>
                <p className="text-gray-600">Create your first post to see it here</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                    {/* Image Preview */}
                    {post.media_urls && post.media_urls.length > 0 && (
                        <div className="aspect-square bg-gray-100 relative">
                            <img
                                src={post.media_urls[0]}
                                alt="Post preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback if image fails to load
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Image';
                                }}
                            />
                            <div className="absolute top-2 right-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                                    {post.status}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* No Image - Show Caption Preview */}
                    {(!post.media_urls || post.media_urls.length === 0) && (
                        <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-gray-700 font-medium line-clamp-4">
                                    {post.caption.slice(0, 150)}...
                                </p>
                                <div className="mt-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                                        {post.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Post Info */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{getPlatformEmoji(post.platform)}</span>
                            <span className="text-xs text-gray-500 capitalize">{post.platform}</span>
                        </div>

                        <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                            {post.caption}
                        </p>

                        {/* Hashtags */}
                        {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                                {post.hashtags.slice(0, 3).map((tag, idx) => (
                                    <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        #{tag}
                                    </span>
                                ))}
                                {post.hashtags.length > 3 && (
                                    <span className="text-xs text-gray-600">+{post.hashtags.length - 3}</span>
                                )}
                            </div>
                        )}

                        {/* Timestamps */}
                        <div className="text-xs text-gray-600 mb-3">
                            {post.scheduled_time && (
                                <div className="flex items-center gap-1 mb-1">
                                    <Calendar className="w-3 h-3" />
                                    Scheduled: {formatDateTime(post.scheduled_time)}
                                </div>
                            )}
                            {post.posted_time && (
                                <div className="flex items-center gap-1 mb-1">
                                    Posted: {formatDateTime(post.posted_time)}
                                </div>
                            )}
                            {!post.scheduled_time && !post.posted_time && (
                                <div>Created: {formatDateTime(post.created_at)}</div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t">
                            {post.post_url && (
                                <a
                                    href={post.post_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View Post
                                </a>
                            )}
                            {post.status === 'draft' && onEdit && (
                                <button
                                    onClick={() => onEdit(post)}
                                    className="flex-1 flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                            )}
                            {onDelete && post.status !== 'posted' && (
                                <button
                                    onClick={() => onDelete(post.id)}
                                    className="flex items-center justify-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium px-3"
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