import api from './api';
import { NotaFiscal } from '@/types';

export type NotaFiscalListFilters = {
  status?: string;
  obraId?: number | string | Array<number | string>;
  programa?: string[];
  classificacao?: string[];
  orcadoNaoOrcado?: string[];
  projeto?: string[];
  dataInicio?: string;
  dataFim?: string;
};

const appendCsvParam = (params: URLSearchParams, key: string, value: unknown) => {
  if (value == null) {
    return;
  }

  const items = Array.isArray(value) ? value : [value];
  const normalized = items.map((item) => String(item || '').trim()).filter(Boolean);

  if (normalized.length) {
    params.set(key, normalized.join(','));
  }
};

export class NotaFiscalService {
  static async getAll(page: number = 1, pageSize: number = 10, filters?: NotaFiscalListFilters): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (filters?.status) {
      params.set('status', filters.status);
    }

    appendCsvParam(params, 'obraId', filters?.obraId);
    appendCsvParam(params, 'programa', filters?.programa);
    appendCsvParam(params, 'classificacao', filters?.classificacao);
    appendCsvParam(params, 'orcadoNaoOrcado', filters?.orcadoNaoOrcado);
    appendCsvParam(params, 'projeto', filters?.projeto);

    if (filters?.dataInicio) {
      params.set('dataInicio', filters.dataInicio);
    }

    if (filters?.dataFim) {
      params.set('dataFim', filters.dataFim);
    }

    const response = await api.get(`/notas-fiscais?${params.toString()}`);
    return response.data;
  }

  static async getById(id: number): Promise<any> {
    const response = await api.get(`/notas-fiscais/${id}`);
    return response.data;
  }

  static async create(data: Partial<NotaFiscal>): Promise<any> {
    const response = await api.post('/notas-fiscais', data);
    return response.data;
  }

  static async update(id: number, data: Partial<NotaFiscal>): Promise<any> {
    const response = await api.put(`/notas-fiscais/${id}`, data);
    return response.data;
  }

  static async delete(id: number): Promise<any> {
    const response = await api.delete(`/notas-fiscais/${id}`);
    return response.data;
  }

  static async deleteLote(notasFiscaisIds: number[]): Promise<any> {
    const response = await api.delete('/notas-fiscais/lote', {
      data: { notasFiscaisIds },
    });
    return response.data;
  }

  static async deleteAll(): Promise<any> {
    const response = await api.delete('/notas-fiscais/all');
    return response.data;
  }

  static async classificar(notaFiscalId: number, data: any): Promise<any> {
    const response = await api.post(`/notas-fiscais/${notaFiscalId}/classificar`, data);
    return response.data;
  }

  static async classificarLote(data: any): Promise<any> {
    const response = await api.post('/notas-fiscais/lote/classificar', data);
    return response.data;
  }

  static async importarExcel(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/notas-fiscais/importar-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  static async baixarTemplateExcel(): Promise<Blob> {
    const response = await api.get('/notas-fiscais/template-excel', {
      responseType: 'blob',
    });

    return response.data as Blob;
  }

  static async exportarExcel(filters?: NotaFiscalListFilters): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters?.status) {
      params.set('status', filters.status);
    }

    appendCsvParam(params, 'obraId', filters?.obraId);
    appendCsvParam(params, 'programa', filters?.programa);
    appendCsvParam(params, 'classificacao', filters?.classificacao);
    appendCsvParam(params, 'orcadoNaoOrcado', filters?.orcadoNaoOrcado);
    appendCsvParam(params, 'projeto', filters?.projeto);

    if (filters?.dataInicio) {
      params.set('dataInicio', filters.dataInicio);
    }

    if (filters?.dataFim) {
      params.set('dataFim', filters.dataFim);
    }

    const qs = params.toString();
    const response = await api.get(`/notas-fiscais/exportar-excel${qs ? `?${qs}` : ''}`, {
      responseType: 'blob',
    });

    return response.data as Blob;
  }
}
