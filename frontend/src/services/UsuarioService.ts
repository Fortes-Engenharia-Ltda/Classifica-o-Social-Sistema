import api from './api';
import { Usuario } from '@/types';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  codigo: string;
  novaSenha: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    usuario: Usuario;
  };
}

export class UsuarioService {
  static async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/usuarios/login', data);
    return response.data;
  }

  static async updatePassword(id: number, senha: string): Promise<any> {
    const response = await api.put(`/usuarios/${id}/senha`, { senha });
    return response.data;
  }

  static async updateMyProfile(data: { nome?: string; email?: string }): Promise<any> {
    const response = await api.put('/usuarios/me', data);
    return response.data;
  }

  static async updateMyPassword(senha: string): Promise<any> {
    const response = await api.put('/usuarios/me/senha', { senha });
    return response.data;
  }

  static async create(data: Partial<Usuario> & { senha?: string }): Promise<any> {
    const response = await api.post('/usuarios', data);
    return response.data;
  }

  static async forgotPassword(data: ForgotPasswordRequest): Promise<any> {
    const response = await api.post('/usuarios/esqueci-senha', data);
    return response.data;
  }

  static async resetPassword(data: ResetPasswordRequest): Promise<any> {
    const response = await api.post('/usuarios/redefinir-senha', data);
    return response.data;
  }

  static async getProfile(): Promise<any> {
    const response = await api.get('/usuarios/profile');
    return response.data;
  }

  static async getAll(page: number = 1, pageSize: number = 10): Promise<any> {
    const response = await api.get(`/usuarios?page=${page}&pageSize=${pageSize}`);
    return response.data;
  }

  static async update(id: number, data: Partial<Usuario>): Promise<any> {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  }

  static async delete(id: number): Promise<any> {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  }
}
