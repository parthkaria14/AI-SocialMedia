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
        imageTitle: '',
        generatedImageUrl: '',
        addTextOverlay: true,
        language: 'english',
    });

    useEffect(() => {
        loadBrand();
    }, [brandId]);

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

    const handleGenerateCaption = async () => {
        setGenerating(true);
        try {
            const contentIdea = {
                title: 'Custom Post',
                description: formData.imagePrompt || 'Create engaging social media content',
                content_type: formData.contentType,
            };

            const result = await generateCaption(brandId, contentIdea, formData.platform);
            setFormData({
                ...formData,
                caption: result.caption,
                hashtags: result.hashtags || [],
            });
        } catch (error) {
            alert('Failed to generate caption');
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!formData.imagePrompt) {
            alert('Please enter an image description');
            return;
        }

        setGeneratingImage(true);
        try {
            const result = await generateSingleImage(
                formData.imagePrompt,
                formData.imageTitle,
                1080,
                1080,
                formData.addTextOverlay,
                formData.language
            );
            if (result.success) {
                setFormData({
                    ...formData,
                    generatedImageUrl: result.url,
                });
            } else {
                alert('Failed to generate image: ' + result.error);
            }
        } catch (error) {
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

                        {/* Content Type - Removed for now, default to image */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Content Type</h3>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Image Posts Only</strong> - Currently supporting high-quality image generation with AI. Video support coming soon!
                                </p>
                            </div>
                        </div>

                        {/* Image Generation */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Generate AI Image</h3>

                            {/* Image Title */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Image Title (for text overlay)
                                </label>
                                <input
                                    type="text"
                                    value={formData.imageTitle}
                                    onChange={(e) => setFormData({ ...formData, imageTitle: e.target.value })}
                                    placeholder="e.g., Summer Sale 2024, New Collection"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Image Description */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Image Description
                                </label>
                                <textarea
                                    value={formData.imagePrompt}
                                    onChange={(e) => setFormData({ ...formData, imagePrompt: e.target.value })}
                                    placeholder="Describe what you want in the image: e.g., A vibrant summer fashion collection with floral patterns, bright colors, outdoor lifestyle setting"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={4}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Be specific: mention colors, style, setting, mood, and key elements
                                </p>
                            </div>

                            {/* Text Overlay Options */}
                            <div className="mb-3 flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.addTextOverlay}
                                        onChange={(e) => setFormData({ ...formData, addTextOverlay: e.target.checked })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">Add text overlay to image</span>
                                </label>
                            </div>

                            {/* Language Selection */}
                            {formData.addTextOverlay && (
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Text Language
                                    </label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, language: 'english' })}
                                            className={`px-4 py-2 rounded-lg transition ${formData.language === 'english'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            English
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, language: 'hindi' })}
                                            className={`px-4 py-2 rounded-lg transition ${formData.language === 'hindi'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            हिंदी (Hindi)
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleGenerateImage}
                                disabled={generatingImage}
                                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                            >
                                <ImageIcon className="w-5 h-5" />
                                {generatingImage ? 'Generating High-Quality Image...' : 'Generate AI Image'}
                            </button>

                            {generatingImage && (
                                <p className="text-sm text-gray-600 text-center mt-2">
                                    This may take 15-30 seconds for best quality...
                                </p>
                            )}
                        </div>

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