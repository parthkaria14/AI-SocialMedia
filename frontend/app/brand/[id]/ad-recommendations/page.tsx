'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBrand, getAdRecommendations, createCampaign } from '@/lib/api';
import { DollarSign, Target, TrendingUp, Zap, CheckCircle2, XCircle, Sparkles, ArrowRight, Rocket, BarChart3, Wand2 } from 'lucide-react';
import BrandNavBar from '@/components/BrandNavBar';
import Link from 'next/link';

export default function AdRecommendationsPage() {
    const params = useParams();
    const router = useRouter();
    const brandId = parseInt(params.id as string);

    const [brand, setBrand] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [recommendations, setRecommendations] = useState<any>(null);
    const [creatingCampaign, setCreatingCampaign] = useState(false);

    const [formData, setFormData] = useState({
        budget: 5000,
        objectives: [] as string[],
        targetMetrics: {
            target_ctr: 2.5,
            target_conversions: 100,
            target_roi: 3.0
        }
    });

    const objectiveOptions = [
        { id: 'Brand Awareness', icon: '🎯', desc: 'Increase visibility' },
        { id: 'Lead Generation', icon: '📧', desc: 'Capture interest' },
        { id: 'Sales/Conversions', icon: '💰', desc: 'Drive revenue' },
        { id: 'Website Traffic', icon: '🌐', desc: 'Boost visits' },
        { id: 'Engagement', icon: '💬', desc: 'Build community' },
        { id: 'App Installs', icon: '📱', desc: 'Grow users' }
    ];

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

    const toggleObjective = (objective: string) => {
        if (formData.objectives.includes(objective)) {
            setFormData({
                ...formData,
                objectives: formData.objectives.filter(o => o !== objective)
            });
        } else {
            setFormData({
                ...formData,
                objectives: [...formData.objectives, objective]
            });
        }
    };

    const handleAnalyze = async () => {
        if (formData.objectives.length === 0) {
            alert('Please select at least one objective');
            return;
        }

        setAnalyzing(true);
        try {
            const result = await getAdRecommendations(
                brandId,
                formData.objectives,
                formData.budget,
                formData.targetMetrics
            );
            setRecommendations(result);
        } catch (error) {
            alert('Failed to get recommendations');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCreateCampaignFromRecommendation = async (rec: any) => {
        setCreatingCampaign(true);
        try {
            await createCampaign({
                brand_id: brandId,
                name: `${rec.platform} Campaign`,
                description: `AI-recommended campaign for ${rec.platform} platform`,
                campaign_type: 'paid',
                platforms: [rec.platform],
                objectives: formData.objectives,
                budget: rec.recommended_budget
            });
            router.push(`/brand/${brandId}/campaigns`);
        } catch (error) {
            alert('Failed to create campaign');
        } finally {
            setCreatingCampaign(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Shared Navigation Bar */}
            <BrandNavBar brandId={brandId} brandName={brand?.brand?.name} />

            {/* Page Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">AI Platform Recommendations</h2>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Configuration Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Target className="w-6 h-6 text-blue-600" />
                        Campaign Configuration
                    </h2>

                    {/* Budget */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Budget
                        </label>
                        <div className="relative max-w-md">
                            <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="number"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="100"
                                step="100"
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Recommended: $1,000 - $50,000</p>
                    </div>

                    {/* Objectives */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Campaign Objectives <span className="text-blue-600">(select at least one)</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {objectiveOptions.map((objective) => (
                                <button
                                    key={objective.id}
                                    onClick={() => toggleObjective(objective.id)}
                                    className={`relative p-4 rounded-lg border-2 transition-all text-left ${formData.objectives.includes(objective.id)
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{objective.icon}</span>
                                        <div>
                                            <div className={`font-medium ${formData.objectives.includes(objective.id) ? 'text-blue-900' : 'text-gray-900'}`}>
                                                {objective.id}
                                            </div>
                                            <div className="text-xs text-gray-500">{objective.desc}</div>
                                        </div>
                                    </div>
                                    {formData.objectives.includes(objective.id) && (
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target Metrics */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target Metrics
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <label className="block text-xs text-gray-500 mb-2">Target CTR (%)</label>
                                <input
                                    type="number"
                                    value={formData.targetMetrics.target_ctr}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        targetMetrics: { ...formData.targetMetrics, target_ctr: parseFloat(e.target.value) }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    step="0.1"
                                />
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <label className="block text-xs text-gray-500 mb-2">Target Conversions</label>
                                <input
                                    type="number"
                                    value={formData.targetMetrics.target_conversions}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        targetMetrics: { ...formData.targetMetrics, target_conversions: parseInt(e.target.value) }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <label className="block text-xs text-gray-500 mb-2">Target ROI (X)</label>
                                <input
                                    type="number"
                                    value={formData.targetMetrics.target_roi}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        targetMetrics: { ...formData.targetMetrics, target_roi: parseFloat(e.target.value) }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    step="0.1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing || formData.objectives.length === 0}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                    >
                        {analyzing ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                Analyzing Best Platforms...
                            </>
                        ) : (
                            <>
                                <Zap className="w-6 h-6" />
                                Get AI Recommendations
                            </>
                        )}
                    </button>
                </div>

                {/* Recommendations */}
                {recommendations && recommendations.recommendations && (
                    <div className="space-y-6">
                        {/* Budget Allocation Summary */}
                        {recommendations.budget_allocation && (
                            <div className="bg-blue-600 rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-6 h-6" />
                                    Recommended Budget Allocation
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {Object.entries(recommendations.budget_allocation).map(([platform, percentage]: [string, any]) => {
                                        // Handle case where percentage might be an object or a number
                                        const displayPercentage = typeof percentage === 'object'
                                            ? Object.values(percentage).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0)
                                            : percentage;
                                        return (
                                            <div key={platform} className="bg-white/20 rounded-lg p-4">
                                                <div className="text-sm text-white/90 mb-1">{platform}</div>
                                                <div className="text-3xl font-bold text-white">{displayPercentage}%</div>
                                                <div className="text-sm text-white/75 mt-1">
                                                    ${((formData.budget * parseFloat(String(displayPercentage))) / 100).toLocaleString()}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Platform Recommendations */}
                        <div className="grid grid-cols-1 gap-6">
                            {recommendations.recommendations.map((rec: any, idx: number) => (
                                <div key={idx} className="bg-white rounded-lg shadow overflow-hidden">
                                    {/* Header */}
                                    <div className={`p-6 ${idx === 0 ? 'bg-green-600' :
                                        idx === 1 ? 'bg-blue-600' :
                                            'bg-purple-600'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-2xl font-bold text-white">{rec.platform}</h3>
                                                    {idx === 0 && (
                                                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium text-white flex items-center gap-1">
                                                            <Sparkles className="w-4 h-4" />
                                                            Top Pick
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-white/90">Confidence Score: <span className="font-bold">{rec.confidence_score}%</span></p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-white/90">Recommended Budget</div>
                                                <div className="text-3xl font-bold text-white">${rec.recommended_budget?.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        {/* Expected ROI */}
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-green-600 font-medium">Expected ROI</div>
                                                    <div className="text-2xl font-bold text-gray-900">{rec.expected_roi}x</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reasoning */}
                                        {rec.reasoning && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                    <div className="font-semibold text-blue-700 mb-2">Audience Fit</div>
                                                    <p className="text-sm text-gray-600">{rec.reasoning.audience_fit}</p>
                                                </div>
                                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                                    <div className="font-semibold text-purple-700 mb-2">Cost Efficiency</div>
                                                    <p className="text-sm text-gray-600">{rec.reasoning.cost_efficiency}</p>
                                                </div>
                                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                                    <div className="font-semibold text-green-700 mb-2">Conversion Potential</div>
                                                    <p className="text-sm text-gray-600">{rec.reasoning.conversion_potential}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Expected Metrics */}
                                        {rec.expected_metrics && (
                                            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                                                <h4 className="font-semibold text-gray-900 mb-3">Expected Performance</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                    {[
                                                        { label: 'Impressions', value: rec.expected_metrics.impressions?.toLocaleString() },
                                                        { label: 'Clicks', value: rec.expected_metrics.clicks?.toLocaleString() },
                                                        { label: 'CTR', value: `${rec.expected_metrics.ctr}%` },
                                                        { label: 'CPC', value: `$${rec.expected_metrics.cpc}` },
                                                        { label: 'Conversions', value: rec.expected_metrics.conversions }
                                                    ].map((metric, i) => (
                                                        <div key={i}>
                                                            <div className="text-xs text-gray-500">{metric.label}</div>
                                                            <div className="text-lg font-bold text-gray-900">{metric.value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Pros & Cons */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                    Advantages
                                                </h4>
                                                <ul className="space-y-2">
                                                    {rec.pros?.map((pro: string, i: number) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm">
                                                            <span className="text-green-600 mt-0.5">✓</span>
                                                            <span className="text-gray-600">{pro}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <XCircle className="w-5 h-5 text-orange-600" />
                                                    Considerations
                                                </h4>
                                                <ul className="space-y-2">
                                                    {rec.cons?.map((con: string, i: number) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm">
                                                            <span className="text-orange-600 mt-0.5">⚠</span>
                                                            <span className="text-gray-600">{con}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Recommended Strategy */}
                                        {rec.recommended_strategy && (
                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
                                                <h4 className="font-semibold text-gray-900 mb-3">Recommended Strategy</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-start gap-2">
                                                        <strong className="text-gray-600 min-w-[100px]">Ad Types:</strong>
                                                        <span className="text-gray-900">{rec.recommended_strategy.ad_types?.join(', ')}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <strong className="text-gray-600 min-w-[100px]">Bidding:</strong>
                                                        <span className="text-gray-900">{rec.recommended_strategy.bidding_strategy}</span>
                                                    </div>
                                                    {rec.recommended_strategy.content_recommendations && (
                                                        <div>
                                                            <strong className="text-gray-600">Content Tips:</strong>
                                                            <ul className="list-disc list-inside ml-2 mt-1 text-gray-600">
                                                                {rec.recommended_strategy.content_recommendations.map((tip: string, i: number) => (
                                                                    <li key={i}>{tip}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={() => handleCreateCampaignFromRecommendation(rec)}
                                                disabled={creatingCampaign}
                                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 font-medium"
                                            >
                                                <Rocket className="w-5 h-5" />
                                                Create Campaign
                                            </button>
                                            <Link
                                                href={{
                                                    pathname: `/brand/${brandId}/create`,
                                                    query: {
                                                        title: `${rec.platform} Ad Content`,
                                                        description: rec.recommended_strategy?.content_recommendations?.[0] || `Create engaging content for ${rec.platform} advertising`,
                                                        contentType: 'image',
                                                        platform: rec.platform.toLowerCase(),
                                                        context: JSON.stringify({
                                                            source: 'ad-recommendations',
                                                            expectedRoi: rec.expected_roi,
                                                            budget: rec.recommended_budget,
                                                            adTypes: rec.recommended_strategy?.ad_types,
                                                            tips: rec.recommended_strategy?.content_recommendations
                                                        })
                                                    }
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
                                            >
                                                <Wand2 className="w-5 h-5" />
                                                Create Content for {rec.platform}
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Optimization Tips */}
                        {recommendations.optimization_tips && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-yellow-500" />
                                    Optimization Tips
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {recommendations.optimization_tips.map((tip: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <Target className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-700 mb-2">{tip}</p>
                                                <Link
                                                    href={{
                                                        pathname: `/brand/${brandId}/create`,
                                                        query: {
                                                            title: 'Content from AI Tip',
                                                            description: tip,
                                                            contentType: 'image',
                                                            context: JSON.stringify({
                                                                source: 'optimization-tip',
                                                                tip: tip
                                                            })
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 transition"
                                                >
                                                    <Wand2 className="w-3 h-3" />
                                                    Create Post from This Tip
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}