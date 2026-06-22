'use client';

import { Suspense, useState, useEffect, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createOperativo, updateOperativo, getOperativo } from '@/lib/api';
import { svDateToInput } from '@/lib/dateUtils';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

function OperativoForm() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    activo: true,
  });

  useEffect(() => {
    if (editId) {
      getOperativo(Number(editId))
        .then((op) => {
          setForm({
            nombre: op.nombre,
            descripcion: op.descripcion || '',
            fecha_inicio: svDateToInput(op.fecha_inicio),
            fecha_fin: svDateToInput(op.fecha_fin),
            activo: op.activo,
          });
        })
        .catch(() => router.push('/operativos'))
        .finally(() => setLoading(false));
    }
  }, [editId, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editId) {
        await updateOperativo(Number(editId), form);
      } else {
        await createOperativo(form);
      }
      router.push('/operativos');
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

  if (!isAdmin) {
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
          onClick={() => router.push('/operativos')}
          className="alm-glass-btn-sm flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a operativos
        </button>

        <div className="alm-card-flat p-6">
          <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">
            {editId ? 'Editar Operativo' : 'Nuevo Operativo'}
          </h1>

          {error && (
            <div className="alm-alert alm-alert-error mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="alm-input"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={3}
                className="alm-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  className="alm-input"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1">Fecha de Fin</label>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                  className="alm-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1">Estado</label>
              <select
                value={form.activo ? 'true' : 'false'}
                onChange={(e) => setForm({ ...form, activo: e.target.value === 'true' })}
                className="alm-select"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/operativos')}
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

export default function OperativoFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
        <div className="alm-spinner alm-spinner-lg" />
        </div>
      }
    >
      <OperativoForm />
    </Suspense>
  );
}
