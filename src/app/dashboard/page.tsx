'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getOperativos,
  getEmpleados,
  getEmpleadoByCodigo,
  registrarEntrada,
  registrarSalida,
} from '@/lib/api';
import type { AsistenciaRequest, Operativo, Empleado } from '@/lib/types';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  MapPin,
  Clock,
  Users,
  Building2,
  ClipboardList,
  Shield,
  LogOut,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
} from 'lucide-react';

type Step = 'idle' | 'registrando' | 'confirming' | 'processing' | 'done' | 'error';

export default function DashboardPage() {
  const { user, loading, logout, isSupervisor } = useAuth();
  const router = useRouter();
  const [operativos, setOperativos] = useState<Operativo[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [selectedOperativo, setSelectedOperativo] = useState<number | ''>('');
  const [step, setStep] = useState<Step>('idle');
  const [, setQrCode] = useState('');
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [tipoMarcacion, setTipoMarcacion] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [resultado, setResultado] = useState<{ tipo: 'success' | 'error'; message: string } | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number; precision?: number } | null>(null);
  const geoOptions: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
  const [empleadoSearch, setEmpleadoSearch] = useState('');
  const [empleadoDropdownOpen, setEmpleadoDropdownOpen] = useState(false);
  const [operativoSearch, setOperativoSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    getOperativos().then((ops) => setOperativos(ops.filter((o) => o.activo)));
    getEmpleados().then((emps) => setEmpleados(emps.filter((e) => e.activo)));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, precision: Math.round(pos.coords.accuracy) }),
        () => {},
        geoOptions
      );
    }
  }, []);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  function startRegistrando(operativoId: number, tipo: 'ENTRADA' | 'SALIDA') {
    if (!operativoId) return;
    setSelectedOperativo(operativoId);
    setTipoMarcacion(tipo);
    setStep('registrando');
    setResultado(null);
    setEmpleado(null);
    setQrCode('');
    setEmpleadoSearch('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, precision: Math.round(pos.coords.accuracy) }),
        () => setGps({ lat: 13.7012, lng: -89.2244 }),
        geoOptions
      );
    }
  }

  function reset() {
    setResultado(null);
    setEmpleado(null);
    setQrCode('');
    setTipoMarcacion('ENTRADA');
  }

  const selectedOperativoRef = useRef(selectedOperativo);
  useEffect(() => { selectedOperativoRef.current = selectedOperativo; }, [selectedOperativo]);

  const handleQrDetected = useCallback(
    async (codigo: string) => {
      if (!codigo || !selectedOperativoRef.current) return;
      setQrCode(codigo);
      setStep('confirming');
      try {
        const emp = await getEmpleadoByCodigo(codigo);
        setEmpleado(emp);
      } catch {
        setStep('error');
        setResultado({ tipo: 'error', message: 'Empleado no encontrado. Verifica el código QR.' });
      }
    },
    []
  );

  async function handleManualSelect(emp: Empleado) {
    setEmpleado(emp);
    setEmpleadoDropdownOpen(false);
    setStep('confirming');
    setEmpleadoSearch('');
  }

  async function confirmar() {
    if (!empleado || !tipoMarcacion || !selectedOperativo) return;
    setStep('processing');
    try {
      const payload: AsistenciaRequest = {
        codigoEmpleado: empleado.codigo_empleado,
        operativoId: Number(selectedOperativo),
        latitud: gps?.lat ?? 13.7012,
        longitud: gps?.lng ?? -89.2244,
        precision: gps?.precision,
      };
      const res = tipoMarcacion === 'ENTRADA' ? await registrarEntrada(payload) : await registrarSalida(payload);
      setResultado({ tipo: 'success', message: res.message });
      setStep('done');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { message: string } } }).response?.data?.message || 'Error al registrar'
          : 'Error al registrar';
      setResultado({ tipo: 'error', message });
      setStep('error');
    }
  }

  useEffect(() => {
    if (step !== 'done' || resultado?.tipo !== 'success') return;
    const id = setTimeout(reiniciar, 2000);
    return () => clearTimeout(id);
  }, [step, resultado?.tipo]);

  function reiniciar() {
    setStep('idle');
    reset();
    setEmpleadoSearch('');
    setOperativoSearch('');
  }

  const filteredOperativos = useMemo(
    () => operativos.filter((o) => o.nombre.toLowerCase().includes(operativoSearch.toLowerCase())),
    [operativos, operativoSearch]
  );

  const filteredEmpleados = useMemo(
    () => empleados.filter((e) =>
      `${e.nombre} ${e.apellido} ${e.codigo_empleado}`.toLowerCase().includes(empleadoSearch.toLowerCase())
    ),
    [empleados, empleadoSearch]
  );

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
    { label: 'Dashboard', icon: Clock, href: '/dashboard', active: true },
    { label: 'Empleados', icon: Users, href: '/empleados' },
    { label: 'Operativos', icon: Building2, href: '/operativos' },
    { label: 'Asistencias', icon: ClipboardList, href: '/asistencias' },
    { label: 'Usuarios', icon: Shield, href: '/usuarios' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="hidden lg:flex lg:w-64 alm-sidebar shrink-0 flex-col">
        <div className="alm-sidebar-brand">
          <h2 className="text-xl font-bold">ALMAPAC</h2>
          <p className="text-sm mt-1" style={{ opacity: 0.7 }}>Sistema de Marcaciones</p>
        </div>
        <nav className="alm-sidebar-nav">
          {menuItems.map((item) => (
            <button key={item.href} onClick={() => router.push(item.href)}
              className={`alm-sidebar-item ${item.active ? 'active' : ''}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="alm-sidebar-footer">
          <div className="text-sm mb-2 truncate" style={{ opacity: 0.7 }}>{user.nombre}</div>
          <button onClick={logout} className="alm-sidebar-item" style={{ padding: '8px 0', color: 'rgba(255,255,255,0.7)' }}>
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden bg-white px-6 py-4 flex items-center border-b" style={{borderColor: '#E5E5E5'}}>
          <h1 className="font-semibold text-lg">Dashboard</h1>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6 max-w-lg mx-auto w-full lg:max-w-2xl xl:max-w-4xl">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6 hidden lg:block">Dashboard</h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3 lg:gap-6 mb-4 sm:mb-6">
            <div className="alm-kpi-card">
              <div className="alm-kpi-icon"><Users className="w-5 h-5" /></div>
              <div>
                <div className="alm-kpi-value" style={{fontSize: '16px'}}>{user.nombre}</div>
                <div className="alm-kpi-label" style={{marginLeft: 0}}>Bienvenido</div>
              </div>
            </div>
            <div className="alm-kpi-card">
              <div className="alm-kpi-icon"><Building2 className="w-5 h-5" /></div>
              <div>
                <div className="alm-kpi-value" style={{fontSize: '16px'}}>{user.rol}</div>
                <div className="alm-kpi-label" style={{marginLeft: 0}}>Rol</div>
              </div>
            </div>
            <div className="alm-kpi-card">
              <div className="alm-kpi-icon"><MapPin className="w-5 h-5" /></div>
              <div>
                <div className="alm-kpi-value" style={{fontSize: '16px'}}>
                  {gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'Esperando...'}
                  {gps?.precision != null && (
                    <span className={`ml-1 text-xs ${
                      gps.precision < 20 ? 'text-green-600' : gps.precision < 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      ±{gps.precision}m
                    </span>
                  )}
                </div>
                <div className="alm-kpi-label" style={{marginLeft: 0}}>GPS</div>
              </div>
            </div>
          </div>

          <div className="alm-card p-3 sm:p-4 lg:p-6">
                    <h2 className="alm-section-title">Registro de Asistencia</h2>

            {step === 'idle' && (
              <div className="space-y-4 alm-step-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Operativo</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={operativoSearch}
                      onChange={(e) => setOperativoSearch(e.target.value)}
                      placeholder="Buscar operativo..."
                      className="alm-search"
                    />
                  </div>
                  {filteredOperativos.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">
                      {operativos.length === 0 ? 'No hay operativos activos' : 'Sin resultados'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-[240px] overflow-y-auto">
                      {filteredOperativos.map((op) => (
                        <button
                          key={op.id}
                          onClick={() => setSelectedOperativo(op.id)}
                          className={`rounded-xl p-3 sm:p-4 text-left transition-all min-h-[56px] sm:min-h-[64px] ${
                            selectedOperativo === op.id
                              ? 'border-2 border-[#0000A3] bg-[#E8EAF3]'
                              : 'border-2 border-[#E5E5E5] bg-white hover:border-[#0000A3]/30'
                          }`}
                        >
                          <div className={`font-semibold text-xs sm:text-sm leading-tight ${
                            selectedOperativo === op.id                            ? 'text-[#0000A3]' : 'text-gray-900'
                          }`}>
                            {op.nombre}
                          </div>
                          {selectedOperativo === op.id && (
                            <div className="text-[10px] sm:text-xs text-[#0000A3] mt-0.5">Seleccionado</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {!isSupervisor && (
                  <p className="text-sm text-red-600">No tienes permisos para registrar asistencias.</p>
                )}

                {selectedOperativo ? (
                  <div className="grid grid-cols-2 gap-3 alm-fade-in">
                    <button
                      onClick={() => startRegistrando(Number(selectedOperativo), 'ENTRADA')}
                      disabled={!isSupervisor}
                      className="alm-btn-success flex flex-col items-center justify-center gap-1.5 text-sm sm:text-base min-h-[80px]"
                    >
                      <LogOut className="w-6 h-6 sm:w-7 sm:h-7 rotate-180" />
                      Registrar Entrada
                    </button>
                    <button
                      onClick={() => startRegistrando(Number(selectedOperativo), 'SALIDA')}
                      disabled={!isSupervisor}
                      className="alm-glass-btn flex flex-col items-center justify-center gap-1.5 text-sm sm:text-base min-h-[80px]"
                    >
                      <LogOut className="w-6 h-6 sm:w-7 sm:h-7" />
                      Registrar Salida
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-400 py-4">Seleccioná un operativo para continuar</p>
                )}
              </div>
            )}

            {step === 'registrando' && (
              <div className="space-y-3 sm:space-y-4 alm-step-in">
                <div className="alm-alert text-xs sm:text-sm">
                  Escanea el QR del empleado o búscalo por nombre
                </div>

                <QrScanner onDetected={handleQrDetected} onBack={reiniciar} />

                <div className="relative border-t border-gray-200 pt-3 sm:pt-4">
                  <div className="absolute inset-x-0 -top-2.5 sm:-top-3 flex justify-center">
                    <span className="bg-white px-2 sm:px-3 text-xs text-gray-400">O</span>
                  </div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Buscar por nombre o código</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={empleadoSearch}
                      onChange={(e) => { setEmpleadoSearch(e.target.value); setEmpleadoDropdownOpen(true); }}
                      onFocus={() => setEmpleadoDropdownOpen(true)}
                      placeholder="Nombre o código..."
                      className="alm-search"
                    />
                  </div>
                  {empleadoDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredEmpleados.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-[#6B7280]">Sin resultados</p>
                      ) : (
                        filteredEmpleados.slice(0, 20).map((emp) => (
                          <button
                            key={emp.id}
                            onClick={() => handleManualSelect(emp)}
                            className="w-full text-left px-4 py-3 hover:bg-[#E8EAF3] transition-colors border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-sm text-[#1A1A1A]">
                              {emp.nombre} {emp.apellido}
                            </div>
                            <div className="text-xs text-[#6B7280] font-mono">{emp.codigo_empleado}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <button onClick={reiniciar} className="w-full alm-btn-secondary text-sm min-h-[44px]">
                  Cancelar
                </button>
              </div>
            )}

            {(step === 'confirming' || step === 'processing') && empleado && (
              <div className="space-y-4 alm-step-in">
                <div className="text-center mb-2">
                  <div className="text-3xl font-bold text-[#1A1A1A] tabular-nums">
                    {currentTime.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </div>
                  <div className="text-sm text-[#6B7280]">
                    {currentTime.toLocaleDateString('es-SV', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <div className="alm-card-flat p-3 sm:p-4 bg-[#F5F5F5] space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[#1A1A1A] text-sm sm:text-base">Confirmar Marcación</h3>
                    <span className={`alm-badge ${tipoMarcacion === 'ENTRADA' ? 'alm-badge-green' : 'alm-badge-orange'}`}>
                      {tipoMarcacion}
                    </span>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-3 text-xs sm:text-sm">
                    <span className="text-[#6B7280] whitespace-nowrap">Empleado:</span>
                    <span className="font-medium text-[#1A1A1A] break-words min-w-0">{empleado.nombre} {empleado.apellido}</span>
                    <span className="text-[#6B7280] whitespace-nowrap">Código:</span>
                    <span className="font-medium font-mono text-[#1A1A1A] break-all min-w-0">{empleado.codigo_empleado}</span>
                    <span className="text-[#6B7280] whitespace-nowrap">Puesto:</span>
                    <span className="font-medium text-[#1A1A1A] break-words min-w-0">{empleado.puesto?.nombre || 'N/A'}</span>
                    <span className="text-[#6B7280] whitespace-nowrap">GPS:</span>
                    <span className="font-medium text-[#1A1A1A] flex items-center gap-1.5 min-w-0">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        gps?.precision != null
                          ? gps.precision < 20 ? 'bg-green-500' : gps.precision < 50 ? 'bg-yellow-500' : 'bg-red-500'
                          : 'bg-gray-400'
                      }`} />
                      {gps?.precision != null ? `±${gps.precision}m` : 'Esperando...'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <button onClick={reiniciar} disabled={step === 'processing'} className="flex-1 alm-btn-secondary text-xs sm:text-sm min-h-[44px]">
                    Cancelar
                  </button>
                  <button onClick={confirmar} disabled={step === 'processing'} className="flex-1 alm-btn-primary text-xs sm:text-sm min-h-[44px] flex items-center justify-center gap-1.5 sm:gap-2">
                    {step === 'processing' ? (
                      <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Procesando...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Confirmar {tipoMarcacion === 'ENTRADA' ? 'Entrada' : 'Salida'}</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {(step === 'done' || step === 'error') && resultado && (
              <div className={`${resultado.tipo === 'success' ? 'alm-alert-success' : 'alm-alert-error'} text-center space-y-4 py-4 sm:py-6 alm-step-in`}>
                <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full ${resultado.tipo === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {resultado.tipo === 'success' ? <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" /> : <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />}
                </div>
                <p className={`text-base sm:text-lg font-semibold ${resultado.tipo === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {resultado.message}
                </p>
                {resultado.tipo === 'success' ? (
                  <p className="text-xs sm:text-sm text-gray-400">Volviendo al inicio...</p>
                ) : (
                  <button onClick={reiniciar} className="alm-btn-primary text-sm sm:text-base min-h-[44px]">
                    Nueva Marcación
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bottom tab nav for mobile */}
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

function QrScanner({
  onDetected,
  onBack,
}: {
  onDetected: (codigo: string) => void;
  onBack: () => void;
}) {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const runningRef = useRef(false);

  async function stopScanner() {
    if (scannerRef.current && runningRef.current) {
      try { await scannerRef.current.stop(); } catch { /* ignore */ }
      runningRef.current = false;
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (!cancelled) { await stopScanner(); onDetected(decodedText); }
          },
          () => {}
        );
        runningRef.current = true;
      } catch {
        if (!cancelled) setCameraError('No se pudo acceder a la cámara');
      }
    }
    startCamera();
    return () => { cancelled = true; stopScanner(); };
  }, [onDetected]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) stopScanner().then(() => onDetected(manualCode.trim()));
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="alm-alert text-xs sm:text-sm">
        Apunta la cámara al código QR del empleado
      </div>

      <div id="qr-reader" className="mx-auto max-w-[280px] sm:max-w-sm [&_video]:rounded-lg" />

      {cameraError && <p className="text-xs sm:text-sm text-red-600 text-center">{cameraError}</p>}

      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="O ingresa el código manualmente..."
          className="flex-1 alm-input min-h-[44px]"
        />
        <button type="submit" className="alm-btn-primary text-sm shrink-0 min-h-[44px]">
          Buscar
        </button>
      </form>
    </div>
  );
}
