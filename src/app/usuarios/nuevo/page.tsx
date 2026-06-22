'use client';

import { Suspense, useState, useEffect, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createUsuario, updateUsuario, getUsuario } from '@/lib/api';
import { Save, ArrowLeft } from 'lucide-react';

function UsuarioForm() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    password: '',
    rol: 'SUPERVISOR' as 'ADMIN' | 'SUPERVISOR',
    activo: true,
  });

  useEffect(() => {
    if (editId) {
      getUsuario(Number(editId))
        .then((usr) => {
          setForm({
            nombre: usr.nombre,
            correo: usr.correo,
            password: '',
            rol: usr.rol,
            activo: usr.activo,
          });
        })
        .catch(() => router.push('/usuarios'))
        .finally(() => setLoading(false));
    }
  }, [editId, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editId) {
        await updateUsuario(Number(editId), form);
      } else {
        await createUsuario(form);
      }
      router.push('/usuarios');
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
          onClick={() => router.push('/usuarios')}
          className="alm-glass-btn-sm flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a usuarios
        </button>

        <div className="alm-card-flat p-6">
          <h1 className="text-xl font-bold mb-6">
            {editId ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h1>

          {error && (
            <div className="alm-alert alm-alert-error mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="alm-input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Correo electrónico</label>
              <input
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                className="alm-input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Contraseña {editId && '(dejar vacío para mantener)'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="alm-input w-full"
                placeholder={editId ? '••••••••' : '••••••••'}
                required={!editId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Rol</label>
              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value as 'ADMIN' | 'SUPERVISOR' })}
                className="alm-select w-full"
              >
                <option value="SUPERVISOR">SUPERVISOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={form.activo ? 'true' : 'false'}
                onChange={(e) => setForm({ ...form, activo: e.target.value === 'true' })}
                className="alm-select w-full"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/usuarios')}
                className="alm-btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="alm-btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <div className="alm-spinner" /> : <Save className="w-5 h-5" />}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UsuarioFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="alm-spinner alm-spinner-lg" />
        </div>
      }
    >
      <UsuarioForm />
    </Suspense>
  );
}
