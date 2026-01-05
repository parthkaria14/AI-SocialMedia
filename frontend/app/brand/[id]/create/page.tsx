'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getBrand, generateCaption, generateMultiplatformCaptions, generateSingleImage, createPost } from '@/lib/api';
import { ArrowLeft, Wand2, Image as ImageIcon, Calendar, Copy, Check } from 'lucide-react';
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

    const [sourceContext, setSourceContext] = useState<any>(null);

    useEffect(() => {
        loadBrand();

        // Load data from query params
        const title = searchParams.get('title');
        const description = searchParams.get('description');
        const contentType = searchParams.get('contentType');
        const platform = searchParams.get('platform');
        const captionHook = searchParams.get('captionHook');
        const hashtagsParam = searchParams.get('hashtags');
        const contextParam = searchParams.get('context');

        // Parse context from other agents
        let context: any = null;
        if (contextParam) {
            try {
                context = JSON.parse(contextParam);
                setSourceContext(context);
            } catch (e) {
                console.error('Failed to parse context:', e);
            }
        }

        // Build enhanced prompts based on source
        let enhancedImagePrompt = description || '';
        let enhancedTitle = title || '';

        if (context) {
            switch (context.source) {
                case 'ad-recommendations':
                    // Create ad-optimized prompt
                    const adTypes = context.adTypes?.join(', ') || 'social media ad';
                    const tips = context.tips?.slice(0, 2).join('. ') || '';
                    enhancedImagePrompt = `Create a professional ${adTypes} image for social media advertising. ${description}${tips ? ` Key elements: ${tips}` : ''}. The image should be eye-catching, high-quality, and optimized for paid advertising with clear visual hierarchy and brand appeal.`;
                    enhancedTitle = title || `${context.adTypes?.[0] || 'Ad'} Visual`;
                    break;

                case 'optimization-tip':
                    // Create tip-based prompt  
                    enhancedImagePrompt = `Create an engaging social media image that implements this strategy: "${context.tip}". Make it visually compelling with modern design aesthetics, vibrant colors, and clear messaging that drives engagement.`;
                    enhancedTitle = title || 'Optimized Content';
                    break;

                case 'competitor-trending':
                    // Create trending topic prompt
                    enhancedImagePrompt = `Create a trendy, viral-worthy social media image about "${context.topic}". The style should be modern, eye-catching, and follow current social media design trends. Make it shareable and engagement-focused.`;
                    enhancedTitle = title || context.topic;
                    break;

                case 'competitor-top-post':
                    // Create competitor-inspired prompt
                    enhancedImagePrompt = `Create a high-performing social media image inspired by this successful concept: "${description}". The original had ${context.originalEngagement?.toFixed(1)}% engagement with ${context.likes?.toLocaleString()} likes. Make it visually striking with professional quality that drives similar engagement.`;
                    enhancedTitle = title || 'High-Engagement Content';
                    break;

                case 'campaign-calendar':
                    // Create campaign-specific prompt with rich details
                    const contentType = context.contentType || 'image';
                    const platformStyle = context.platform === 'Instagram' ? 'vibrant, visually stunning, and Instagram-optimized with strong visual hierarchy' :
                        context.platform === 'Twitter' ? 'bold, eye-catching, and Twitter-friendly with clear messaging' :
                            context.platform === 'LinkedIn' ? 'professional, polished, and LinkedIn-appropriate with business aesthetics' :
                                'modern and engaging';
                    const engagementStyle = context.expectedEngagement === 'high' ? 'viral-worthy with maximum visual impact and shareability' :
                        context.expectedEngagement === 'medium' ? 'engaging and professionally crafted' :
                            'clean and on-brand';

                    enhancedImagePrompt = `Create a ${engagementStyle} ${contentType} for the "${context.campaignName || 'marketing'}" campaign (Day ${context.day || 1}).

Content Theme: "${context.contentIdea || description}"
Platform: ${context.platform || 'social media'} - make it ${platformStyle}
Campaign Objective: ${context.campaignObjectives || 'brand awareness'}

The image should:
- Be optimized for ${context.optimalTime || 'peak engagement time'} posting
- Drive ${context.expectedEngagement || 'high'} engagement
- Align with a $${context.campaignBudget?.toLocaleString() || '1,000'} campaign budget aesthetic
- Include compelling visual elements that support the content idea
- Be professional, on-brand, and campaign-ready`;
                    enhancedTitle = title || `${context.campaignName} - Day ${context.day}`;
                    break;

                default:
                    enhancedImagePrompt = description || '';
            }
        }

        if (title || description || platform) {
            setFormData(prev => ({
                ...prev,
                imageTitle: enhancedTitle || prev.imageTitle,
                imagePrompt: enhancedImagePrompt || prev.imagePrompt,
                contentType: contentType || 'image',
                platform: platform || prev.platform,
                caption: captionHook || prev.caption,
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
                {/* Context Banner - Show where inspiration came from */}
                {sourceContext && (
                    <div className={`mb-6 rounded-lg p-4 border ${sourceContext.source === 'ad-recommendations' ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' :
                        sourceContext.source === 'competitor-trending' || sourceContext.source === 'competitor-top-post' ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' :
                            sourceContext.source === 'campaign-calendar' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                                sourceContext.source === 'optimization-tip' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' :
                                    'bg-gray-50 border-gray-200'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${sourceContext.source === 'ad-recommendations' ? 'bg-blue-100' :
                                sourceContext.source === 'competitor-trending' || sourceContext.source === 'competitor-top-post' ? 'bg-purple-100' :
                                    sourceContext.source === 'campaign-calendar' ? 'bg-green-100' :
                                        sourceContext.source === 'optimization-tip' ? 'bg-yellow-100' :
                                            'bg-gray-100'
                                }`}>
                                <Wand2 className={`w-5 h-5 ${sourceContext.source === 'ad-recommendations' ? 'text-blue-600' :
                                    sourceContext.source === 'competitor-trending' || sourceContext.source === 'competitor-top-post' ? 'text-purple-600' :
                                        sourceContext.source === 'campaign-calendar' ? 'text-green-600' :
                                            sourceContext.source === 'optimization-tip' ? 'text-yellow-600' :
                                                'text-gray-600'
                                    }`} />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                    {sourceContext.source === 'ad-recommendations' && '✨ Creating ad content from AI recommendations'}
                                    {sourceContext.source === 'optimization-tip' && '💡 Inspired by optimization tip'}
                                    {sourceContext.source === 'competitor-trending' && `🔥 Trending topic: "${sourceContext.topic}"`}
                                    {sourceContext.source === 'competitor-top-post' && `📈 Inspired by high-performing post (${sourceContext.originalEngagement?.toFixed(1)}% engagement)`}
                                    {sourceContext.source === 'campaign-calendar' && `📅 ${sourceContext.campaignName} - Day ${sourceContext.day} (${sourceContext.platform})`}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {sourceContext.source === 'ad-recommendations' && `Expected ROI: ${sourceContext.expectedRoi}x | Budget: $${sourceContext.budget?.toLocaleString()}`}
                                    {sourceContext.source === 'optimization-tip' && 'AI-enhanced prompt ready for generation'}
                                    {sourceContext.source === 'competitor-trending' && 'Trending content idea ready for your brand'}
                                    {sourceContext.source === 'competitor-top-post' && `Original: ${sourceContext.likes?.toLocaleString()} likes`}
                                    {sourceContext.source === 'campaign-calendar' && `${sourceContext.optimalTime} | ${sourceContext.expectedEngagement} engagement expected | $${sourceContext.campaignBudget?.toLocaleString() || '1,000'} budget`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Form */}
                    <div className="space-y-6">
                        {/* Platform Selection */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Platform</h3>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                {['instagram', 'twitter', 'linkedin'].map((platform) => (
                                    <button
                                        key={platform}
                                        onClick={() => setFormData({ ...formData, platform })}
                                        className={`px-4 py-3 rounded-lg capitalize transition font-medium ${formData.platform === platform
                                            ? platform === 'instagram' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                                                platform === 'twitter' ? 'bg-blue-500 text-white' :
                                                    'bg-blue-700 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {platform}
                                    </button>
                                ))}
                            </div>

                            {/* Platform-specific tips */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    {formData.platform === 'instagram' && (
                                        <>
                                            <strong>Instagram:</strong> Visual storytelling with emojis. Use 15-30 hashtags. Max 2,200 characters.
                                        </>
                                    )}
                                    {formData.platform === 'twitter' && (
                                        <>
                                            <strong>Twitter:</strong> Concise and punchy. 1-3 hashtags max. <strong>280 character limit!</strong>
                                        </>
                                    )}
                                    {formData.platform === 'linkedin' && (
                                        <>
                                            <strong>LinkedIn:</strong> Professional insights and thought leadership. 3-5 hashtags. Max 3,000 characters.
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Content Type - Show suggestion based on passed type */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Content Type</h3>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800 mb-2">
                                    <strong>Suggested: {formData.contentType === 'carousel' ? 'Carousel Post' :
                                        formData.contentType === 'video' ? 'Video Content' :
                                            formData.contentType === 'reel' ? 'Reel' : 'Image Post'}</strong>
                                </p>
                                <p className="text-xs text-blue-700">
                                    Currently supporting high-quality image generation with AI. Carousel and video support coming soon!
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
                                <h3 className="font-semibold text-gray-900">Caption for {formData.platform}</h3>
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
                                placeholder={`Write your ${formData.platform} caption here...`}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={6}
                            />
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-gray-600">
                                    {formData.caption.length} characters
                                    {formData.platform === 'twitter' && formData.caption.length > 280 && (
                                        <span className="text-red-600 ml-2">
                                            (Over Twitter limit!)
                                        </span>
                                    )}
                                </p>
                                {formData.platform === 'twitter' && (
                                    <p className="text-xs text-gray-500">Max: 280 characters</p>
                                )}
                                {formData.platform === 'instagram' && (
                                    <p className="text-xs text-gray-500">Max: 2,200 characters</p>
                                )}
                                {formData.platform === 'linkedin' && (
                                    <p className="text-xs text-gray-500">Max: 3,000 characters</p>
                                )}
                            </div>
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
                            <div className="bg-gray-50 rounded-lg p-4 mb-4 relative">
                                {formData.caption && (
                                    <button
                                        onClick={() => {
                                            const fullText = formData.caption + (formData.hashtags.length > 0 ? '\n\n' + formData.hashtags.map(tag => `#${tag}`).join(' ') : '');
                                            navigator.clipboard.writeText(fullText);
                                            setCopiedCaption(true);
                                            setTimeout(() => setCopiedCaption(false), 2000);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 rounded hover:bg-gray-200 transition"
                                        title="Copy caption"
                                    >
                                        {copiedCaption ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-500" />
                                        )}
                                    </button>
                                )}
                                <p className="text-gray-900 whitespace-pre-wrap pr-8">
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

            {/* Multi-Platform Captions Modal */}
            {showMultiPlatform && multiPlatformCaptions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Multi-Platform Captions</h2>
                            <button
                                onClick={() => setShowMultiPlatform(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {Object.entries(multiPlatformCaptions).map(([platform, data]: [string, any]) => (
                                <div key={platform} className="border rounded-lg p-6 hover:shadow-md transition">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 capitalize flex items-center gap-2">
                                                {platform}
                                                <span className={`text-xs px-2 py-1 rounded ${platform === 'instagram' ? 'bg-pink-100 text-pink-800' :
                                                    platform === 'twitter' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {data.character_count || data.caption.length} chars
                                                </span>
                                            </h3>
                                            {data.platform_notes && (
                                                <p className="text-sm text-gray-600 mt-1">{data.platform_notes}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleCopyCaption(platform, data.caption, data.hashtags)}
                                                className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                                            >
                                                {copiedPlatform === platform ? (
                                                    <>
                                                        <Check className="w-4 h-4 text-green-600" />
                                                        Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4" />
                                                        Copy
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleUsePlatformCaption(platform)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                            >
                                                Use This
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                                        <p className="text-gray-900 whitespace-pre-wrap">{data.caption}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {data.hashtags?.map((tag: string, idx: number) => (
                                            <span key={idx} className="text-sm text-blue-600">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    {data.cta && (
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="text-sm text-gray-600">
                                                <strong>CTA:</strong> {data.cta}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
                            <button
                                onClick={() => setShowMultiPlatform(false)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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