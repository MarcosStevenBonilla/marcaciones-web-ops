'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(correo, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { message: string } } }).response?.data?.message || 'Error al iniciar sesión'
          : 'Error al iniciar sesión';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0000A3] overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative w-full max-w-md px-4">
        <div className="h-1.5 bg-[#FD7304] rounded-t-2xl" />

        <div className="bg-white rounded-b-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#0000A3]">ALMAPAC</h1>
            <p className="text-[#6B7280] mt-2">
              Sistema de <span className="text-[#FD7304] font-semibold">Marcaciones</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50/80 border border-red-200/50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Correo electrónico
              </label>
              <input
                id="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl focus:ring-2 focus:ring-[#0000A3] focus:border-[#0000A3] outline-none text-[#1A1A1A] placeholder:text-[#6B7280]"
                placeholder="correo@empresa.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E5E5E5] rounded-xl focus:ring-2 focus:ring-[#0000A3] focus:border-[#0000A3] outline-none text-[#1A1A1A] placeholder:text-[#6B7280]"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0000A3] hover:bg-[#182A6E] text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-[#6B7280] tracking-wider uppercase">
              ALMAPAC &mdash; Gestión de Marcaciones
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
