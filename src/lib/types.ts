export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: 'ADMIN' | 'SUPERVISOR';
  activo: boolean;
  fecha_creacion?: string;
}

export interface Puesto {
  id: number;
  nombre: string;
}

export interface Empleado {
  id: number;
  codigo_empleado: string;
  nombre: string;
  apellido: string;
  dui: string;
  telefono: string;
  id_puesto: number;
  qr_codigo: string;
  activo: boolean;
  fecha_creacion?: string;
  puesto?: Puesto;
}

export interface Operativo {
  id: number;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  fecha_creacion?: string;
}

export interface Ubicacion {
  id: number;
  latitud: string;
  longitud: string;
  direccion?: string;
}

export interface Asistencia {
  id: number;
  id_empleado: number;
  id_operativo: number;
  id_usuario_registra: number;
  id_usuario_modifica?: number | null;
  id_ubicacion: number;
  tipo_marcacion: 'ENTRADA' | 'SALIDA';
  fecha_hora: string;
  modificado_en?: string | null;
  observaciones: string | null;
  empleado?: Empleado;
  operativo?: Operativo;
  usuario_registra?: Usuario;
  usuario_modifica?: Usuario;
  ubicacion?: Ubicacion;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
  timestamp: string;
}

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  usuario: Usuario;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

export interface AsistenciaRequest {
  codigoEmpleado: string;
  operativoId: number;
  latitud: number;
  longitud: number;
  precision?: number;
  observaciones?: string;
}

export interface AsistenciaResponse {
  message: string;
  asistencia: {
    id: number;
    empleado: string;
    codigo: string;
    operativo: string;
    tipo: 'ENTRADA' | 'SALIDA';
    fecha_hora: string;
  };
}

export interface EditarAsistenciaRequest {
  codigoEmpleado?: string;
  operativoId?: number;
  latitud?: number;
  longitud?: number;
  tipo_marcacion?: 'ENTRADA' | 'SALIDA';
  observaciones?: string;
}

export interface CreateUsuarioRequest {
  nombre: string;
  correo: string;
  password: string;
  rol: 'ADMIN' | 'SUPERVISOR';
  activo?: boolean;
}

export interface CreateEmpleadoRequest {
  codigo_empleado: string;
  nombre: string;
  apellido: string;
  id_puesto: number;
  qr_codigo?: string;
  activo?: boolean;
}

export interface CreateOperativoRequest {
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo?: boolean;
}
