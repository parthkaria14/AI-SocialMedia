'use client';

import { useState, useEffect } from 'react';
import { getBrands, deleteBrand } from '@/lib/api';
import { Plus, Sparkles, Activity, Trash2, ArrowRight, Layers, Instagram } from 'lucide-react';
import Link from 'next/link';
import CreateBrandModal from '@/components/CreateBrandModal';
import { RingLoader } from '@/components/Loaders';

export default function Dashboard() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingBrand, setDeletingBrand] = useState<number | null>(null);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const data = await getBrands();
      setBrands(data);
    } catch (error) {
      console.error('Failed to load brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async (brandId: number) => {
    if (!confirm('Delete this brand?')) return;
    setDeletingBrand(brandId);
    try {
      await deleteBrand(brandId);
      await loadBrands();
    } catch (error) {
      alert('Failed to delete brand');
    } finally {
      setDeletingBrand(null);
    }
  };

  // Check if brand has been analyzed (brand_profile is populated)
  const isAnalyzed = (brand: any) => {
    return brand.brand_profile && Object.keys(brand.brand_profile).length > 0;
  };

  // Count analyzed brands
  const analyzedCount = brands.filter(isAnalyzed).length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <RingLoader size={56} />
        <div className="text-center">
          <p className="text-[var(--text-secondary)] text-sm">Loading your brands...</p>
          <div className="w-48 mt-4">
            <div className="loader-wave" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header - Clean and Clear */}
      <header className="sticky top-0 z-50 border-b border-[var(--glass-border)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Social AI</h1>
                <p className="text-xs text-[var(--text-muted)]">Brand Management</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Brand
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats - Simple Numbers */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--glass-border)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Layers className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Total Brands</span>
            </div>
            <p className="text-3xl font-bold text-white">{brands.length}</p>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--glass-border)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Analyzed</span>
            </div>
            <p className="text-3xl font-bold text-white">{analyzedCount}</p>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-medium text-white">Your Brands</h2>
          <span className="text-sm text-[var(--text-muted)]">{brands.length} total</span>
        </div>

        {/* Brands Grid */}
        {brands.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-16 text-center border border-[var(--glass-border)]">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-5">
              <Layers className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No brands yet</h3>
            <p className="text-[var(--text-secondary)] mb-6 text-sm max-w-sm mx-auto">
              Create your first brand to start generating AI-powered content
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Brand
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center text-violet-400 font-semibold text-sm">
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{brand.name}</h3>
                      {brand.instagram_handle && (
                        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                          <Instagram className="w-3 h-3" />
                          @{brand.instagram_handle}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBrand(brand.id)}
                    disabled={deletingBrand === brand.id}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className={`w-4 h-4 ${deletingBrand === brand.id ? 'animate-pulse' : ''}`} />
                  </button>
                </div>

                {/* Show analysis status */}
                <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                  {isAnalyzed(brand) ? (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ✓ Analyzed
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Pending analysis
                    </span>
                  )}
                </div>

                <Link
                  href={`/brand/${brand.id}`}
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg bg-[var(--bg-tertiary)] text-sm text-[var(--text-secondary)] hover:text-white hover:bg-violet-600/20 transition-all"
                >
                  <span>Manage Brand</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateBrandModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadBrands();
          }}
        />
      )}
    </div>
  );
}