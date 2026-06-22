'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getEmpleados, deleteEmpleado } from '@/lib/api';
import type { Empleado } from '@/lib/types';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader2,
  LogOut,
  Menu,
  X,
  Clock,
  Building2,
  ClipboardList,
  Shield,
  QrCode,
} from 'lucide-react';
import QrModal from './QrModal';

export default function EmpleadosPage() {
  const { user, loading, logout, isSupervisor, isAdmin } = useAuth();
  const router = useRouter();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [qrModal, setQrModal] = useState<{ id: number; codigo: string; nombre: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getEmpleados()
      .then(setEmpleados)
      .finally(() => setPageLoading(false));
  }, []);

  async function handleDelete(id: number) {
    if (!confirm('¿Desactivar este empleado?')) return;
    try {
      await deleteEmpleado(id);
      setEmpleados((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert('Error al desactivar empleado');
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

  const filtered = empleados.filter(
    (e) =>
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      e.apellido.toLowerCase().includes(search.toLowerCase()) ||
      e.codigo_empleado.toLowerCase().includes(search.toLowerCase())
  );

  const menuItems = [
    { label: 'Dashboard', icon: Clock, href: '/dashboard' },
    { label: 'Empleados', icon: Users, href: '/empleados', active: true },
    { label: 'Operativos', icon: Building2, href: '/operativos' },
    { label: 'Asistencias', icon: ClipboardList, href: '/asistencias' },
    { label: 'Usuarios', icon: Shield, href: '/usuarios' },
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
          <h1 className="font-semibold text-lg">Empleados</h1>
        </header>

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">Empleados</h1>
            <div className="flex items-center gap-3 ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
                />
              </div>
              {isSupervisor && (
                <button
                  onClick={() => router.push('/empleados/nuevo')}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Nuevo
                </button>
              )}
            </div>
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
                        Código
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Nombre
                      </th>

                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Puesto
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
                    {filtered.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">
                          {emp.codigo_empleado}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {emp.nombre} {emp.apellido}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {emp.puesto?.nombre || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              emp.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {emp.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setQrModal({
                                  id: emp.id,
                                  codigo: emp.codigo_empleado,
                                  nombre: `${emp.nombre} ${emp.apellido}`,
                                })
                              }
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver QR"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/empleados/nuevo?id=${emp.id}`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(emp.id)}
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
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          No se encontraron empleados
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

      {qrModal && (
        <QrModal
          empleadoId={qrModal.id}
          codigo={qrModal.codigo}
          nombre={qrModal.nombre}
          onClose={() => setQrModal(null)}
        />
      )}
    </div>
  );
}
