'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Usuario } from '@/lib/types';
import { login as apiLogin, logout as apiLogout, getStoredUser } from '@/lib/api';

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isSupervisor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    setLoading(false);
  }, []);

  const login = useCallback(async (correo: string, password: string) => {
    const result = await apiLogin({ correo, password });
    setUser(result.usuario);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    router.push('/login');
  }, [router]);

  const isAdmin = user?.rol === 'ADMIN';
  const isSupervisor = user?.rol === 'SUPERVISOR' || user?.rol === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isSupervisor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
