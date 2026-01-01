/**
 * Helper utilities for data handling
 */

/**
 * Safely get array from various data types
 */
export function ensureArray<T>(data: any): T[] {
    if (Array.isArray(data)) {
        return data;
    }
    if (typeof data === 'string') {
        // Try to parse if it's JSON string
        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            return [data] as T[];
        } catch {
            return [data] as T[];
        }
    }
    if (data && typeof data === 'object') {
        // If it's an object, try to get values
        return Object.values(data) as T[];
    }
    return [];
}

/**
 * Safely get string from various data types
 */
export function ensureString(data: any): string {
    if (typeof data === 'string') {
        return data;
    }
    if (Array.isArray(data)) {
        return data.join(', ');
    }
    if (data && typeof data === 'object') {
        return JSON.stringify(data);
    }
    return String(data || '');
}

/**
 * Safely truncate string
 */
export function truncate(str: string, length: number): string {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Show relative time for recent dates
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    // Otherwise show full date
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString('en-US');
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(likes: number, comments: number, followers: number): number {
    if (!followers || followers === 0) return 0;
    const engagement = likes + comments;
    return Math.round((engagement / followers) * 10000) / 100;
}

/**
 * Get platform icon/emoji
 */
export function getPlatformEmoji(platform: string): string {
    const emojis: Record<string, string> = {
        instagram: '📷',
        twitter: '🐦',
        linkedin: '💼',
        facebook: '👥',
        tiktok: '🎵',
    };
    return emojis[platform.toLowerCase()] || '📱';
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-800',
        scheduled: 'bg-blue-100 text-blue-800',
        posted: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

/**
 * Validate content idea structure
 */
export function validateContentIdea(idea: any): boolean {
    return (
        idea &&
        typeof idea === 'object' &&
        'title' in idea &&
        'description' in idea
    );
}