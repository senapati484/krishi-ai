import { create } from 'zustand';
import type { Language } from '@/lib/i18n';

interface User {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    language: Language;
    location?: {
        village?: string;
        district?: string;
        state?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    lastLocation?: {
        lat: number;
        lon: number;
        updatedAt?: string;
    };
    emailNotifications?: boolean;
    emailVerified?: boolean;
}

interface AppState {
    user: User | null;
    token: string | null;
    language: Language;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setLanguage: (lang: Language) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

// Load from localStorage on init
const loadFromStorage = (): Partial<AppState> => {
    if (typeof window === 'undefined') return {};
    try {
        const stored = localStorage.getItem('krishi-ai-storage');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading from storage:', e);
    }
    return {};
};

const saved = loadFromStorage();

export const useStore = create<AppState>((set, get) => ({
    user: saved.user || null,
    token: saved.token || null,
    language: (saved.language as Language) || 'en',
    setUser: (user) => {
        set({ user });
        if (typeof window !== 'undefined') {
            const state = get();
            localStorage.setItem('krishi-ai-storage', JSON.stringify({
                user,
                token: state.token,
                language: state.language
            }));
        }
    },
    setToken: (token) => {
        set({ token });
        if (typeof window !== 'undefined') {
            const state = get();
            localStorage.setItem('krishi-ai-storage', JSON.stringify({
                user: state.user,
                token,
                language: state.language
            }));
        }
    },
    setLanguage: (lang) => {
        set({ language: lang });
        if (typeof window !== 'undefined') {
            const state = get();
            localStorage.setItem('krishi-ai-storage', JSON.stringify({
                user: state.user,
                token: state.token,
                language: lang
            }));
        }
    },
    login: (user, token) => {
        set({ user, token });
        if (typeof window !== 'undefined') {
            const state = get();
            localStorage.setItem('krishi-ai-storage', JSON.stringify({
                user,
                token,
                language: state.language
            }));
        }
    },
    logout: () => {
        set({ user: null, token: null });
        if (typeof window !== 'undefined') {
            localStorage.removeItem('krishi-ai-storage');
        }
    },
    refreshUser: async () => {
        const state = get();
        if (state.user?.id) {
            try {
                const response = await fetch(`/api/user?id=${state.user.id}`);
                const data = await response.json();
                if (data.success) {
                    // Merge current user with refreshed data to preserve all fields
                    const updatedUser: User = {
                        ...state.user,
                        ...data.user,
                        emailVerified: data.user.emailVerified ?? state.user.emailVerified ?? false,
                    };
                    set({ user: updatedUser });
                    if (typeof window !== 'undefined') {
                        const currentState = get();
                        localStorage.setItem('krishi-ai-storage', JSON.stringify({
                            user: updatedUser,
                            token: currentState.token,
                            language: currentState.language
                        }));
                    }
                }
            } catch (error) {
                console.error('Error refreshing user data:', error);
            }
        }
    }
}));

