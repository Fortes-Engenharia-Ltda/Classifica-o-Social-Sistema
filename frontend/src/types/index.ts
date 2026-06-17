export interface Usuario {
  id: number;
  nome: string;
  email: string;
  fotoPerfil?: string;
  dataNascimento?: string | null;
  perfil: 'MASTER' | 'ADMIN' | 'ANALYST' | 'MANAGER';
  status: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface Obra {
  id: number;
  codigoObra: string;
  nomeObra: string;
  cidade?: string;
  centroCusto?: string;
  status: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  idCentroCusto?: string | null;
  idUN?: string | null;
  un?: string | null;
  descricao?: string | null;
  projeto?: string | null;
  local?: string | null;
  cliente?: string | null;
  gerente?: string | null;
  gestor?: string | null;
}

export interface ImpactoMensalProjeto {
  competencia: string;
  pessoasDiretas: number;
  pessoasIndiretas: number;
}

export interface ParticipanteProjeto {
  nome: string;
  email: string;
  setorCentroCusto: string;
}

export interface Projeto {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  publicoAlvo?: string | null;
  instituicaoId?: number | null;
  instituicaoNome?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  impactoMensal?: ImpactoMensalProjeto[];
  participantesProjeto?: ParticipanteProjeto[];
  status: boolean;
  pessoasCadastradas?: string;
  quantidadePessoasCadastradas?: number;
  valorMonetarioPrevisto?: number;
  valorMonetarioRealizado?: number;
  imagem?: string | null;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface Programa {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  status: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface Classificacao {
  id: number;
  codigo: string;
  nome: string;
  categoria?: string;
  status: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface NotaFiscal {
  id: number;
  numeroNF: string;
  fornecedor?: string;
  cnpj?: string;
  valor: number;
  dataEmissao: string;
  obraId: number;
  actionCode?: number | null;
  classificacaoContaId?: number | null;
  orcadoNaoOrcadoId?: number | null;
  programaId?: number | null;
  instituicaoId?: number | null;
  projetoId?: number | null;
  classificacaoAttId?: number | null;
  publicoAlvoId?: number | null;
  periodo?: string;
  localizacao?: string | null;
  unidadeNegocio?: string | null;
  status: 'PENDENTE' | 'CLASSIFICADA' | 'CONCLUIDA';
  origemImportacao?: string;
  observacao?: string;
  camposClassificacao?: {
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
  };
  pendenteClassificacao?: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface Alerta {
  id: number;
  notaFiscalId?: number;
  tipo: string;
  mensagem?: string;
  status: 'ATIVO' | 'RESOLVIDO' | 'IGNORADO';
  dataCriacao: string;
  responsavelId?: number;
  dataResolucao?: string;
}

export interface Metricas {
  totalNF: number;
  nfPendentes: number;
  nfClassificadas: number;
  nfComPendenciaClassificacao: number;
  totalValor: number;
  totalValorOrcado?: number;
  totalValorNaoOrcado?: number;
  alertasAtivos: number;
  totalInstituicoes: number;
  totalObras: number;
  obrasAtivas: number;
  obrasInativas: number;
  valorPrevistoProjetos: number;
  valorRealizadoProjetos: number;
  totalPessoasImpactadas: number;
  distribuicaoPorPrograma?: Array<{ name: string; value: number }>;
  distribuicaoPorClassificacao?: Array<{ name: string; value: number }>;
  distribuicaoPorOrcado?: Array<{ name: string; value: number }>;
  distribuicaoPorLocalizacao?: Array<{ name: string; value: number }>;
  curvaPrevistoRealizadoProjetos?: Array<{ projeto: string; previsto: number; realizado: number }>;
  curvaPrevistoRealizadoMensalProjetos?: {
    competencias: string[];
    series: Array<{
      projeto: string;
      previsto: number[];
      realizado: number[];
    }>;
    totalProjetos: number;
    projetosExibidos: number;
    metodologia: string;
  };
  valoresPorPrograma?: Array<{ name: string; value: number }>;
  valoresPorClassificacao?: Array<{ name: string; value: number }>;
  valoresPorObra?: Array<{ name: string; value: number }>;
  valoresPorOrcado?: Array<{ name: string; value: number }>;
  valoresPorLocalizacao?: Array<{ name: string; value: number }>;
  nfPorObra?: Array<{ name: string; value: number; valor?: number }>;
  filtrosDisponiveis?: {
    programas?: string[];
    classificacoes?: string[];
    orcadoNaoOrcado?: string[];
    obras?: Array<{ id: number; nome: string }>;
    projetos?: string[];
  };
}
