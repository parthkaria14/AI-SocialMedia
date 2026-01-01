'use client';

import { useState } from 'react';
import { createBrand } from '@/lib/api';
import { X } from 'lucide-react';

interface CreateBrandModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateBrandModal({ onClose, onSuccess }: CreateBrandModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        instagram_handle: '',
        twitter_handle: '',
        linkedin_handle: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await createBrand(formData);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create brand');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Add New Brand</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Brand Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nike"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Instagram Handle *
                        </label>
                        <div className="flex items-center">
                            <span className="bg-gray-100 px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                                @
                            </span>
                            <input
                                type="text"
                                required
                                value={formData.instagram_handle}
                                onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="nike"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Twitter Handle (Optional)
                        </label>
                        <div className="flex items-center">
                            <span className="bg-gray-100 px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                                @
                            </span>
                            <input
                                type="text"
                                value={formData.twitter_handle}
                                onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="nike"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            LinkedIn Handle (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.linkedin_handle}
                            onChange={(e) => setFormData({ ...formData, linkedin_handle: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="nike"
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> After creating the brand, we'll automatically analyze their Instagram profile and generate insights. This may take 1-2 minutes.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Brand'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}