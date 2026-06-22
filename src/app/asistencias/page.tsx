'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAsistencias,
  getAsistenciasByEmpleado,
  getAsistenciasByOperativo,
  getEmpleados,
  getOperativos,
  editarAsistencia,
} from '@/lib/api';
import type { Asistencia, Empleado, Operativo, EditarAsistenciaRequest } from '@/lib/types';
import {
  ClipboardList,
  Search,
  Loader2,
  LogOut,
  Menu,
  X,
  Clock,
  Users,
  Building2,
  MapPin,
  Shield,
  Pencil,
  Save,
  AlertCircle,
} from 'lucide-react';

export default function AsistenciasPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [operativos, setOperativos] = useState<Operativo[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEmpleado, setFilterEmpleado] = useState<string>('');
  const [filterOperativo, setFilterOperativo] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAsistencia, setEditAsistencia] = useState<Asistencia | null>(null);
  const [editForm, setEditForm] = useState<EditarAsistenciaRequest>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    Promise.all([getAsistencias(), getEmpleados(), getOperativos()])
      .then(([asistencias, empleados, operativos]) => {
        setAsistencias(asistencias);
        setEmpleados(empleados);
        setOperativos(operativos);
      })
      .finally(() => setPageLoading(false));
  }, []);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  function openEditModal(a: Asistencia) {
    setEditAsistencia(a);
    setEditForm({
      codigoEmpleado: a.empleado?.codigo_empleado,
      operativoId: a.id_operativo,
      tipo_marcacion: a.tipo_marcacion,
      observaciones: a.observaciones || undefined,
    });
    setEditError('');
    setEditModalOpen(true);
  }

  async function handleEditSave() {
    if (!editAsistencia) return;
    setEditSaving(true);
    setEditError('');
    try {
      await editarAsistencia(editAsistencia.id, editForm);
      const updated = await getAsistencias();
      setAsistencias(updated);
      setEditModalOpen(false);
      setEditAsistencia(null);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { message: string } } }).response?.data?.message || 'Error al editar'
          : 'Error al editar';
      setEditError(message);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleFilterChange(type: 'empleado' | 'operativo', value: string) {
    if (type === 'empleado') {
      setFilterEmpleado(value);
      setPageLoading(true);
      try {
        const data = value ? await getAsistenciasByEmpleado(Number(value)) : await getAsistencias();
        setAsistencias(data);
      } finally {
        setPageLoading(false);
      }
    } else {
      setFilterOperativo(value);
      setPageLoading(true);
      try {
        const data = value ? await getAsistenciasByOperativo(Number(value)) : await getAsistencias();
        setAsistencias(data);
      } finally {
        setPageLoading(false);
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filtered = asistencias.filter((a) => {
    const empleadoNombre = a.empleado
      ? `${a.empleado.nombre} ${a.empleado.apellido}`.toLowerCase()
      : '';
    const operativoNombre = a.operativo?.nombre?.toLowerCase() || '';
    const q = search.toLowerCase();
    return empleadoNombre.includes(q) || operativoNombre.includes(q) || a.tipo_marcacion.toLowerCase().includes(q);
  });

  const menuItems = [
    { label: 'Dashboard', icon: Clock, href: '/dashboard' },
    { label: 'Empleados', icon: Users, href: '/empleados' },
    { label: 'Operativos', icon: Building2, href: '/operativos' },
    { label: 'Asistencias', icon: ClipboardList, href: '/asistencias', active: true },
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
          <h1 className="font-semibold text-lg">Asistencias</h1>
        </header>

        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">Asistencias</h1>
            <div className="flex items-center gap-3 ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-48"
                />
              </div>
              <select
                value={filterEmpleado}
                onChange={(e) => handleFilterChange('empleado', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Todos los empleados</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido}
                  </option>
                ))}
              </select>
              <select
                value={filterOperativo}
                onChange={(e) => handleFilterChange('operativo', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Todos los operativos</option>
                {operativos.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {editModalOpen && editAsistencia && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Marcación</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Empleado</label>
                    <input
                      type="text"
                      value={editForm.codigoEmpleado || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, codigoEmpleado: e.target.value || undefined }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder={editAsistencia.empleado?.codigo_empleado}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operativo</label>
                    <select
                      value={editForm.operativoId || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, operativoId: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    >
                      <option value="">-- Seleccione --</option>
                      {operativos.map((op) => (
                        <option key={op.id} value={op.id}>{op.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.latitud ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, latitud: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        placeholder="13.7012"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.longitud ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, longitud: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        placeholder="-89.2244"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={editForm.tipo_marcacion || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, tipo_marcacion: (e.target.value as 'ENTRADA' | 'SALIDA') || undefined }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    >
                      <option value="">-- Sin cambio --</option>
                      <option value="ENTRADA">Entrada</option>
                      <option value="SALIDA">Salida</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                    <textarea
                      value={editForm.observaciones || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, observaciones: e.target.value || undefined }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      rows={3}
                      placeholder={editAsistencia.observaciones || 'Sin observaciones'}
                    />
                  </div>

                  {editError && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {editError}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setEditModalOpen(false); setEditAsistencia(null); }}
                    disabled={editSaving}
                    className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEditSave}
                    disabled={editSaving}
                    className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {editSaving ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
                    ) : (
                      <><Save className="w-5 h-5" /> Guardar Cambios</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

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
                        Empleado
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Operativo
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Tipo
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Fecha / Hora
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Ubicación
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Registró
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Modificado por
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Modificado en
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Observaciones
                      </th>
                      {user.rol === 'ADMIN' && (
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {a.empleado ? `${a.empleado.nombre} ${a.empleado.apellido}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {a.operativo?.nombre || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              a.tipo_marcacion === 'ENTRADA'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {a.tipo_marcacion}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {a.fecha_hora}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {a.ubicacion ? (
                            <a
                              href={`https://www.google.com/maps?q=${a.ubicacion.latitud},${a.ubicacion.longitud}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                              <MapPin className="w-3 h-3" />
                              {parseFloat(a.ubicacion.latitud).toFixed(4)},{' '}
                              {parseFloat(a.ubicacion.longitud).toFixed(4)}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {a.usuario_registra?.nombre || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {a.usuario_modifica?.nombre || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {a.modificado_en || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                          {a.observaciones || '-'}
                        </td>
                        {user.rol === 'ADMIN' && (
                          <td className="px-6 py-4">
                            <button
                              onClick={() => openEditModal(a)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Editar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                          No se encontraron asistencias
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
