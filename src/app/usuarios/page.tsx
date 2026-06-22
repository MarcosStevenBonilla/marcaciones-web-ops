'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUsuarios, deleteUsuario } from '@/lib/api';
import type { Usuario } from '@/lib/types';
import {
  Users,
  Shield,
  Plus,
  Trash2,
  LogOut,
  Clock,
  Building2,
  ClipboardList,
} from 'lucide-react';

export default function UsuariosPage() {
  const { user, loading, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    getUsuarios()
      .then(setUsuarios)
      .finally(() => setPageLoading(false));
  }, []);

  async function handleDelete(id: number) {
    if (!confirm('¿Desactivar este usuario?')) return;
    try {
      await deleteUsuario(id);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert('Error al desactivar usuario');
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
        <div className="alm-spinner alm-spinner-lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    { label: 'Dashboard', icon: Clock, href: '/dashboard' },
    { label: 'Empleados', icon: Users, href: '/empleados' },
    { label: 'Operativos', icon: Building2, href: '/operativos' },
    { label: 'Asistencias', icon: ClipboardList, href: '/asistencias' },
    { label: 'Usuarios', icon: Shield, href: '/usuarios', active: true },
  ];

  return (
    <div className="min-h-screen flex">
      <aside
        className="hidden lg:flex lg:w-64 alm-sidebar shrink-0 flex-col"
      >
        <div className="alm-sidebar-brand p-6">
          <h2 className="text-xl font-bold">ALMAPAC</h2>
          <p className="text-sm mt-1">Sistema de Marcaciones</p>
        </div>
        <nav className="alm-sidebar-nav mt-4 space-y-1 px-3">
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
          <div className="text-sm mb-2 truncate">{user.nombre}</div>
          <button
            onClick={logout}
            className="alm-sidebar-item"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden bg-white px-6 py-4 flex items-center border-b" style={{borderColor: '#E5E5E5'}}>
          <h1 className="font-semibold text-lg">Usuarios</h1>
        </header>

        <main className="flex-1 p-6 pb-20 lg:pb-6 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold hidden lg:block">Usuarios del Sistema</h1>
            {isAdmin && (
              <button
                onClick={() => router.push('/usuarios/nuevo')}
                className="alm-btn-primary-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nuevo Usuario
              </button>
            )}
          </div>

          {pageLoading ? (
            <div className="flex justify-center py-12">
        <div className="alm-spinner alm-spinner-lg" />
            </div>
          ) : (
            <div className="alm-table-wrap flex-1 overflow-auto">
              <div className="overflow-x-auto">
                <table className="alm-table w-full">
                  <thead>
                    <tr className="bg-[#F5F5F5] border-b border-[#E5E5E5]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Nombre
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Correo
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Rol
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
                    {usuarios.map((usr) => (
                      <tr key={usr.id} className="hover:bg-[#F5F5F5] transition-colors">
                        <td data-label="Nombre" className="px-6 py-4 text-sm font-medium text-[#1A1A1A]">{usr.nombre}</td>
                        <td data-label="Correo" className="px-6 py-4 text-sm text-[#6B7280]">{usr.correo}</td>
                        <td data-label="Rol" className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 ${
                              usr.rol === 'ADMIN'
                                ? 'alm-badge alm-badge-purple'
                                : 'alm-badge bg-blue-100 text-blue-800'
                            }`}
                          >
                            <Shield className="w-3 h-3" />
                            {usr.rol}
                          </span>
                        </td>
                        <td data-label="Estado" className="px-6 py-4">
                          <span
                            className={`alm-badge ${
                              usr.activo ? 'alm-badge-green' : 'alm-badge-red'
                            }`}
                          >
                            {usr.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td data-label="" className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isAdmin && usr.id !== user.id && (
                              <button
                                onClick={() => handleDelete(usr.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {usuarios.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <div className="alm-empty">
                            <div className="alm-empty-icon">👤</div>
                            <p>No hay usuarios registrados</p>
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
