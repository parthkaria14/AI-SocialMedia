'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, LayoutGrid, FileText, Rocket, BarChart3, DollarSign, Users } from 'lucide-react';

interface BrandNavBarProps {
    brandId: number;
    brandName?: string;
}

export default function BrandNavBar({ brandId, brandName }: BrandNavBarProps) {
    const pathname = usePathname();

    const tabs = [
        { id: 'overview', href: `/brand/${brandId}`, label: 'Overview', icon: LayoutGrid },
        { id: 'campaigns', href: `/brand/${brandId}/campaigns`, label: 'Campaigns', icon: Rocket },
        { id: 'analytics', href: `/brand/${brandId}/analytics`, label: 'Analytics', icon: BarChart3 },
        { id: 'ad-recommendations', href: `/brand/${brandId}/ad-recommendations`, label: 'Ad Recommendations', icon: DollarSign },
        { id: 'competitors', href: `/brand/${brandId}/competitors`, label: 'Competitors', icon: Users },
    ];

    const isActive = (href: string) => {
        if (href === `/brand/${brandId}`) {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top row with back button and brand name */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        {brandName && (
                            <h1 className="text-lg font-semibold text-gray-900">{brandName}</h1>
                        )}
                    </div>
                </div>

                {/* Tab navigation */}
                <div className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = isActive(tab.href);
                        return (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${active
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
