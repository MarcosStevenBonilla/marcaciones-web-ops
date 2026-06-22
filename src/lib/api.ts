import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  AsistenciaRequest,
  AsistenciaResponse,
  EditarAsistenciaRequest,
  Empleado,
  Operativo,
  Asistencia,
  Usuario,
  CreateUsuarioRequest,
  CreateEmpleadoRequest,
  CreateOperativoRequest,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem('access_token');
}

function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem('refresh_token');
}

function setTokens(access: string, refresh: string): void {
  if (!isBrowser()) return;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

function clearTokens(): void {
  if (!isBrowser()) return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('usuario');
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearTokens();
        if (isBrowser()) window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<ApiResponse<RefreshResponse>>(
          `${API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token } = data.data;
        setTokens(access_token, refresh_token);

        pendingRequests.forEach((cb) => cb(access_token));
        pendingRequests = [];

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return api(originalRequest);
      } catch {
        clearTokens();
        if (isBrowser()) window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
  setTokens(data.data.access_token, data.data.refresh_token);
  if (isBrowser()) localStorage.setItem('usuario', JSON.stringify(data.data.usuario));
  return data.data;
}

export async function logout(): Promise<void> {
  clearTokens();
}

export function getStoredUser(): Usuario | null {
  if (!isBrowser()) return null;
  const stored = localStorage.getItem('usuario');
  return stored ? JSON.parse(stored) : null;
}

export async function getEmpleados(): Promise<Empleado[]> {
  const { data } = await api.get<ApiResponse<Empleado[]>>('/empleados');
  return data.data;
}

export async function getEmpleado(id: number): Promise<Empleado> {
  const { data } = await api.get<ApiResponse<Empleado>>(`/empleados/${id}`);
  return data.data;
}

export async function getEmpleadoByCodigo(codigo: string): Promise<Empleado> {
  const { data } = await api.get<ApiResponse<Empleado>>(`/empleados/codigo/${codigo}`);
  return data.data;
}

export async function createEmpleado(payload: CreateEmpleadoRequest): Promise<Empleado> {
  const { data } = await api.post<ApiResponse<Empleado>>('/empleados', payload);
  return data.data;
}

export async function updateEmpleado(id: number, payload: Partial<CreateEmpleadoRequest>): Promise<Empleado> {
  const { data } = await api.put<ApiResponse<Empleado>>(`/empleados/${id}`, payload);
  return data.data;
}

export async function deleteEmpleado(id: number): Promise<void> {
  await api.delete(`/empleados/${id}`);
}

export async function getOperativos(): Promise<Operativo[]> {
  const { data } = await api.get<ApiResponse<Operativo[]>>('/operativos');
  return data.data;
}

export async function getOperativo(id: number): Promise<Operativo> {
  const { data } = await api.get<ApiResponse<Operativo>>(`/operativos/${id}`);
  return data.data;
}

export async function createOperativo(payload: CreateOperativoRequest): Promise<Operativo> {
  const { data } = await api.post<ApiResponse<Operativo>>('/operativos', payload);
  return data.data;
}

export async function updateOperativo(id: number, payload: Partial<CreateOperativoRequest>): Promise<Operativo> {
  const { data } = await api.put<ApiResponse<Operativo>>(`/operativos/${id}`, payload);
  return data.data;
}

export async function deleteOperativo(id: number): Promise<void> {
  await api.delete(`/operativos/${id}`);
}

export async function getAsistencias(): Promise<Asistencia[]> {
  const { data } = await api.get<ApiResponse<Asistencia[]>>('/asistencias');
  return data.data;
}

export async function getAsistenciasByEmpleado(empleadoId: number): Promise<Asistencia[]> {
  const { data } = await api.get<ApiResponse<Asistencia[]>>(`/asistencias/empleado/${empleadoId}`);
  return data.data;
}

export async function getAsistenciasByOperativo(operativoId: number): Promise<Asistencia[]> {
  const { data } = await api.get<ApiResponse<Asistencia[]>>(`/asistencias/operativo/${operativoId}`);
  return data.data;
}

export async function registrarEntrada(payload: AsistenciaRequest): Promise<AsistenciaResponse> {
  const { data } = await api.post<ApiResponse<AsistenciaResponse>>('/asistencias/entrada', payload);
  return data.data;
}

export async function registrarSalida(payload: AsistenciaRequest): Promise<AsistenciaResponse> {
  const { data } = await api.post<ApiResponse<AsistenciaResponse>>('/asistencias/salida', payload);
  return data.data;
}

export async function editarAsistencia(id: number, payload: EditarAsistenciaRequest): Promise<AsistenciaResponse> {
  const { data } = await api.put<ApiResponse<AsistenciaResponse>>(`/asistencias/${id}`, payload);
  return data.data;
}

export async function getUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get<ApiResponse<Usuario[]>>('/usuarios');
  return data.data;
}

export async function createUsuario(payload: CreateUsuarioRequest): Promise<Usuario> {
  const { data } = await api.post<ApiResponse<Usuario>>('/usuarios', payload);
  return data.data;
}

export async function getUsuario(id: number): Promise<Usuario> {
  const { data } = await api.get<ApiResponse<Usuario>>(`/usuarios/${id}`);
  return data.data;
}

export async function updateUsuario(id: number, payload: Partial<CreateUsuarioRequest>): Promise<Usuario> {
  const { data } = await api.put<ApiResponse<Usuario>>(`/usuarios/${id}`, payload);
  return data.data;
}

export async function deleteUsuario(id: number): Promise<void> {
  await api.delete(`/usuarios/${id}`);
}

export async function getQrUrl(empleadoId: number): Promise<string> {
  const { data } = await api.get(`/empleados/${empleadoId}/qr`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(data);
}

export { api, setTokens, getAccessToken };
