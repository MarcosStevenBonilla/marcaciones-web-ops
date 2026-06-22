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
  exportExcel,
  exportPdf,
  type ExportFilters,
} from '@/lib/api';
import type { Asistencia, Empleado, Operativo, EditarAsistenciaRequest } from '@/lib/types';
import {
  ClipboardList,
  Search,
  Loader2,
  LogOut,
  Clock,
  Users,
  Building2,
  MapPin,
  Shield,
  Pencil,
  Save,
  AlertCircle,
  FileSpreadsheet,
  FileText,
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

  function getExportFilters(): ExportFilters {
    return {
      empleado_id: filterEmpleado ? Number(filterEmpleado) : undefined,
      operativo_id: filterOperativo ? Number(filterOperativo) : undefined,
      search: search || undefined,
    };
  }

  async function downloadExcel() {
    try {
      const blob = await exportExcel(getExportFilters());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marcaciones_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Error al descargar Excel');
    }
  }

  async function downloadPdf() {
    try {
      const blob = await exportPdf(getExportFilters());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marcaciones_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Error al descargar PDF');
    }
  }

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
        className="hidden lg:flex lg:w-64 alm-sidebar shrink-0 flex-col"
      >
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
          <h1 className="font-semibold text-lg">Asistencias</h1>
        </header>

        <main className="flex-1 p-6 pb-20 lg:pb-6 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold hidden lg:block">Asistencias</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 ml-auto w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="alm-search w-full sm:w-48"
                />
              </div>
              <select
                value={filterEmpleado}
                onChange={(e) => handleFilterChange('empleado', e.target.value)}
                className="alm-select w-full sm:w-auto"
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
                className="alm-select w-full sm:w-auto"
              >
                <option value="">Todos los operativos</option>
                {operativos.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.nombre}
                  </option>
                ))}
              </select>
              <div className="flex gap-1.5">
                <button
                  onClick={downloadExcel}
                  className="alm-glass-btn-sm flex items-center gap-1.5"
                  title="Exportar Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Excel</span>
                </button>
                <button
                  onClick={downloadPdf}
                  className="alm-glass-btn-sm flex items-center gap-1.5"
                  title="Exportar PDF"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
              </div>
            </div>
          </div>

          {editModalOpen && editAsistencia && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="alm-card-flat p-6 max-w-lg w-full">
                <h3 className="text-lg font-semibold mb-4">Editar Marcación</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1">Código Empleado</label>
                    <input
                      type="text"
                      value={editForm.codigoEmpleado || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, codigoEmpleado: e.target.value || undefined }))}
                      className="alm-input"
                      placeholder={editAsistencia.empleado?.codigo_empleado}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1">Operativo</label>
                    <select
                      value={editForm.operativoId || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, operativoId: e.target.value ? Number(e.target.value) : undefined }))}
                      className="alm-select"
                    >
                      <option value="">-- Seleccione --</option>
                      {operativos.map((op) => (
                        <option key={op.id} value={op.id}>{op.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1">Latitud</label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.latitud ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, latitud: e.target.value ? Number(e.target.value) : undefined }))}
                        className="alm-input"
                        placeholder="13.7012"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1">Longitud</label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.longitud ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, longitud: e.target.value ? Number(e.target.value) : undefined }))}
                        className="alm-input"
                        placeholder="-89.2244"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1">Tipo</label>
                    <select
                      value={editForm.tipo_marcacion || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, tipo_marcacion: (e.target.value as 'ENTRADA' | 'SALIDA') || undefined }))}
                      className="alm-select"
                    >
                      <option value="">-- Sin cambio --</option>
                      <option value="ENTRADA">Entrada</option>
                      <option value="SALIDA">Salida</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1">Observaciones</label>
                    <textarea
                      value={editForm.observaciones || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, observaciones: e.target.value || undefined }))}
                      className="alm-input"
                      rows={3}
                      placeholder={editAsistencia.observaciones || 'Sin observaciones'}
                    />
                  </div>

                  {editError && (
                    <div className="alm-alert alm-alert-error">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {editError}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setEditModalOpen(false); setEditAsistencia(null); }}
                    disabled={editSaving}
                    className="alm-btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEditSave}
                    disabled={editSaving}
                    className="alm-btn-primary"
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
            <div className="alm-spinner alm-spinner-lg" />
          ) : (
            <div className="alm-table-wrap flex-1 overflow-auto">
              <div className="overflow-x-auto">
                <table className="alm-table">
                  <thead>
                    <tr className="bg-[#F5F5F5] border-b border-[#E5E5E5]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Empleado
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Operativo
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Tipo
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Fecha / Hora
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Ubicación
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Registró
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Modificado por
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Modificado en
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                        Observaciones
                      </th>
                      {user.rol === 'ADMIN' && (
                        <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {filtered.map((a) => (
                      <tr key={a.id} className="hover:bg-[#F5F5F5] transition-colors">
                        <td data-label="Empleado" className="px-6 py-4 text-sm text-[#1A1A1A]">
                          {a.empleado ? `${a.empleado.nombre} ${a.empleado.apellido}` : 'N/A'}
                        </td>
                        <td data-label="Operativo" className="px-6 py-4 text-sm text-[#6B7280]">
                          {a.operativo?.nombre || 'N/A'}
                        </td>
                        <td data-label="Tipo" className="px-6 py-4">
                          <span
                            className={`alm-badge ${
                              a.tipo_marcacion === 'ENTRADA'
                                ? 'alm-badge-green'
                                : 'alm-badge-orange'
                            }`}
                          >
                            {a.tipo_marcacion}
                          </span>
                        </td>
                        <td data-label="Fecha" className="px-6 py-4 text-sm text-[#6B7280]">
                          {a.fecha_hora}
                        </td>
                        <td data-label="" className="px-6 py-4 text-sm text-[#6B7280]">
                          {a.ubicacion ? (
                            <a
                              href={`https://www.google.com/maps?q=${a.ubicacion.latitud},${a.ubicacion.longitud}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[#0000A3] hover:text-[#182A6E]"
                            >
                              <MapPin className="w-3 h-3" />
                              {parseFloat(a.ubicacion.latitud).toFixed(4)},{' '}
                              {parseFloat(a.ubicacion.longitud).toFixed(4)}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td data-label="Registró" className="px-6 py-4 text-sm text-[#6B7280]">
                          {a.usuario_registra?.nombre || 'N/A'}
                        </td>
                        <td data-label="Modificado por" className="px-6 py-4 text-sm text-[#6B7280]">
                          {a.usuario_modifica?.nombre || '-'}
                        </td>
                        <td data-label="Modificado en" className="px-6 py-4 text-sm text-[#6B7280]">
                          {a.modificado_en || '-'}
                        </td>
                        <td data-label="Obs." className="px-6 py-4 text-sm text-[#6B7280] max-w-xs truncate">
                          {a.observaciones || '-'}
                        </td>
                        {user.rol === 'ADMIN' && (
                          <td data-label="" className="px-6 py-4">
                            <button
                              onClick={() => openEditModal(a)}
                              className="bg-[#E8EAF3] text-[#0000A3] rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-[#0000A3] hover:text-white transition-colors inline-flex items-center gap-1"
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
                        <td colSpan={9} className="px-6 py-12 text-center">
                          <div className="alm-empty">
                            <div className="alm-empty-icon">📋</div>
                            <p>No se encontraron asistencias</p>
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
