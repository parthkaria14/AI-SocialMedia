'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, LayoutGrid, FileText, Rocket, BarChart3, DollarSign, Users, Sparkles } from 'lucide-react';

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
        <div className="sticky top-0 z-40 glass-card border-x-0 border-t-0 rounded-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top row with back button and brand name */}
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="group flex items-center gap-2 text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all duration-300"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                        </Link>
                        {brandName && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white">{brandName}</h1>
                                    <p className="text-xs text-gray-500">Brand Dashboard</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab navigation */}
                <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = isActive(tab.href);
                        return (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                className={`group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-300 ${active
                                        ? 'text-white bg-white/10'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 transition-all duration-300 ${active
                                        ? 'text-purple-400'
                                        : 'group-hover:text-purple-400 group-hover:scale-110'
                                    }`} />
                                <span>{tab.label}</span>

                                {/* Active indicator */}
                                {active && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
