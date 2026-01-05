'use client';

import { useEffect, useRef, useState } from 'react';

interface UseScrollRevealOptions {
    threshold?: number;
    rootMargin?: string;
    once?: boolean;
}

export function useScrollReveal<T extends HTMLElement>({
    threshold = 0.1,
    rootMargin = '0px 0px -40px 0px',
    once = true
}: UseScrollRevealOptions = {}) {
    const ref = useRef<T>(null);
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsRevealed(true);
                    if (once) {
                        observer.unobserve(element);
                    }
                } else if (!once) {
                    setIsRevealed(false);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [threshold, rootMargin, once]);

    return { ref, isRevealed };
}

// Hook for multiple elements in a list
export function useScrollRevealAll(
    count: number,
    options?: UseScrollRevealOptions
) {
    const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
    const refs = useRef<(HTMLElement | null)[]>([]);

    useEffect(() => {
        const observers: IntersectionObserver[] = [];

        refs.current.forEach((element, index) => {
            if (!element) return;

            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setRevealedIndices(prev => new Set([...prev, index]));
                        if (options?.once !== false) {
                            observer.unobserve(element);
                        }
                    }
                },
                {
                    threshold: options?.threshold ?? 0.1,
                    rootMargin: options?.rootMargin ?? '0px 0px -40px 0px'
                }
            );

            observer.observe(element);
            observers.push(observer);
        });

        return () => observers.forEach(o => o.disconnect());
    }, [count, options?.threshold, options?.rootMargin, options?.once]);

    const setRef = (index: number) => (el: HTMLElement | null) => {
        refs.current[index] = el;
    };

    return { setRef, isRevealed: (index: number) => revealedIndices.has(index) };
}
