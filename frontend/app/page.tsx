'use client';

import { useState, useEffect } from 'react';
import { getBrands, deleteBrand, type Brand } from '@/lib/api';
import { Plus, TrendingUp, Users, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';
import CreateBrandModal from '@/components/CreateBrandModal';

export default function Dashboard() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleBrandCreated = () => {
    setShowCreateModal(false);
    loadBrands();
  };

  const handleDeleteBrand = async (brandId: number, brandName: string) => {
    if (!confirm(`Are you sure you want to delete "${brandName}"? This will delete all posts, analytics, and strategies.`)) {
      return;
    }

    try {
      await deleteBrand(brandId);
      loadBrands();
    } catch (error) {
      alert('Failed to delete brand');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              AI Social Media Agency
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add Brand
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {brands.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No Brands Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Get started by adding your first brand to manage
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Add Your First Brand
            </button>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Brands</p>
                    <p className="text-3xl font-bold text-gray-900">{brands.length}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Brands</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {brands.filter(b => b.brand_profile).length}
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Content Ready</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {brands.filter(b => b.brand_profile).length}
                    </p>
                  </div>
                  <FileText className="w-12 h-12 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Brands Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition relative"
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteBrand(brand.id, brand.name);
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
                    title="Delete brand"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <Link href={`/brand/${brand.id}`} className="block">
                    <div className="flex items-start justify-between mb-4 pr-8">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {brand.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          @{brand.instagram_handle}
                        </p>
                      </div>
                      {brand.brand_profile ? (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Analyzing
                        </span>
                      )}
                    </div>

                    {brand.brand_profile && (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-600">Voice:</span>
                          <span className="ml-2 font-medium capitalize">
                            {brand.brand_profile.brand_voice || 'N/A'}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Audience:</span>
                          <span className="ml-2 font-medium">
                            {(() => {
                              const audience = brand.brand_profile.target_audience;
                              if (typeof audience === 'string') {
                                return audience.slice(0, 40);
                              } else if (audience && typeof audience === 'object') {
                                // Handle object case (demographics, interests)
                                const demo = audience.demographics || '';
                                const interests = audience.interests || '';
                                const text = demo || interests || 'Various audiences';
                                return typeof text === 'string' ? text.slice(0, 40) : 'Various audiences';
                              }
                              return 'N/A';
                            })()}...
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t">
                      <span className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                        Manage Brand →
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Create Brand Modal */}
      {showCreateModal && (
        <CreateBrandModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleBrandCreated}
        />
      )}
    </div>
  );
}