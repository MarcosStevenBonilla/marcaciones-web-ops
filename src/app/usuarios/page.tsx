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
  Loader2,
  LogOut,
  Menu,
  X,
  Clock,
  Building2,
  ClipboardList,
} from 'lucide-react';

export default function UsuariosPage() {
  const { user, loading, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    );
  }

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-blue-900 text-white transform transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold">ALMAPAC</h2>
          <p className="text-blue-200 text-sm mt-1">Sistema de Marcaciones</p>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => {
                router.push(item.href);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                item.active ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800">
          <div className="text-sm text-blue-200 mb-2 truncate">{user.nombre}</div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-blue-200 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="font-semibold text-lg">Usuarios</h1>
        </header>

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">Usuarios del Sistema</h1>
            {isAdmin && (
              <button
                onClick={() => router.push('/usuarios/nuevo')}
                className="bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nuevo Usuario
              </button>
            )}
          </div>

          {pageLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Nombre
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Correo
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Rol
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {usuarios.map((usr) => (
                      <tr key={usr.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{usr.nombre}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{usr.correo}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              usr.rol === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            {usr.rol}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              usr.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {usr.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
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
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          No hay usuarios registrados
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
    </div>
  );
}
