// DTO para criar classificação
export interface CreateClassificacaoDTO {
  codigo?: string;
  nome: string;
  categoria?: string;
  status?: boolean;
}

// DTO para atualizar classificação
export interface UpdateClassificacaoDTO {
  codigo?: string;
  nome?: string;
  categoria?: string;
  status?: boolean;
}

// DTO para retornar classificação
export interface ClassificacaoResponseDTO {
  id: number;
  codigo: string;
  nome: string;
  categoria?: string;
  status: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
}
