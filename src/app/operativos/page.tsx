'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getOperativos, deleteOperativo } from '@/lib/api';
import type { Operativo } from '@/lib/types';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader2,
  LogOut,

  Clock,
  Users,
  ClipboardList,
  Shield,
} from 'lucide-react';

export default function OperativosPage() {
  const { user, loading, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [operativos, setOperativos] = useState<Operativo[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState('');


  useEffect(() => {
    getOperativos()
      .then(setOperativos)
      .finally(() => setPageLoading(false));
  }, []);

  async function handleDelete(id: number) {
    if (!confirm('¿Desactivar este operativo?')) return;
    try {
      await deleteOperativo(id);
      setOperativos((prev) => prev.filter((o) => o.id !== id));
    } catch {
      alert('Error al desactivar operativo');
    }
  }

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#0000A3]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filtered = operativos.filter(
    (o) =>
      o.nombre.toLowerCase().includes(search.toLowerCase()) ||
      o.descripcion?.toLowerCase().includes(search.toLowerCase())
  );

  const menuItems = [
    { label: 'Dashboard', icon: Clock, href: '/dashboard' },
    { label: 'Empleados', icon: Users, href: '/empleados' },
    { label: 'Operativos', icon: Building2, href: '/operativos', active: true },
    { label: 'Asistencias', icon: ClipboardList, href: '/asistencias' },
    { label: 'Usuarios', icon: Shield, href: '/usuarios' },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex lg:w-64 alm-sidebar shrink-0 flex-col">
        <div className="alm-sidebar-brand">
          <h2 className="text-xl font-bold">ALMAPAC</h2>
          <p className="text-[#E8EAF3] text-sm mt-1">Sistema de Marcaciones</p>
        </div>
        <nav className="alm-sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`alm-sidebar-item ${item.active ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="alm-sidebar-footer">
          <div className="text-sm text-[#E8EAF3] mb-2 truncate">{user.nombre}</div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-[#E8EAF3] hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden bg-white px-6 py-4 flex items-center border-b" style={{borderColor: '#E5E5E5'}}>
          <h1 className="font-semibold text-lg">Operativos</h1>
        </header>

        <main className="flex-1 p-6 pb-20 lg:pb-6 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold hidden lg:block">Operativos</h1>
            <div className="flex items-center gap-3 ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="alm-search w-64"
                />
              </div>
              {isAdmin && (
                <button
                  onClick={() => router.push('/operativos/nuevo')}
                  className="alm-btn-primary-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Nuevo
                </button>
              )}
            </div>
          </div>

          {pageLoading ? (
            <div className="flex justify-center py-12">
        <div className="alm-spinner alm-spinner-lg" />
            </div>
          ) : (
            <div className="alm-table-wrap flex-1 overflow-auto">
              <div className="overflow-x-auto">
                <table className="alm-table">
                  <thead>
                    <tr className="bg-[#F5F5F5] border-b border-[#E5E5E5]">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Nombre
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Descripción
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Inicio
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Fin
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Estado
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {filtered.map((op) => (
                      <tr key={op.id} className="hover:bg-[#F5F5F5] transition-colors">
                        <td data-label="Nombre" className="px-6 py-4 text-sm font-medium text-[#1A1A1A]">{op.nombre}</td>
                        <td data-label="Descripción" className="px-6 py-4 text-sm text-[#6B7280] max-w-xs truncate">
                          {op.descripcion || '-'}
                        </td>
                        <td data-label="Inicio" className="px-6 py-4 text-sm text-[#6B7280]">
                          {op.fecha_inicio?.split(' ')[0] || '-'}
                        </td>
                        <td data-label="Fin" className="px-6 py-4 text-sm text-[#6B7280]">
                          {op.fecha_fin?.split(' ')[0] || '-'}
                        </td>
                        <td data-label="Estado" className="px-6 py-4">
                          <span
                            className={`alm-badge ${
                              op.activo ? 'alm-badge-green' : 'alm-badge-red'
                            }`}
                          >
                            {op.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td data-label="" className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/operativos/nuevo?id=${op.id}`)}
                              className="text-gray-400 hover:text-[#0000A3] hover:bg-[#E8EAF3] rounded-lg p-1.5"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(op.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="alm-empty">
                            <div className="alm-empty-icon">📋</div>
                            <p>No se encontraron operativos</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
      <nav className="lg:hidden alm-bottom-nav">
        {menuItems.map((item) => (
          <button key={item.href} onClick={() => router.push(item.href)}
            className={`alm-bottom-nav-item ${item.active ? 'active' : ''}`}>
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
        <button onClick={logout} className="alm-bottom-nav-item">
          <LogOut className="w-5 h-5" />
          <span>Salir</span>
        </button>
      </nav>
    </div>
  );
}
