'use client';

import { useState, useEffect } from 'react';
import { getQrUrl } from '@/lib/api';
import { Loader2, X, Download } from 'lucide-react';

interface Props {
  empleadoId: number;
  codigo: string;
  nombre: string;
  onClose: () => void;
}

export default function QrModal({ empleadoId, codigo, nombre, onClose }: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getQrUrl(empleadoId)
      .then(setQrUrl)
      .catch(() => setError('Error al generar QR'))
      .finally(() => setLoading(false));
  }, [empleadoId]);

  function handleDownload() {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `qr_${codigo}.png`;
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Código QR</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4 text-center">{nombre}</p>

        <div className="flex justify-center mb-4">
          {loading ? (
            <div className="w-48 h-48 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            </div>
          ) : error ? (
            <div className="w-48 h-48 flex items-center justify-center text-red-500 text-sm">{error}</div>
          ) : qrUrl ? (
            <img src={qrUrl} alt={`QR ${codigo}`} className="w-48 h-48" />
          ) : null}
        </div>

        <p className="text-xs text-gray-400 text-center mb-4 font-mono">{codigo}</p>

        <button
          onClick={handleDownload}
          disabled={loading || !!error}
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" /> Descargar PNG
        </button>
      </div>
    </div>
  );
}
