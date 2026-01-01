'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getBrand, generateCaption, generateSingleImage, createPost } from '@/lib/api';
import { ArrowLeft, Wand2, Image as ImageIcon, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function CreatePostPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const brandId = parseInt(params.id as string);

    const [brand, setBrand] = useState<any>(null);
    const [contentIdea, setContentIdea] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generatingImage, setGeneratingImage] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        platform: 'instagram',
        contentType: 'image',
        caption: '',
        hashtags: [] as string[],
        scheduledTime: '',
        imagePrompt: '',
        generatedImageUrl: '',
    });

    useEffect(() => {
        loadBrand();
        loadContentIdea();
    }, [brandId]);

    const loadContentIdea = () => {
        const ideaParam = searchParams.get('idea');
        if (ideaParam) {
            try {
                const idea = JSON.parse(decodeURIComponent(ideaParam));
                setContentIdea(idea);

                // Auto-fill form with content idea
                setFormData(prev => ({
                    ...prev,
                    contentType: idea.content_type || 'image',
                    caption: idea.caption_hook || '',
                    hashtags: idea.hashtag_suggestions || [],
                    imagePrompt: `${idea.title}. ${idea.description}`,
                }));

                // Auto-generate full caption
                setTimeout(() => {
                    handleGenerateCaption(idea);
                }, 500);

                // Auto-generate image if it's image type
                if (idea.content_type === 'image') {
                    setTimeout(() => {
                        handleGenerateImage(`${idea.title}. ${idea.description}`);
                    }, 1000);
                }
            } catch (error) {
                console.error('Failed to parse content idea:', error);
            }
        }
    };

    const loadBrand = async () => {
        try {
            const data = await getBrand(brandId);
            setBrand(data);
        } catch (error) {
            console.error('Failed to load brand:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCaption = async (ideaToUse?: any) => {
        setGenerating(true);
        try {
            const contentIdeaData = ideaToUse || contentIdea || {
                title: 'Custom Post',
                description: formData.imagePrompt || 'Create engaging social media content',
                content_type: formData.contentType,
            };

            const result = await generateCaption(brandId, contentIdeaData, formData.platform);
            setFormData(prev => ({
                ...prev,
                caption: result.caption,
                hashtags: result.hashtags || prev.hashtags,
            }));
        } catch (error) {
            console.error('Failed to generate caption:', error);
            alert('Failed to generate caption');
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateImage = async (promptOverride?: string) => {
        const prompt = promptOverride || formData.imagePrompt;

        if (!prompt) {
            alert('Please enter an image prompt');
            return;
        }

        setGeneratingImage(true);
        try {
            const result = await generateSingleImage(prompt, 1080, 1080);
            if (result.success) {
                setFormData(prev => ({
                    ...prev,
                    generatedImageUrl: result.url,
                }));
            } else {
                alert('Failed to generate image: ' + result.error);
            }
        } catch (error) {
            console.error('Failed to generate image:', error);
            alert('Failed to generate image');
        } finally {
            setGeneratingImage(false);
        }
    };

    const handleSavePost = async (status: 'draft' | 'scheduled') => {
        if (!formData.caption) {
            alert('Please add a caption');
            return;
        }

        if (status === 'scheduled' && !formData.scheduledTime) {
            alert('Please select a scheduled time');
            return;
        }

        setSaving(true);
        try {
            await createPost({
                brand_id: brandId,
                platform: formData.platform,
                content_type: formData.contentType,
                caption: formData.caption,
                hashtags: formData.hashtags,
                scheduled_time: status === 'scheduled' ? formData.scheduledTime : undefined,
            });

            alert(`Post ${status === 'draft' ? 'saved as draft' : 'scheduled'} successfully!`);
            router.push(`/brand/${brandId}`);
        } catch (error) {
            alert('Failed to save post');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Link href={`/brand/${brandId}`} className="text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Create Post</h1>
                            <p className="text-gray-600">{brand?.brand?.name}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Content Idea Banner */}
                {contentIdea && (
                    <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    📝 {contentIdea.title}
                                </h2>
                                <p className="text-gray-700 mb-3">{contentIdea.description}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                        {contentIdea.content_type}
                                    </span>
                                    {contentIdea.hashtag_suggestions?.slice(0, 3).map((tag: string, idx: number) => (
                                        <span key={idx} className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                {(generating || generatingImage) && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        {generating && 'Generating caption...'}
                                        {generatingImage && 'Generating image...'}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setContentIdea(null);
                                    setFormData({
                                        platform: 'instagram',
                                        contentType: 'image',
                                        caption: '',
                                        hashtags: [],
                                        scheduledTime: '',
                                        imagePrompt: '',
                                        generatedImageUrl: '',
                                    });
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <span className="text-2xl">×</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Form */}
                    <div className="space-y-6">
                        {/* Platform Selection */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Platform</h3>
                            <div className="flex gap-3">
                                {['instagram', 'twitter', 'linkedin'].map((platform) => (
                                    <button
                                        key={platform}
                                        onClick={() => setFormData({ ...formData, platform })}
                                        className={`px-4 py-2 rounded-lg capitalize transition ${formData.platform === platform
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {platform}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Type */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Content Type</h3>
                            <div className="flex gap-3">
                                {['image', 'video', 'text'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFormData({ ...formData, contentType: type })}
                                        className={`px-4 py-2 rounded-lg capitalize transition ${formData.contentType === type
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Image Generation */}
                        {formData.contentType === 'image' && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Generate Image</h3>
                                <textarea
                                    value={formData.imagePrompt}
                                    onChange={(e) => setFormData({ ...formData, imagePrompt: e.target.value })}
                                    placeholder="Describe the image you want to generate..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={3}
                                />
                                <button
                                    onClick={() => handleGenerateImage()}
                                    disabled={generatingImage}
                                    className="mt-3 w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    {generatingImage ? 'Generating...' : 'Generate Image'}
                                </button>
                            </div>
                        )}

                        {/* Caption */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Caption</h3>
                                <button
                                    onClick={handleGenerateCaption}
                                    disabled={generating}
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                                >
                                    <Wand2 className="w-4 h-4" />
                                    {generating ? 'Generating...' : 'AI Generate'}
                                </button>
                            </div>
                            <textarea
                                value={formData.caption}
                                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                                placeholder="Write your caption here..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={6}
                            />
                            <p className="text-sm text-gray-600 mt-2">
                                {formData.caption.length} characters
                            </p>
                        </div>

                        {/* Hashtags */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Hashtags</h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {formData.hashtags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                                    >
                                        #{tag}
                                        <button
                                            onClick={() => {
                                                const newTags = formData.hashtags.filter((_, i) => i !== idx);
                                                setFormData({ ...formData, hashtags: newTags });
                                            }}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Add hashtag (press Enter)"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        const value = (e.target as HTMLInputElement).value.replace('#', '');
                                        if (value && !formData.hashtags.includes(value)) {
                                            setFormData({
                                                ...formData,
                                                hashtags: [...formData.hashtags, value],
                                            });
                                            (e.target as HTMLInputElement).value = '';
                                        }
                                    }
                                }}
                            />
                        </div>

                        {/* Schedule */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Schedule Post</h3>
                            <input
                                type="datetime-local"
                                value={formData.scheduledTime}
                                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Right Column - Preview */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Preview</h3>

                            {/* Image Preview */}
                            {formData.generatedImageUrl && (
                                <div className="mb-4 rounded-lg overflow-hidden">
                                    <img
                                        src={formData.generatedImageUrl}
                                        alt="Generated"
                                        className="w-full h-auto"
                                    />
                                </div>
                            )}

                            {/* Caption Preview */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <p className="text-gray-900 whitespace-pre-wrap">
                                    {formData.caption || 'Your caption will appear here...'}
                                </p>
                                {formData.hashtags.length > 0 && (
                                    <p className="text-blue-600 mt-2">
                                        {formData.hashtags.map((tag) => `#${tag}`).join(' ')}
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => handleSavePost('draft')}
                                    disabled={saving}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                                >
                                    Save as Draft
                                </button>
                                <button
                                    onClick={() => handleSavePost('scheduled')}
                                    disabled={saving || !formData.scheduledTime}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                                >
                                    <Calendar className="w-4 h-4" />
                                    {saving ? 'Saving...' : 'Schedule Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}