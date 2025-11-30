'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    username: string;
    role: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'SIN_ACCESO_FRONTEND';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.user.role === 'SIN_ACCESO_FRONTEND') {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    setUser(null);
                    router.push('/login?error=no_access');
                    return;
                }
                setUser(data.user);
            } else {
                setUser(null);
                // Optional: redirect to login if strictly protected
                // router.push('/login');
            }
        } catch (error) {
            console.error('Auth check failed', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout failed', error);
        }
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
