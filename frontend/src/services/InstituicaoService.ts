import api from './api';

export interface InstituicaoFiltro {
  termo?: string;
  instituicao?: string;
  responsavel?: string;
  cnpj?: string;
  numero?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
  statusAtivo?: 'ATIVO' | 'INATIVO' | '';
  dataInicioDe?: string;
  dataInicioAte?: string;
  dataFimDe?: string;
  dataFimAte?: string;
  page?: number;
  pageSize?: number;
}

export interface RevisaoFiltro {
  termo?: string;
  instituicao?: string;
  responsavel?: string;
  cnpj?: string;
  cidade?: string;
  estado?: string;
  dataCadastroDe?: string;
  dataCadastroAte?: string;
}

export type LinkValidadeUnidade = 'MINUTOS' | 'HORAS' | 'DIAS';

export interface LinkValidadePayload {
  validadeValor: number;
  validadeUnidade: LinkValidadeUnidade;
}

export interface ContratoInstituicaoPayload {
  numeroContrato: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  obraIds: number[];
  termoAnexo?: string;
}

export const InstituicaoService = {
  async cadastrarInstituicaoCompleta(data: any) {
    return api.post('/instituicoes/completo', data);
  },

  async cadastrarInstituicao(data: any) {
    return api.post('/instituicoes', data);
  },

  async listarInstituicoes(filtros: InstituicaoFiltro = {}) {
    const params = new URLSearchParams();

    if (filtros.termo) params.append('termo', filtros.termo);
    if (filtros.instituicao) params.append('instituicao', filtros.instituicao);
    if (filtros.responsavel) params.append('responsavel', filtros.responsavel);
    if (filtros.cnpj) params.append('cnpj', filtros.cnpj);
    if (filtros.numero) params.append('numero', filtros.numero);
    if (filtros.complemento) params.append('complemento', filtros.complemento);
    if (filtros.cidade) params.append('cidade', filtros.cidade);
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.statusAtivo) params.append('statusAtivo', filtros.statusAtivo);
    if (filtros.dataInicioDe) params.append('dataInicioDe', filtros.dataInicioDe);
    if (filtros.dataInicioAte) params.append('dataInicioAte', filtros.dataInicioAte);
    if (filtros.dataFimDe) params.append('dataFimDe', filtros.dataFimDe);
    if (filtros.dataFimAte) params.append('dataFimAte', filtros.dataFimAte);
    params.append('page', String(filtros.page ?? 1));
    params.append('pageSize', String(filtros.pageSize ?? 10));

    return api.get(`/instituicoes?${params.toString()}`);
  },

  async cadastrarResponsavelInstituicao(data: any) {
    return api.post('/instituicoes/responsavel-instituicao', data);
  },

  async cadastrarResponsavelTecnico(data: any) {
    return api.post('/instituicoes/responsavel-tecnico', data);
  },

  async listarParaRevisao(status?: string, filtros: RevisaoFiltro = {}) {
    const params = new URLSearchParams();

    if (status) params.append('status', status);
    if (filtros.termo) params.append('termo', filtros.termo);
    if (filtros.instituicao) params.append('instituicao', filtros.instituicao);
    if (filtros.responsavel) params.append('responsavel', filtros.responsavel);
    if (filtros.cnpj) params.append('cnpj', filtros.cnpj);
    if (filtros.cidade) params.append('cidade', filtros.cidade);
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.dataCadastroDe) params.append('dataCadastroDe', filtros.dataCadastroDe);
    if (filtros.dataCadastroAte) params.append('dataCadastroAte', filtros.dataCadastroAte);

    const query = params.toString();
    return api.get(`/instituicoes/revisao${query ? `?${query}` : ''}`);
  },

  async revisarInstituicao(id: number, status: string, observacoes?: string) {
    return api.patch(`/instituicoes/${id}/revisar`, { status, observacoes });
  },

  async reabrirRevisao(id: number) {
    return api.patch(`/instituicoes/${id}/reabrir`, {});
  },

  async atualizarInstituicao(id: number, dados: any) {
    return api.patch(`/instituicoes/${id}`, dados);
  },

  async gerarLinkRevisao(id: number, payload?: Partial<LinkValidadePayload>) {
    return api.post(`/instituicoes/${id}/gerar-link-revisao`, payload ?? {});
  },

  async excluirInstituicao(id: number) {
    return api.delete(`/instituicoes/${id}`);
  },

  async listarContratosInstituicao(id: number) {
    return api.get(`/instituicoes/${id}/contratos`);
  },

  async cadastrarContratoInstituicao(id: number, formData: FormData) {
    return api.post(`/instituicoes/${id}/contratos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async atualizarContratoInstituicao(id: number, contratoId: number, formData: FormData) {
    return api.patch(`/instituicoes/${id}/contratos/${contratoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async excluirContratoInstituicao(id: number, contratoId: number) {
    return api.delete(`/instituicoes/${id}/contratos/${contratoId}`);
  },
};
