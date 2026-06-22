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
              className={`alm-sidebar-item${item.active ? ' active' : ''}`}
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
          <h1 className="font-semibold text-lg">Empleados</h1>
        </header>

        <main className="flex-1 p-6 pb-20 lg:pb-6 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#1A1A1A] hidden lg:block">Empleados</h1>
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
              {isSupervisor && (
                <button
                  onClick={() => router.push('/empleados/nuevo')}
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
                <table className="alm-table w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left">Código</th>
                      <th className="px-6 py-3 text-left">Nombre</th>
                      <th className="px-6 py-3 text-left">Puesto</th>
                      <th className="px-6 py-3 text-left">Estado</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((emp) => (
                      <tr key={emp.id} className="hover:bg-[#E8EAF3]">
                        <td data-label="Código" className="px-6 py-4 text-sm font-mono text-[#1A1A1A] break-all">
                          {emp.codigo_empleado}
                        </td>
                        <td data-label="Nombre" className="px-6 py-4 text-sm text-[#1A1A1A]">
                          {emp.nombre} {emp.apellido}
                        </td>

                        <td data-label="Puesto" className="px-6 py-4 text-sm text-[#6B7280]">
                          {emp.puesto?.nombre || 'N/A'}
                        </td>
                        <td data-label="Estado" className="px-6 py-4">
                          <span
                            className={`alm-badge ${emp.activo ? 'alm-badge-green' : 'alm-badge-red'}`}
                          >
                            {emp.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td data-label="" className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setQrModal({
                                  id: emp.id,
                                  codigo: emp.codigo_empleado,
                                  nombre: `${emp.nombre} ${emp.apellido}`,
                                })
                              }
                              className="text-gray-400 hover:text-[#0000A3] hover:bg-[#E8EAF3] rounded-lg p-1.5"
                              title="Ver QR"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/empleados/nuevo?id=${emp.id}`)}
                              className="text-gray-400 hover:text-[#0000A3] hover:bg-[#E8EAF3] rounded-lg p-1.5"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(emp.id)}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-1.5"
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
                        <td colSpan={5}>
                          <div className="alm-empty">
                            <div className="alm-empty-icon">🔍</div>
                            <p>No se encontraron empleados</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
