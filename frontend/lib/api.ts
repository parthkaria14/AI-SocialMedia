import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Brand {
    id: number;
    name: string;
    instagram_handle: string;
    twitter_handle?: string;
    linkedin_handle?: string;
    brand_profile?: any;
    created_at: string;
    last_synced?: string;
}

export interface Post {
    id: number;
    brand_id: number;
    platform: string;
    content_type: string;
    caption: string;
    hashtags: string[];
    status: string;
    scheduled_time?: string;
    created_at: string;
}

export interface ContentIdea {
    title: string;
    description: string;
    content_type: string;
    caption_hook: string;
    hashtag_suggestions: string[];
}

// Brand APIs
export const createBrand = async (data: {
    name: string;
    instagram_handle: string;
    twitter_handle?: string;
    linkedin_handle?: string;
}) => {
    const response = await api.post('/brands/', data);
    return response.data;
};

export const getBrands = async () => {
    const response = await api.get<Brand[]>('/brands/');
    return response.data;
};

export const getBrand = async (brandId: number) => {
    const response = await api.get(`/brands/${brandId}`);
    return response.data;
};

export const syncBrand = async (brandId: number) => {
    const response = await api.post(`/brands/${brandId}/sync`);
    return response.data;
};

// Content APIs
export const generateContent = async (brandId: number, platform: string = 'instagram', count: number = 5) => {
    const response = await api.post('/content/generate', {
        brand_id: brandId,
        platform,
        count,
    });
    return response.data;
};

export const generateCaption = async (brandId: number, contentIdea: any, platform: string = 'instagram') => {
    const response = await api.post('/content/caption', contentIdea, {
        params: { brand_id: brandId, platform },
    });
    return response.data;
};

export const generateMultiplatformCaptions = async (brandId: number, contentIdea: any) => {
    const response = await api.post('/content/caption-multiplatform', contentIdea, {
        params: { brand_id: brandId },
    });
    return response.data;
};

// Post APIs
export const createPost = async (data: {
    brand_id: number;
    platform: string;
    content_type: string;
    caption: string;
    hashtags: string[];
    media_urls?: string[];
    scheduled_time?: string;
}) => {
    const response = await api.post('/posts/', data);
    return response.data;
};

export const getBrandPosts = async (brandId: number, status?: string) => {
    const response = await api.get(`/posts/brand/${brandId}`, {
        params: status ? { status } : {},
    });
    return response.data;
};

// Analytics APIs
export const getBrandAnalytics = async (brandId: number) => {
    const response = await api.get(`/analytics/brand/${brandId}`);
    return response.data;
};

// Strategy APIs
export const generateStrategy = async (brandId: number) => {
    const response = await api.post(`/strategy/generate/${brandId}`);
    return response.data;
};

// Image APIs
export const generateImages = async (brandId: number, contentIdeas: any[], count: number = 3) => {
    const response = await api.post('/images/generate', {
        brand_id: brandId,
        content_ideas: contentIdeas,
        count,
    });
    return response.data;
};

export const generateSingleImage = async (prompt: string, title: string = "", width: number = 1080, height: number = 1080, addText: boolean = false, language: string = "english") => {
    const response = await api.post('/images/generate-single', null, {
        params: { prompt, title, width, height, add_text: addText, language },
    });

    // Prepend the backend URL to the image path since images are served from the backend
    if (response.data.success && response.data.url) {
        response.data.url = `${API_BASE_URL}${response.data.url}`;
    }

    return response.data;
};

// Delete Brand
export const deleteBrand = async (brandId: number) => {
    const response = await api.delete(`/brands/${brandId}`);
    return response.data;
};

// Competitor Analysis
export const analyzeCompetitors = async (brandId: number, competitorHandles: string[]) => {
    const response = await api.post('/competitors/analyze', {
        brand_id: brandId,
        competitor_handles: competitorHandles
    });
    return response.data;
};

export const getTrendingContent = async (competitorHandles: string[]) => {
    const response = await api.post('/competitors/trending', {
        competitor_handles: competitorHandles
    });
    return response.data;
};

// Chart Data
export const getChartData = async (brandId: number, days: number = 30) => {
    const response = await api.get(`/analytics/chart-data/${brandId}`, {
        params: { days },
    });
    return response.data;
};
// Campaign Management APIs
export const createCampaign = async (data: {
    brand_id: number;
    name: string;
    description: string;
    campaign_type: string;
    platforms: string[];
    objectives: string[];
    budget: number;
    start_date?: string;
    end_date?: string;
}) => {
    const response = await api.post('/campaigns/', data);
    return response.data;
};

export const getBrandCampaigns = async (brandId: number) => {
    const response = await api.get(`/campaigns/brand/${brandId}`);
    return response.data;
};

export const getAdRecommendations = async (brandId: number, objectives: string[], budget: number, targetMetrics: any) => {
    const response = await api.post('/campaigns/ad-recommendations', {
        brand_id: brandId,
        objectives,
        budget,
        target_metrics: targetMetrics
    });
    return response.data;
};

export const getCampaignPerformance = async (campaignId: number) => {
    const response = await api.get(`/campaigns/${campaignId}/performance`);
    return response.data;
};

export const updateCampaign = async (campaignId: number, data: {
    name?: string;
    description?: string;
    campaign_type?: string;
    platforms?: string[];
    objectives?: string[];
    budget?: number;
    start_date?: string;
    end_date?: string;
}) => {
    const response = await api.put(`/campaigns/${campaignId}`, data);
    return response.data;
};

export const deleteCampaign = async (campaignId: number) => {
    const response = await api.delete(`/campaigns/${campaignId}`);
    return response.data;
};

export const updateCampaignStatus = async (campaignId: number, status: string) => {
    const response = await api.patch(`/campaigns/${campaignId}/status`, { status });
    return response.data;
};

export const analyzeCampaign = async (campaignId: number) => {
    const response = await api.post(`/campaigns/${campaignId}/analyze`);
    return response.data;
};

export const generateCampaignStrategy = async (campaignId: number, durationDays: number = 30) => {
    const response = await api.post(`/campaigns/${campaignId}/strategy`, null, {
        params: { duration_days: durationDays }
    });
    return response.data;
};

export default api;