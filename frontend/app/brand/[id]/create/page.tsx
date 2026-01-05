'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getBrand, generateCaption, generateMultiplatformCaptions, generateSingleImage, createPost } from '@/lib/api';
import { ArrowLeft, Wand2, Image as ImageIcon, Calendar, Copy, Check, Sparkles, Instagram, Twitter, Linkedin, Zap } from 'lucide-react';
import Link from 'next/link';
import { AILoader, InlineLoader } from '@/components/Loaders';

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
    const [multiPlatformCaptions, setMultiPlatformCaptions] = useState<any>(null);
    const [showMultiPlatform, setShowMultiPlatform] = useState(false);
    const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
    const [copiedCaption, setCopiedCaption] = useState(false);

    const [formData, setFormData] = useState({
        platform: 'instagram',
        contentType: 'image',
        caption: '',
        hashtags: [] as string[],
        scheduledTime: '',
        imagePrompt: '',
        imageTitle: '',
        generatedImageUrl: '',
    });

    useEffect(() => {
        loadBrand();

        // Read all context params from URL
        const title = searchParams.get('title');
        const description = searchParams.get('description');
        const contentType = searchParams.get('contentType');
        const captionHook = searchParams.get('captionHook');
        const hashtagsParam = searchParams.get('hashtags');
        const platform = searchParams.get('platform');
        const contentIdea = searchParams.get('contentIdea');
        const source = searchParams.get('source');
        const adContext = searchParams.get('adContext');
        const campaignName = searchParams.get('campaignName');
        const campaignObjectives = searchParams.get('campaignObjectives');

        // Build image prompt from various sources
        let imagePrompt = description || '';
        let imageTitle = title || '';
        let caption = captionHook || '';

        // Handle ad recommendation context
        if (source === 'ad-recommendation' && adContext) {
            try {
                const context = JSON.parse(adContext);
                if (context.contentTips && context.contentTips.length > 0) {
                    imagePrompt = context.contentTips.join('. ') + '. ' + (contentIdea || '');
                } else {
                    imagePrompt = contentIdea || '';
                }
                imageTitle = `Ad for ${context.platform || 'Social Media'}`;
            } catch (e) {
                console.log('Could not parse ad context');
            }
        }

        // Handle campaign strategy context
        if (source === 'campaign-strategy' && contentIdea) {
            imagePrompt = contentIdea;
            imageTitle = campaignName || contentIdea.slice(0, 50);
        }

        // Apply updates from URL params
        if (title || description || platform || contentIdea) {
            setFormData(prev => ({
                ...prev,
                platform: platform || prev.platform,
                imageTitle: imageTitle || title || prev.imageTitle,
                imagePrompt: imagePrompt || prev.imagePrompt,
                contentType: contentType || prev.contentType || 'image',
                caption: caption || prev.caption,
                hashtags: hashtagsParam ? JSON.parse(hashtagsParam) : prev.hashtags,
            }));
        }
    }, [brandId, searchParams]);

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
                title: formData.imageTitle || 'Custom Post',
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

    const handleGenerateMultiPlatform = async () => {
        setGenerating(true);
        try {
            const contentIdea = {
                title: formData.imageTitle || 'Custom Post',
                description: formData.imagePrompt || 'Create engaging social media content',
                content_type: formData.contentType,
            };

            const result = await generateMultiplatformCaptions(brandId, contentIdea);
            setMultiPlatformCaptions(result.captions);
            setShowMultiPlatform(true);
        } catch (error) {
            alert('Failed to generate multi-platform captions');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopyCaption = (platform: string, caption: string, hashtags: string[]) => {
        const fullText = `${caption}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;
        navigator.clipboard.writeText(fullText);
        setCopiedPlatform(platform);
        setTimeout(() => setCopiedPlatform(null), 2000);
    };

    const handleUsePlatformCaption = (platform: string) => {
        const captionData = multiPlatformCaptions[platform];
        setFormData({
            ...formData,
            platform: platform,
            caption: captionData.caption,
            hashtags: captionData.hashtags || [],
        });
        setShowMultiPlatform(false);
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
                1080
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
                media_urls: formData.generatedImageUrl ? [formData.generatedImageUrl] : [],
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

    const platformConfig = {
        instagram: { icon: Instagram, gradient: 'from-pink-500 via-purple-500 to-orange-500', color: 'text-pink-400' },
        twitter: { icon: Twitter, gradient: 'from-blue-400 to-blue-600', color: 'text-blue-400' },
        linkedin: { icon: Linkedin, gradient: 'from-blue-600 to-blue-800', color: 'text-blue-500' },
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="glass-card border-x-0 border-t-0 rounded-none sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Link href={`/brand/${brandId}`} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Create Post</h1>
                                <p className="text-sm text-gray-500">{brand?.brand?.name}</p>
                            </div>
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
                        <div className="glass-card p-6 animate-fadeIn">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-purple-400" />
                                Platform
                            </h3>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {(['instagram', 'twitter', 'linkedin'] as const).map((platform) => {
                                    const config = platformConfig[platform];
                                    const Icon = config.icon;
                                    const isSelected = formData.platform === platform;
                                    return (
                                        <button
                                            key={platform}
                                            onClick={() => setFormData({ ...formData, platform })}
                                            className={`group relative px-4 py-3 rounded-xl capitalize transition-all font-medium overflow-hidden ${isSelected
                                                ? 'text-white shadow-lg'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                                                }`}
                                        >
                                            {isSelected && (
                                                <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient}`} />
                                            )}
                                            <span className="relative flex items-center justify-center gap-2">
                                                <Icon className="w-4 h-4" />
                                                {platform}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Platform-specific tips */}
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <p className="text-sm text-blue-300">
                                    {formData.platform === 'instagram' && (
                                        <><strong className="text-blue-200">Instagram:</strong> Visual storytelling with emojis. Use 15-30 hashtags. Max 2,200 characters.</>
                                    )}
                                    {formData.platform === 'twitter' && (
                                        <><strong className="text-blue-200">Twitter:</strong> Concise and punchy. 1-3 hashtags max. <strong>280 character limit!</strong></>
                                    )}
                                    {formData.platform === 'linkedin' && (
                                        <><strong className="text-blue-200">LinkedIn:</strong> Professional insights and thought leadership. 3-5 hashtags. Max 3,000 characters.</>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Content Type */}
                        <div className="glass-card p-6 animate-fadeIn stagger-1">
                            <h3 className="font-bold text-white mb-4">Content Type</h3>
                            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <p className="text-sm text-purple-300 mb-2">
                                    <strong className="text-purple-200">Suggested: {formData.contentType === 'carousel' ? 'Carousel Post' :
                                        formData.contentType === 'video' ? 'Video Content' :
                                            formData.contentType === 'reel' ? 'Reel' : 'Image Post'}</strong>
                                </p>
                                <p className="text-xs text-gray-400">
                                    Currently supporting high-quality image generation with AI. Carousel and video support coming soon!
                                </p>
                            </div>
                        </div>

                        {/* Image Generation */}
                        <div className="glass-card p-6 animate-fadeIn stagger-2">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-purple-400" />
                                Generate AI Image
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Image Title (for text overlay)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.imageTitle}
                                        onChange={(e) => setFormData({ ...formData, imageTitle: e.target.value })}
                                        placeholder="e.g., Summer Sale 2024, New Collection"
                                        className="w-full px-4 py-3 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Image Description
                                    </label>
                                    <textarea
                                        value={formData.imagePrompt}
                                        onChange={(e) => setFormData({ ...formData, imagePrompt: e.target.value })}
                                        placeholder="Describe what you want in the image: e.g., A vibrant summer fashion collection with floral patterns, bright colors, outdoor lifestyle setting"
                                        className="w-full px-4 py-3 rounded-xl resize-none"
                                        rows={4}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Be specific: mention colors, style, setting, mood, and key elements
                                    </p>
                                </div>

                                {generatingImage ? (
                                    <div className="bg-[var(--bg-tertiary)] rounded-xl border border-[var(--glass-border)]">
                                        <AILoader
                                            message="Creating your image"
                                            variant="image"
                                            steps={[
                                                'Analyzing prompt',
                                                'Generating visuals',
                                                'Enhancing quality',
                                                'Finalizing'
                                            ]}
                                            currentStep={1}
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleGenerateImage}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3.5 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                        Generate AI Image
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Caption */}
                        <div className="glass-card p-6 animate-fadeIn stagger-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white">Caption for {formData.platform}</h3>
                                <button
                                    onClick={handleGenerateCaption}
                                    disabled={generating}
                                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium disabled:opacity-50 transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-500/10"
                                >
                                    {generating ? (
                                        <InlineLoader text="Generating" />
                                    ) : (
                                        <>
                                            <Wand2 className="w-4 h-4" />
                                            AI Generate
                                        </>
                                    )}
                                </button>
                            </div>
                            <textarea
                                value={formData.caption}
                                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                                placeholder={`Write your ${formData.platform} caption here...`}
                                className="w-full px-4 py-3 rounded-xl resize-none"
                                rows={6}
                            />
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-gray-500">
                                    {formData.caption.length} characters
                                    {formData.platform === 'twitter' && formData.caption.length > 280 && (
                                        <span className="text-red-400 ml-2">
                                            (Over Twitter limit!)
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formData.platform === 'twitter' && 'Max: 280'}
                                    {formData.platform === 'instagram' && 'Max: 2,200'}
                                    {formData.platform === 'linkedin' && 'Max: 3,000'}
                                </p>
                            </div>
                        </div>

                        {/* Hashtags */}
                        <div className="glass-card p-6 animate-fadeIn stagger-4">
                            <h3 className="font-bold text-white mb-4">Hashtags</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {formData.hashtags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="group flex items-center gap-2 bg-purple-500/15 text-purple-300 px-3 py-1.5 rounded-lg text-sm border border-purple-500/20"
                                    >
                                        #{tag}
                                        <button
                                            onClick={() => {
                                                const newTags = formData.hashtags.filter((_, i) => i !== idx);
                                                setFormData({ ...formData, hashtags: newTags });
                                            }}
                                            className="text-purple-400 hover:text-red-400 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Add hashtag (press Enter)"
                                className="w-full px-4 py-3 rounded-xl"
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
                        <div className="glass-card p-6 animate-fadeIn stagger-5">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                Schedule Post
                            </h3>
                            <input
                                type="datetime-local"
                                value={formData.scheduledTime}
                                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Right Column - Preview */}
                    <div className="space-y-6">
                        <div className="glass-card p-6 sticky top-24 animate-fadeIn">
                            <h3 className="font-bold text-white mb-4">Preview</h3>

                            {/* Image Preview */}
                            {formData.generatedImageUrl && (
                                <div className="mb-4 relative group">
                                    <div className="rounded-xl overflow-hidden border border-white/10">
                                        <img
                                            src={formData.generatedImageUrl}
                                            alt="Generated"
                                            className="w-full h-auto"
                                        />
                                    </div>
                                    {/* Download Button */}
                                    <a
                                        href={formData.generatedImageUrl}
                                        download={`social-ai-image-${Date.now()}.png`}
                                        className="absolute top-3 right-3 p-2.5 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                                        title="Download image"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                    </a>
                                </div>
                            )}

                            {!formData.generatedImageUrl && (
                                <div className="mb-4 aspect-square rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center bg-white/5">
                                    <div className="text-center">
                                        <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">Generate an image above</p>
                                    </div>
                                </div>
                            )}

                            {/* Caption Preview */}
                            <div className="relative p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                                {formData.caption && (
                                    <button
                                        onClick={() => {
                                            const fullText = formData.caption + (formData.hashtags.length > 0 ? '\n\n' + formData.hashtags.map(tag => `#${tag}`).join(' ') : '');
                                            navigator.clipboard.writeText(fullText);
                                            setCopiedCaption(true);
                                            setTimeout(() => setCopiedCaption(false), 2000);
                                        }}
                                        className="absolute top-3 right-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                        title="Copy caption"
                                    >
                                        {copiedCaption ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                )}
                                <p className="text-gray-300 whitespace-pre-wrap pr-10 text-sm">
                                    {formData.caption || 'Your caption will appear here...'}
                                </p>
                                {formData.hashtags.length > 0 && (
                                    <p className="text-purple-400 mt-3 text-sm">
                                        {formData.hashtags.map((tag) => `#${tag}`).join(' ')}
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => handleSavePost('draft')}
                                    disabled={saving}
                                    className="w-full px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all font-medium disabled:opacity-50"
                                >
                                    Save as Draft
                                </button>
                                <button
                                    onClick={() => handleSavePost('scheduled')}
                                    disabled={saving || !formData.scheduledTime}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
                                >
                                    <Calendar className="w-4 h-4" />
                                    {saving ? 'Saving...' : 'Schedule Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Multi-Platform Captions Modal */}
            {showMultiPlatform && multiPlatformCaptions && (
                <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={() => setShowMultiPlatform(false)}>
                    <div className="modal-content max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-[#16161f] border-b border-white/10 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Multi-Platform Captions</h2>
                            <button
                                onClick={() => setShowMultiPlatform(false)}
                                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors text-xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                            {Object.entries(multiPlatformCaptions).map(([platform, data]: [string, any]) => {
                                const config = platformConfig[platform as keyof typeof platformConfig];
                                const Icon = config?.icon || Instagram;
                                return (
                                    <div key={platform} className="glass-card p-6 hover:border-white/15 transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${config?.gradient || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                                                    <Icon className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white capitalize">{platform}</h3>
                                                    <span className="text-xs text-gray-500">
                                                        {data.character_count || data.caption.length} chars
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCopyCaption(platform, data.caption, data.hashtags)}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-gray-300 transition-colors"
                                                >
                                                    {copiedPlatform === platform ? (
                                                        <><Check className="w-4 h-4 text-green-400" /> Copied</>
                                                    ) : (
                                                        <><Copy className="w-4 h-4" /> Copy</>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleUsePlatformCaption(platform)}
                                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 text-sm font-medium transition-all"
                                                >
                                                    Use This
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-3">
                                            <p className="text-gray-300 whitespace-pre-wrap text-sm">{data.caption}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            {data.hashtags?.map((tag: string, idx: number) => (
                                                <span key={idx} className="text-sm text-purple-400">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>

                                        {data.cta && (
                                            <div className="mt-3 pt-3 border-t border-white/5">
                                                <p className="text-sm text-gray-400">
                                                    <strong className="text-gray-300">CTA:</strong> {data.cta}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="sticky bottom-0 bg-[#16161f] border-t border-white/10 px-6 py-4">
                            <button
                                onClick={() => setShowMultiPlatform(false)}
                                className="w-full px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}