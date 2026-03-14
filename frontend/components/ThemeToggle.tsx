'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2.5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
        >
            <div className="relative w-5 h-5">
                {/* Sun icon - shown in dark mode (click to go light) */}
                <Sun
                    className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${
                        theme === 'dark'
                            ? 'opacity-100 rotate-0 scale-100 text-yellow-400'
                            : 'opacity-0 rotate-90 scale-0 text-yellow-400'
                    }`}
                />
                {/* Moon icon - shown in light mode (click to go dark) */}
                <Moon
                    className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${
                        theme === 'light'
                            ? 'opacity-100 rotate-0 scale-100 text-indigo-500'
                            : 'opacity-0 -rotate-90 scale-0 text-indigo-500'
                    }`}
                />
            </div>
        </button>
    );
}
