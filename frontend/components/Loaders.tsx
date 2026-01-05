'use client';

import { useEffect, useState } from 'react';

interface ProgressLoaderProps {
    isLoading: boolean;
    duration?: number;
    onComplete?: () => void;
}

// Smooth wave loader at top of page
export function WaveLoader() {
    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <div className="loader-wave" />
        </div>
    );
}

// Elegant dots loader
export function DotsLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeMap = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-3 h-3'
    };

    return (
        <div className="loader-dots">
            <span className={`${sizeMap[size]} rounded-full bg-[var(--accent-primary)]`} style={{ animationDelay: '0s' }} />
            <span className={`${sizeMap[size]} rounded-full bg-[var(--accent-primary)]`} style={{ animationDelay: '0.2s' }} />
            <span className={`${sizeMap[size]} rounded-full bg-[var(--accent-primary)]`} style={{ animationDelay: '0.4s' }} />
        </div>
    );
}

// Ring spinner
export function RingLoader({ size = 48 }: { size?: number }) {
    return (
        <div
            className="loader-ring"
            style={{ width: size, height: size }}
        />
    );
}

// Progress bar with smooth animation
export function ProgressBar({
    value,
    showLabel = false,
    variant = 'default'
}: {
    value: number;
    showLabel?: boolean;
    variant?: 'default' | 'success' | 'warning';
}) {
    const gradients = {
        default: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
        success: 'linear-gradient(90deg, #10b981, #34d399)',
        warning: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
    };

    return (
        <div className="w-full">
            <div className="progress-bar">
                <div
                    className="progress-bar-fill"
                    style={{
                        width: `${Math.min(100, Math.max(0, value))}%`,
                        background: gradients[variant]
                    }}
                />
            </div>
            {showLabel && (
                <p className="text-xs text-[var(--text-muted)] mt-1 text-right">
                    {Math.round(value)}%
                </p>
            )}
        </div>
    );
}

// Simulated progress loader (for perceived performance)
export function SimulatedLoader({
    isLoading,
    duration = 2000,
    onComplete
}: ProgressLoaderProps) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isLoading) {
            setProgress(0);
            return;
        }

        // Non-linear progress simulation
        const steps = [
            { target: 30, duration: duration * 0.1 },
            { target: 60, duration: duration * 0.3 },
            { target: 85, duration: duration * 0.4 },
            { target: 90, duration: duration * 0.2 },
        ];

        let timeout: NodeJS.Timeout;
        let step = 0;

        const animate = () => {
            if (step < steps.length) {
                setProgress(steps[step].target);
                timeout = setTimeout(animate, steps[step].duration);
                step++;
            }
        };

        animate();

        return () => clearTimeout(timeout);
    }, [isLoading, duration]);

    useEffect(() => {
        if (!isLoading && progress > 0) {
            setProgress(100);
            const timeout = setTimeout(() => {
                onComplete?.();
                setProgress(0);
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [isLoading, progress, onComplete]);

    if (progress === 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <div className="h-0.5 bg-[var(--bg-tertiary)]">
                <div
                    className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

// Skeleton loader
export function Skeleton({
    className = '',
    width,
    height
}: {
    className?: string;
    width?: string | number;
    height?: string | number;
}) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height
            }}
        />
    );
}

// Card skeleton
export function CardSkeleton() {
    return (
        <div className="glass-card p-6 space-y-4">
            <Skeleton height={20} width="60%" />
            <Skeleton height={14} width="100%" />
            <Skeleton height={14} width="80%" />
            <div className="flex gap-2 pt-2">
                <Skeleton height={28} width={80} className="rounded-full" />
                <Skeleton height={28} width={80} className="rounded-full" />
            </div>
        </div>
    );
}

// Grid skeleton
export function GridSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

// AI Operation Loader - for content/image generation, analysis
export function AILoader({
    message = 'Processing...',
    steps = [],
    currentStep = 0,
    variant = 'default'
}: {
    message?: string;
    steps?: string[];
    currentStep?: number;
    variant?: 'default' | 'image' | 'content' | 'analysis';
}) {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(d => d.length >= 3 ? '' : d + '.');
        }, 400);
        return () => clearInterval(interval);
    }, []);

    const colors = {
        default: 'from-violet-500 to-purple-600',
        image: 'from-pink-500 to-rose-600',
        content: 'from-blue-500 to-cyan-600',
        analysis: 'from-emerald-500 to-green-600'
    };

    const icons = {
        default: '✨',
        image: '🎨',
        content: '✍️',
        analysis: '📊'
    };

    return (
        <div className="flex flex-col items-center justify-center py-8 px-4">
            {/* Animated Icon */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors[variant]} flex items-center justify-center mb-5 animate-pulse shadow-lg`}>
                <span className="text-2xl">{icons[variant]}</span>
            </div>

            {/* Message */}
            <p className="text-white font-medium mb-2">{message}{dots}</p>

            {/* Progress bar */}
            <div className="w-64 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-4">
                <div
                    className={`h-full bg-gradient-to-r ${colors[variant]} rounded-full animate-pulse`}
                    style={{
                        width: steps.length > 0 ? `${((currentStep + 1) / steps.length) * 100}%` : '60%',
                        transition: 'width 0.5s ease-out'
                    }}
                />
            </div>

            {/* Steps */}
            {steps.length > 0 && (
                <div className="space-y-2 text-sm">
                    {steps.map((step, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center gap-2 transition-all duration-300 ${idx < currentStep
                                    ? 'text-emerald-400'
                                    : idx === currentStep
                                        ? 'text-white'
                                        : 'text-[var(--text-muted)]'
                                }`}
                        >
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs border border-current">
                                {idx < currentStep ? '✓' : idx + 1}
                            </span>
                            <span>{step}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Inline AI loader for buttons
export function InlineLoader({ text = 'Loading' }: { text?: string }) {
    return (
        <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {text}
        </span>
    );
}
