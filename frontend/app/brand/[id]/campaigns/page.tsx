'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getBrand, getBrandCampaigns, createCampaign, updateCampaignStatus, deleteCampaign, analyzeCampaign, generateCampaignStrategy } from '@/lib/api';
import { Plus, Rocket, DollarSign, Target, Calendar, TrendingUp, Activity, Play, Pause, CheckCircle, Trash2, BarChart3, Lightbulb, X, Sparkles, Eye } from 'lucide-react';
import Link from 'next/link';
import BrandNavBar from '@/components/BrandNavBar';

export default function CampaignsPage() {
    const params = useParams();
    const brandId = parseInt(params.id as string);

    const [brand, setBrand] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [brandId]);

    const loadData = async () => {
        try {
            const [brandData, campaignsData] = await Promise.all([
                getBrand(brandId),
                getBrandCampaigns(brandId)
            ]);
            setBrand(brandData);
            setCampaigns(campaignsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (campaignId: number, newStatus: string) => {
        try {
            await updateCampaignStatus(campaignId, newStatus);
            loadData();
        } catch (error) {
            alert('Failed to update campaign status');
        }
    };

    const handleDelete = async (campaignId: number) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;
        try {
            await deleteCampaign(campaignId);
            loadData();
        } catch (error) {
            alert('Failed to delete campaign');
        }
    };

    const openCampaignDetail = (campaign: any) => {
        setSelectedCampaign(campaign);
        setShowDetailModal(true);
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

    const stats = {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
        totalSpent: campaigns.reduce((sum, c) => sum + (c.spent || 0), 0)
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Shared Navigation Bar */}
            <BrandNavBar brandId={brandId} brandName={brand?.brand?.name} />

            {/* Action Bar */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Campaign Command Center</h2>
                            <p className="text-gray-600 text-sm">Manage and monitor your campaigns</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Launch Campaign
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Link
                        href={`/brand/${brandId}/ad-recommendations`}
                        className="group bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all border-l-4 border-blue-600"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">AI Platform Recommendations</h3>
                                <p className="text-gray-600">Get intelligent insights for optimal ad spend allocation</p>
                            </div>
                            <div className="bg-blue-100 rounded-lg p-3">
                                <Sparkles className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </Link>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="group bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all border-l-4 border-green-600 text-left"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Create New Campaign</h3>
                                <p className="text-gray-600">Launch organic or paid campaigns across platforms</p>
                            </div>
                            <div className="bg-green-100 rounded-lg p-3">
                                <Rocket className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Campaigns', value: stats.total, icon: Activity, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
                        { label: 'Active Now', value: stats.active, icon: Rocket, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
                        { label: 'Total Budget', value: `$${stats.totalBudget.toLocaleString()}`, icon: DollarSign, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
                        { label: 'Total Spent', value: `$${stats.totalSpent.toLocaleString()}`, icon: TrendingUp, bgColor: 'bg-orange-100', iconColor: 'text-orange-600' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white rounded-lg shadow p-5">
                            <div className={`w-10 h-10 mb-3 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Campaigns List */}
                {campaigns.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-16 text-center">
                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                            <Rocket className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Campaigns Yet</h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">Launch your first campaign and start reaching your audience with AI-powered insights</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all font-medium"
                        >
                            Create Your First Campaign
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {campaigns.map((campaign) => (
                            <div key={campaign.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-all">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h3 className="text-xl font-bold text-gray-900">{campaign.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                                                        campaign.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                                            'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {campaign.status}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${campaign.campaign_type === 'paid' ? 'bg-purple-100 text-purple-700' :
                                                    campaign.campaign_type === 'organic' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {campaign.campaign_type}
                                                </span>
                                            </div>
                                            <p className="text-gray-600">{campaign.description}</p>
                                        </div>
                                        <div className="text-right ml-6">
                                            <div className="text-sm text-gray-500">Budget</div>
                                            <div className="text-2xl font-bold text-gray-900">${campaign.budget?.toLocaleString()}</div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                Spent: <span className="text-orange-600">${campaign.spent?.toLocaleString() || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Campaign Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                            <Target className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <div className="text-xs text-gray-500">Objectives</div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {campaign.objectives?.slice(0, 2).join(', ') || 'Not set'}
                                                    {campaign.objectives?.length > 2 && ` +${campaign.objectives.length - 2}`}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                            <Activity className="w-5 h-5 text-purple-600" />
                                            <div>
                                                <div className="text-xs text-gray-500">Platforms</div>
                                                <div className="text-sm font-medium text-gray-900 capitalize">
                                                    {campaign.platforms?.slice(0, 2).join(', ') || 'Not set'}
                                                    {campaign.platforms?.length > 2 && ` +${campaign.platforms.length - 2}`}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                            <Calendar className="w-5 h-5 text-green-600" />
                                            <div>
                                                <div className="text-xs text-gray-500">Duration</div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'Not started'}
                                                    {' - '}
                                                    {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Ongoing'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Performance Metrics */}
                                    {campaign.total_impressions > 0 && (
                                        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            {[
                                                { label: 'Impressions', value: campaign.total_impressions?.toLocaleString() },
                                                { label: 'Clicks', value: campaign.total_clicks?.toLocaleString() },
                                                { label: 'Conversions', value: campaign.total_conversions?.toLocaleString() },
                                                { label: 'CTR', value: campaign.total_clicks > 0 ? `${((campaign.total_clicks / campaign.total_impressions) * 100).toFixed(2)}%` : '0.00%' }
                                            ].map((metric, idx) => (
                                                <div key={idx}>
                                                    <div className="text-xs text-gray-500">{metric.label}</div>
                                                    <div className="text-lg font-bold text-gray-900">{metric.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => openCampaignDetail(campaign)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Details
                                        </button>

                                        {campaign.status === 'draft' && (
                                            <button
                                                onClick={() => handleStatusChange(campaign.id, 'active')}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                                            >
                                                <Play className="w-4 h-4" />
                                                Activate
                                            </button>
                                        )}

                                        {campaign.status === 'active' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange(campaign.id, 'paused')}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors"
                                                >
                                                    <Pause className="w-4 h-4" />
                                                    Pause
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(campaign.id, 'completed')}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Complete
                                                </button>
                                            </>
                                        )}

                                        {campaign.status === 'paused' && (
                                            <button
                                                onClick={() => handleStatusChange(campaign.id, 'active')}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                                            >
                                                <Play className="w-4 h-4" />
                                                Resume
                                            </button>
                                        )}

                                        <div className="flex-1"></div>

                                        <button
                                            onClick={() => handleDelete(campaign.id)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Campaign Modal */}
            {showCreateModal && (
                <CreateCampaignModal
                    brandId={brandId}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadData();
                    }}
                />
            )}

            {/* Campaign Detail Modal */}
            {showDetailModal && selectedCampaign && (
                <CampaignDetailModal
                    campaign={selectedCampaign}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedCampaign(null);
                    }}
                    onRefresh={loadData}
                />
            )}
        </div>
    );
}

// Create Campaign Modal Component
function CreateCampaignModal({ brandId, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        campaign_type: 'organic',
        platforms: [] as string[],
        objectives: [] as string[],
        budget: 0,
        start_date: '',
        end_date: ''
    });
    const [loading, setLoading] = useState(false);

    const platformOptions = ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'Google Ads', 'TikTok'];
    const objectiveOptions = ['Brand Awareness', 'Engagement', 'Conversions', 'Traffic', 'Leads'];

    const togglePlatform = (platform: string) => {
        if (formData.platforms.includes(platform)) {
            setFormData({ ...formData, platforms: formData.platforms.filter(p => p !== platform) });
        } else {
            setFormData({ ...formData, platforms: [...formData.platforms, platform] });
        }
    };

    const toggleObjective = (objective: string) => {
        if (formData.objectives.includes(objective)) {
            setFormData({ ...formData, objectives: formData.objectives.filter(o => o !== objective) });
        } else {
            setFormData({ ...formData, objectives: [...formData.objectives, objective] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createCampaign({
                brand_id: brandId,
                ...formData
            });
            onSuccess();
        } catch (error) {
            alert('Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Create Campaign</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-80px)]">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="Summer 2024 Launch"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                            rows={3}
                            placeholder="Describe your campaign goals..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Campaign Type *</label>
                        <div className="flex gap-3">
                            {['organic', 'paid', 'mixed'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, campaign_type: type })}
                                    className={`flex-1 px-4 py-3 rounded-lg capitalize transition-all font-medium ${formData.campaign_type === type
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Platforms *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {platformOptions.map((platform) => (
                                <button
                                    key={platform}
                                    type="button"
                                    onClick={() => togglePlatform(platform)}
                                    className={`px-4 py-3 rounded-lg text-sm transition-all font-medium ${formData.platforms.includes(platform)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                        }`}
                                >
                                    {platform}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Objectives *</label>
                        <div className="flex flex-wrap gap-2">
                            {objectiveOptions.map((objective) => (
                                <button
                                    key={objective}
                                    type="button"
                                    onClick={() => toggleObjective(objective)}
                                    className={`px-4 py-2 rounded-lg text-sm transition-all font-medium ${formData.objectives.includes(objective)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                        }`}
                                >
                                    {objective}
                                </button>
                            ))}
                        </div>
                    </div>

                    {formData.campaign_type !== 'organic' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Budget ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="number"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    min="0"
                                    step="100"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name || formData.platforms.length === 0}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                        >
                            {loading ? 'Creating...' : 'Launch Campaign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Campaign Detail Modal with AI Analysis
function CampaignDetailModal({ campaign, onClose, onRefresh }: any) {
    const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'strategy'>('overview');
    const [analysis, setAnalysis] = useState<any>(null);
    const [strategy, setStrategy] = useState<any>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [loadingStrategy, setLoadingStrategy] = useState(false);

    const handleAnalyze = async () => {
        setLoadingAnalysis(true);
        try {
            const result = await analyzeCampaign(campaign.id);
            setAnalysis(result.analysis);
            setActiveTab('analysis');
        } catch (error) {
            alert('Failed to analyze campaign');
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const handleGenerateStrategy = async () => {
        setLoadingStrategy(true);
        try {
            const result = await generateCampaignStrategy(campaign.id);
            setStrategy(result.strategy);
            setActiveTab('strategy');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to generate strategy');
        } finally {
            setLoadingStrategy(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{campaign.name}</h2>
                            <p className="text-gray-600">{campaign.description}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        {[
                            { id: 'overview', label: 'Overview', icon: Eye },
                            { id: 'analysis', label: 'AI Analysis', icon: BarChart3 },
                            { id: 'strategy', label: 'Strategy', icon: Lightbulb }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Campaign Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Status', value: campaign.status, color: 'text-green-600' },
                                    { label: 'Type', value: campaign.campaign_type, color: 'text-purple-600' },
                                    { label: 'Budget', value: `$${campaign.budget?.toLocaleString()}`, color: 'text-blue-600' },
                                    { label: 'Spent', value: `$${campaign.spent?.toLocaleString() || 0}`, color: 'text-orange-600' }
                                ].map((stat, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                                        <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                                        <div className={`text-lg font-bold capitalize ${stat.color}`}>{stat.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-500 mb-3">Platforms</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {campaign.platforms?.map((platform: string, idx: number) => (
                                            <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                                {platform}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-500 mb-3">Objectives</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {campaign.objectives?.map((obj: string, idx: number) => (
                                            <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                                {obj}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* AI Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loadingAnalysis}
                                    className="flex items-center justify-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-100 transition-all disabled:opacity-50"
                                >
                                    <BarChart3 className="w-5 h-5" />
                                    {loadingAnalysis ? 'Analyzing...' : 'Run AI Performance Analysis'}
                                </button>
                                <button
                                    onClick={handleGenerateStrategy}
                                    disabled={loadingStrategy}
                                    className="flex items-center justify-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 hover:bg-purple-100 transition-all disabled:opacity-50"
                                >
                                    <Lightbulb className="w-5 h-5" />
                                    {loadingStrategy ? 'Generating...' : 'Generate AI Strategy'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analysis' && (
                        <div className="space-y-6">
                            {analysis ? (
                                <>
                                    {/* Performance Score */}
                                    <div className={`p-6 rounded-lg border ${analysis.overall_performance === 'excellent' ? 'bg-green-50 border-green-200' :
                                        analysis.overall_performance === 'good' ? 'bg-blue-50 border-blue-200' :
                                            analysis.overall_performance === 'average' ? 'bg-yellow-50 border-yellow-200' :
                                                'bg-red-50 border-red-200'
                                        }`}>
                                        <div className="text-sm text-gray-500 mb-2">Overall Performance</div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-3xl font-bold capitalize ${analysis.overall_performance === 'excellent' ? 'text-green-600' :
                                                analysis.overall_performance === 'good' ? 'text-blue-600' :
                                                    analysis.overall_performance === 'average' ? 'text-yellow-600' :
                                                        'text-red-600'
                                                }`}>
                                                {analysis.overall_performance}
                                            </span>
                                            {analysis.performance_score && (
                                                <span className="text-gray-600 text-xl">({analysis.performance_score}/100)</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Key Insights */}
                                    {analysis.key_insights && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-lg font-bold text-gray-900 mb-4">Key Insights</h4>
                                            <div className="space-y-3">
                                                {analysis.key_insights.map((insight: any, idx: number) => (
                                                    <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                                                                insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-green-100 text-green-700'
                                                                }`}>
                                                                {insight.impact} impact
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-900 font-medium">{insight.insight}</p>
                                                        <p className="text-gray-600 text-sm mt-1">{insight.recommendation}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* What's Working / Needs Improvement */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {analysis.what_is_working && (
                                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                                <h4 className="text-green-700 font-bold mb-3">✓ What's Working</h4>
                                                <ul className="space-y-2">
                                                    {analysis.what_is_working.map((item: string, idx: number) => (
                                                        <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                                                            <span className="text-green-600">•</span>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {analysis.what_needs_improvement && (
                                            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                                <h4 className="text-orange-700 font-bold mb-3">⚠ Needs Improvement</h4>
                                                <ul className="space-y-2">
                                                    {analysis.what_needs_improvement.map((item: string, idx: number) => (
                                                        <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                                                            <span className="text-orange-600">•</span>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Next Steps */}
                                    {analysis.next_steps && (
                                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                            <h4 className="text-purple-700 font-bold mb-3">Next Steps</h4>
                                            <ol className="space-y-2">
                                                {analysis.next_steps.map((step: string, idx: number) => (
                                                    <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                                                        <span className="text-purple-600 font-bold">{idx + 1}.</span>
                                                        {step}
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600 mb-4">No analysis yet. Run AI analysis to get insights.</p>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={loadingAnalysis}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                                    >
                                        {loadingAnalysis ? 'Analyzing...' : 'Run AI Analysis'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'strategy' && (
                        <div className="space-y-6">
                            {strategy ? (
                                <>
                                    {/* Campaign Theme */}
                                    <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                                        <div className="text-sm text-gray-500 mb-2">Campaign Theme</div>
                                        <h3 className="text-2xl font-bold text-gray-900">{strategy.campaign_name || strategy.campaign_theme}</h3>
                                        {strategy.campaign_theme && strategy.campaign_name && (
                                            <p className="text-gray-600 mt-2">{strategy.campaign_theme}</p>
                                        )}
                                    </div>

                                    {/* KPI Targets */}
                                    {strategy.kpi_targets && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-lg font-bold text-gray-900 mb-4">KPI Targets</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                {Object.entries(strategy.kpi_targets).map(([key, value]: [string, any], idx) => (
                                                    <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                                                        <div className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</div>
                                                        <div className="text-lg font-bold text-gray-900">{value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Content Calendar Preview */}
                                    {strategy.content_calendar && strategy.content_calendar.length > 0 && (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-lg font-bold text-gray-900 mb-4">Content Calendar (First 7 Days)</h4>
                                            <div className="space-y-3">
                                                {strategy.content_calendar.slice(0, 7).map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-4 bg-white rounded-lg p-3 shadow-sm">
                                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                                            <span className="text-purple-700 font-bold">D{item.day}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-gray-900 font-medium">{item.content_idea}</div>
                                                            <div className="text-gray-500 text-sm">{item.platform} • {item.content_type} • {item.optimal_time}</div>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded text-xs ${item.expected_engagement === 'high' ? 'bg-green-100 text-green-700' :
                                                            item.expected_engagement === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {item.expected_engagement} engagement
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Success Criteria */}
                                    {strategy.success_criteria && (
                                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                            <h4 className="text-green-700 font-bold mb-3">Success Criteria</h4>
                                            <ul className="space-y-2">
                                                {strategy.success_criteria.map((criteria: string, idx: number) => (
                                                    <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                                        {criteria}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600 mb-4">No strategy generated yet. Generate an AI-powered strategy.</p>
                                    <button
                                        onClick={handleGenerateStrategy}
                                        disabled={loadingStrategy}
                                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
                                    >
                                        {loadingStrategy ? 'Generating...' : 'Generate Strategy'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}