export interface CreateProgramaDTO {
    codigo?: string;
    nome: string;
    descricao?: string;
    status?: boolean;
}
export interface UpdateProgramaDTO {
    codigo?: string;
    nome?: string;
    descricao?: string;
    status?: boolean;
}
export interface ProgramaResponseDTO {
    id: number;
    codigo: string;
    nome: string;
    descricao?: string;
    status: boolean;
    dataCriacao: Date;
    dataAtualizacao: Date;
}
//# sourceMappingURL=ProgramaDTO.d.ts.map