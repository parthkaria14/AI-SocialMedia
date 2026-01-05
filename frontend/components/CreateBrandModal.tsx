'use client';

import { useState } from 'react';
import { createBrand } from '@/lib/api';
import { X, Sparkles, Instagram, Twitter, Linkedin } from 'lucide-react';

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
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="modal-content max-w-md w-full animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Add New Brand</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm animate-fadeIn">
                            {error}
                        </div>
                    )}

                    {/* Brand Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Brand Name <span className="text-purple-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl"
                            placeholder="Nike"
                        />
                    </div>

                    {/* Instagram Handle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <span className="flex items-center gap-2">
                                <Instagram className="w-4 h-4 text-pink-400" />
                                Instagram Handle <span className="text-purple-400">*</span>
                            </span>
                        </label>
                        <div className="flex items-center">
                            <span className="bg-white/5 px-4 py-3 border border-white/10 border-r-0 rounded-l-xl text-gray-400">
                                @
                            </span>
                            <input
                                type="text"
                                required
                                value={formData.instagram_handle}
                                onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                                className="flex-1 px-4 py-3 rounded-l-none rounded-r-xl !border-l-0"
                                placeholder="nike"
                            />
                        </div>
                    </div>

                    {/* Twitter Handle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <span className="flex items-center gap-2">
                                <Twitter className="w-4 h-4 text-blue-400" />
                                Twitter Handle <span className="text-gray-500">(Optional)</span>
                            </span>
                        </label>
                        <div className="flex items-center">
                            <span className="bg-white/5 px-4 py-3 border border-white/10 border-r-0 rounded-l-xl text-gray-400">
                                @
                            </span>
                            <input
                                type="text"
                                value={formData.twitter_handle}
                                onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                                className="flex-1 px-4 py-3 rounded-l-none rounded-r-xl !border-l-0"
                                placeholder="nike"
                            />
                        </div>
                    </div>

                    {/* LinkedIn Handle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <span className="flex items-center gap-2">
                                <Linkedin className="w-4 h-4 text-blue-500" />
                                LinkedIn Handle <span className="text-gray-500">(Optional)</span>
                            </span>
                        </label>
                        <input
                            type="text"
                            value={formData.linkedin_handle}
                            onChange={(e) => setFormData({ ...formData, linkedin_handle: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl"
                            placeholder="nike"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-300">
                                <span className="text-purple-400 font-medium">AI Analysis:</span> After creating the brand, we'll automatically analyze their Instagram profile and generate insights. This may take 1-2 minutes.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                        >
                            <span className="relative z-10">
                                {loading ? 'Creating...' : 'Create Brand'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}