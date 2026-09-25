export interface ImpactoMensalDTO {
  competencia: string;
  pessoasDiretas: number;
  pessoasIndiretas: number;
}

export interface ParticipanteProjetoDTO {
  nome: string;
  email: string;
  setorCentroCusto: string;
}

// DTO para criar projeto
export interface CreateProjetoDTO {
  codigo?: string;
  nome: string;
  descricao?: string;
  dataInicio?: string | Date;
  dataFim?: string | Date;
  impactoMensal?: ImpactoMensalDTO[];
  participantesProjeto?: ParticipanteProjetoDTO[];
  pessoasCadastradas?: string;
  quantidadePessoasCadastradas?: number;
  valorMonetarioPrevisto?: number;
  valorMonetarioRealizado?: number;
  publicoAlvo?: string;
  instituicaoId?: number | null;
  imagem?: string;
  status?: boolean;
}

// DTO para atualizar projeto
export interface UpdateProjetoDTO {
  codigo?: string;
  nome?: string;
  descricao?: string;
  dataInicio?: string | Date | null;
  dataFim?: string | Date | null;
  impactoMensal?: ImpactoMensalDTO[];
  participantesProjeto?: ParticipanteProjetoDTO[];
  pessoasCadastradas?: string;
  quantidadePessoasCadastradas?: number;
  valorMonetarioPrevisto?: number;
  valorMonetarioRealizado?: number;
  publicoAlvo?: string;
  instituicaoId?: number | null;
  imagem?: string;
  status?: boolean;
}

// DTO para retornar projeto
export interface ProjetoResponseDTO {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  dataInicio?: Date | null;
  dataFim?: Date | null;
  impactoMensal?: ImpactoMensalDTO[];
  participantesProjeto?: ParticipanteProjetoDTO[];
  pessoasCadastradas?: string;
  quantidadePessoasCadastradas: number;
  valorMonetarioPrevisto: number;
  valorMonetarioRealizado: number;
  publicoAlvo?: string | null;
  instituicaoId?: number | null;
  instituicaoNome?: string | null;
  imagem?: string;
  status: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
}
