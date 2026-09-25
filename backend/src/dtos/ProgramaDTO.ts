// DTO para criar programa
export interface CreateProgramaDTO {
  codigo?: string;
  nome: string;
  descricao?: string;
  status?: boolean;
}

// DTO para atualizar programa
export interface UpdateProgramaDTO {
  codigo?: string;
  nome?: string;
  descricao?: string;
  status?: boolean;
}

// DTO para retornar programa
export interface ProgramaResponseDTO {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  status: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
}
