import api from './api';
import { Obra, Projeto, Programa, Classificacao } from '@/types';

export class ObraService {
  static async getAll(
    page: number = 1,
    pageSize: number = 10,
    filters?: { search?: string; status?: 'all' | 'active' | 'inactive' },
  ): Promise<any> {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    if (filters?.search?.trim()) {
      params.set('search', filters.search.trim());
    }

    if (filters?.status && filters.status !== 'all') {
      params.set('status', filters.status);
    }

    const response = await api.get(`/obras?${params.toString()}`);
    return response.data;
  }

  static async getById(id: number): Promise<any> {
    const response = await api.get(`/obras/${id}`);
    return response.data;
  }

  static async create(data: Partial<Obra>): Promise<any> {
    const response = await api.post('/obras', data);
    return response.data;
  }

  static async update(id: number, data: Partial<Obra>): Promise<any> {
    const response = await api.put(`/obras/${id}`, data);
    return response.data;
  }

  static async delete(id: number): Promise<any> {
    const response = await api.delete(`/obras/${id}`);
    return response.data;
  }

  static async syncDProjetos(): Promise<any> {
    const response = await api.post('/obras/sync/dprojetos');
    return response.data;
  }
}

export class ProjetoService {
  static async getAll(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      search?: string;
      status?: 'all' | 'active' | 'inactive';
      sortBy?: 'id' | 'nome' | 'codigo' | 'dataCriacao';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<any> {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    if (filters?.search?.trim()) params.set('search', filters.search.trim());
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

    const response = await api.get(`/projetos?${params.toString()}`);
    return response.data;
  }

  static async getById(id: number): Promise<any> {
    const response = await api.get(`/projetos/${id}`);
    return response.data;
  }

  static async create(data: Partial<Projeto>): Promise<any> {
    const response = await api.post('/projetos', data);
    return response.data;
  }

  static async update(id: number, data: Partial<Projeto>): Promise<any> {
    const response = await api.put(`/projetos/${id}`, data);
    return response.data;
  }

  static async delete(id: number): Promise<any> {
    const response = await api.delete(`/projetos/${id}`);
    return response.data;
  }

  static async listarInstituicoesPorProjeto(projetoId: number): Promise<any> {
    const response = await api.get(`/projetos/${projetoId}/instituicoes`);
    return response.data;
  }
}

export class ProgramaService {
  static async getAll(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      search?: string;
      status?: 'all' | 'active' | 'inactive';
      sortBy?: 'id' | 'nome' | 'codigo' | 'dataCriacao';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<any> {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    if (filters?.search?.trim()) params.set('search', filters.search.trim());
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

    const response = await api.get(`/programas?${params.toString()}`);
    return response.data;
  }

  static async getById(id: number): Promise<any> {
    const response = await api.get(`/programas/${id}`);
    return response.data;
  }

  static async create(data: Partial<Programa>): Promise<any> {
    const response = await api.post('/programas', data);
    return response.data;
  }

  static async update(id: number, data: Partial<Programa>): Promise<any> {
    const response = await api.put(`/programas/${id}`, data);
    return response.data;
  }

  static async delete(id: number): Promise<any> {
    const response = await api.delete(`/programas/${id}`);
    return response.data;
  }
}

export class ClassificacaoService {
  static async getAll(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      search?: string;
      status?: 'all' | 'active' | 'inactive';
      sortBy?: 'id' | 'nome' | 'codigo' | 'dataCriacao';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<any> {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    if (filters?.search?.trim()) params.set('search', filters.search.trim());
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

    const response = await api.get(`/classificacoes?${params.toString()}`);
    return response.data;
  }

  static async getById(id: number): Promise<any> {
    const response = await api.get(`/classificacoes/${id}`);
    return response.data;
  }

  static async create(data: Partial<Classificacao>): Promise<any> {
    const response = await api.post('/classificacoes', data);
    return response.data;
  }

  static async update(id: number, data: Partial<Classificacao>): Promise<any> {
    const response = await api.put(`/classificacoes/${id}`, data);
    return response.data;
  }

  static async delete(id: number): Promise<any> {
    const response = await api.delete(`/classificacoes/${id}`);
    return response.data;
  }
}

export class DashboardService {
  static async getMetricas(filters?: {
    programa?: string[];
    classificacao?: string[];
    orcadoNaoOrcado?: string[];
    obraId?: string[];
    projeto?: string[];
    dataInicio?: string;
    dataFim?: string;
  }): Promise<any> {
    const params = new URLSearchParams();

    const setListParam = (key: string, values?: string[]) => {
      if (!values?.length) {
        return;
      }

      params.set(key, values.join(','));
    };

    setListParam('programa', filters?.programa);
    setListParam('classificacao', filters?.classificacao);
    setListParam('orcadoNaoOrcado', filters?.orcadoNaoOrcado);
    setListParam('obraId', filters?.obraId);
    setListParam('projeto', filters?.projeto);
    if (filters?.dataInicio) params.set('dataInicio', filters.dataInicio);
    if (filters?.dataFim) params.set('dataFim', filters.dataFim);

    const qs = params.toString();
    const response = await api.get(`/dashboard/metricas${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  static async getAlertas(page: number = 1, pageSize: number = 10): Promise<any> {
    const response = await api.get(`/dashboard/alertas?page=${page}&pageSize=${pageSize}`);
    return response.data;
  }
}
