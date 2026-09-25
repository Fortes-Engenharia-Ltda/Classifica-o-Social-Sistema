// DTO para criar nota fiscal
export interface CreateNotaFiscalDTO {
  numeroNF: string;
  fornecedor?: string;
  cnpj?: string;
  valor: number;
  dataEmissao: string;
  obraId: number;
  actionCode?: number;
  orcadoNaoOrcadoId?: number | null;
  programaId?: number | null;
  instituicaoId?: number | null;
  projetoId?: number | null;
  classificacaoAttId?: number | null;
  publicoAlvoId?: number | null;
  status?: string;
  origemImportacao?: string;
  observacao?: string;
  camposClassificacao?: CamposClassificacaoDTO;
}

// DTO para atualizar nota fiscal
export interface UpdateNotaFiscalDTO {
  numeroNF?: string;
  fornecedor?: string;
  cnpj?: string;
  valor?: number;
  dataEmissao?: string;
  obraId?: number;
  actionCode?: number;
  orcadoNaoOrcadoId?: number | null;
  programaId?: number | null;
  instituicaoId?: number | null;
  projetoId?: number | null;
  classificacaoAttId?: number | null;
  publicoAlvoId?: number | null;
  status?: string;
  observacao?: string;
  camposClassificacao?: CamposClassificacaoDTO;
}

export interface CamposClassificacaoDTO {
  indiceImportacao?: string | null;
  orcadoNaoOrcado?: string | null;
  programa?: string | null;
  instituicao?: string | null;
  projeto?: string | null;
  classificacaoProjetoAtt?: string | null;
  historico?: string | null;
  unidadeNegocio?: string | null;
  dataPagamento?: string | null;
  razaoSocial?: string | null;
  valor?: number | null;
  codDocumento?: string | null;
  observacoes?: string | null;
  publicoAlvo?: string | null;
  classe?: string | null;
  classificacaoConta?: string | null;
}

// DTO para retornar nota fiscal
export interface NotaFiscalResponseDTO {
  id: number;
  numeroNF: string;
  fornecedor?: string;
  cnpj?: string;
  valor: number;
  dataEmissao: Date;
  obraId: number;
  actionCode?: number | null;
  orcadoNaoOrcadoId?: number | null;
  programaId?: number | null;
  instituicaoId?: number | null;
  projetoId?: number | null;
  classificacaoAttId?: number | null;
  publicoAlvoId?: number | null;
  periodo?: string;
  localizacao?: string | null;
  unidadeNegocio?: string | null;
  status: string;
  origemImportacao?: string;
  observacao?: string;
  camposClassificacao?: CamposClassificacaoDTO;
  pendenteClassificacao?: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

// DTO para classificar nota fiscal
export interface ClassificarNotaFiscalDTO {
  notaFiscalId: number;
  projetoId?: number;
  programaId?: number;
  classificacaoId?: number;
  obraId?: number;
}

// DTO para importação em lote
export interface ClassificarLoteDTO {
  notasFiscaisIds: number[];
  projetoId?: number;
  programaId?: number;
  classificacaoId?: number;
  camposClassificacao?: CamposClassificacaoDTO;
}

export interface ExcluirNotasFiscaisLoteDTO {
  notasFiscaisIds: number[];
}

export interface ListarNotasFiscaisFiltersDTO {
  status?: string;
  obraId?: number[];
  programa?: string[];
  classificacao?: string[];
  orcadoNaoOrcado?: string[];
  projeto?: string[];
  dataInicio?: string;
  dataFim?: string;
}

export interface ImportarNotaFiscalDTO {
  buffer: Buffer;
  nomeArquivo: string;
}
