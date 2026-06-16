// DTO para criar usuário
export interface CreateUsuarioDTO {
  nome: string;
  email: string;
  dataNascimento?: string;
  senha: string;
  perfil?: 'MASTER' | 'ADMIN' | 'ANALYST' | 'MANAGER';
  status?: boolean;
}

// DTO para atualizar usuário
export interface UpdateUsuarioDTO {
  nome?: string;
  email?: string;
  dataNascimento?: string;
  perfil?: 'MASTER' | 'ADMIN' | 'ANALYST' | 'MANAGER';
  status?: boolean;
}

// DTO para retornar usuário (sem senha)
export interface UsuarioResponseDTO {
  id: number;
  nome: string;
  email: string;
  dataNascimento?: Date | null;
  perfil: string;
  status: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

// DTO para login
export interface LoginDTO {
  email: string;
  senha: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  email: string;
  codigo: string;
  novaSenha: string;
}

// DTO para token
export interface TokenDTO {
  accessToken: string;
  usuario: UsuarioResponseDTO;
}
