'use client';

import { Suspense, useState, useEffect, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createEmpleado, updateEmpleado, getEmpleado } from '@/lib/api';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

const PUESTOS = [
  { id: 1, nombre: 'Gerente de Operaciones' },
  { id: 2, nombre: 'Coordinador de Operaciones' },
  { id: 3, nombre: 'Supervisor de Flota' },
  { id: 4, nombre: 'Tolvero' },
  { id: 5, nombre: 'Enlonador' },
  { id: 6, nombre: 'Operador de Montacargas' },
  { id: 7, nombre: 'Auxiliar de Bodega' },
];

function EmpleadoForm() {
  const { isSupervisor } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    codigo_empleado: '',
    nombre: '',
    apellido: '',
    id_puesto: 4,
    qr_codigo: '',
    activo: true,
  });

  useEffect(() => {
    if (editId) {
      getEmpleado(Number(editId))
        .then((emp) => {
          setForm({
            codigo_empleado: emp.codigo_empleado,
            nombre: emp.nombre,
            apellido: emp.apellido,
            id_puesto: emp.id_puesto,
            qr_codigo: emp.qr_codigo || '',
            activo: emp.activo,
          });
        })
        .catch(() => router.push('/empleados'))
        .finally(() => setLoading(false));
    }
  }, [editId, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editId) {
        await updateEmpleado(Number(editId), form);
      } else {
        await createEmpleado(form);
      }
      router.push('/empleados');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { message: string } } }).response?.data?.message || 'Error al guardar'
          : 'Error al guardar';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (!isSupervisor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">No tienes permisos para esta sección.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="alm-spinner alm-spinner-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/empleados')}
          className="alm-glass-btn-sm flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a empleados
        </button>

        <div className="alm-card-flat p-6">
          <h1 className="text-xl font-bold mb-6">
            {editId ? 'Editar Empleado' : 'Nuevo Empleado'}
          </h1>

          {error && (
            <div className="alm-alert alm-alert-error mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1">
                  Código de Empleado
                </label>
                <input
                  type="text"
                  value={form.codigo_empleado}
                  onChange={(e) => setForm({ ...form, codigo_empleado: e.target.value.toUpperCase() })}
                  className="alm-input w-full"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1">Código QR</label>
                <input
                  type="text"
                  value={form.qr_codigo}
                  onChange={(e) => setForm({ ...form, qr_codigo: e.target.value })}
                  className="alm-input w-full"
                  placeholder="Opcional"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="alm-input w-full"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1">Apellido</label>
                <input
                  type="text"
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  className="alm-input w-full"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1">Puesto</label>
                <select
                  value={form.id_puesto}
                  onChange={(e) => setForm({ ...form, id_puesto: Number(e.target.value) })}
                  className="alm-select w-full"
                >
                  {PUESTOS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1">Estado</label>
                <select
                  value={form.activo ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, activo: e.target.value === 'true' })}
                  className="alm-select w-full"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/empleados')}
                className="alm-btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="alm-btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EmpleadoFormPage() {
  return (
      <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="alm-spinner alm-spinner-lg" />
        </div>
      }
    >
      <EmpleadoForm />
    </Suspense>
  );
}
