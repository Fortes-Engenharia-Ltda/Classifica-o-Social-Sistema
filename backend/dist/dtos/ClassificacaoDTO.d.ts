export interface CreateClassificacaoDTO {
    codigo?: string;
    nome: string;
    categoria?: string;
    status?: boolean;
}
export interface UpdateClassificacaoDTO {
    codigo?: string;
    nome?: string;
    categoria?: string;
    status?: boolean;
}
export interface ClassificacaoResponseDTO {
    id: number;
    codigo: string;
    nome: string;
    categoria?: string;
    status: boolean;
    dataCriacao: Date;
    dataAtualizacao: Date;
}
//# sourceMappingURL=ClassificacaoDTO.d.ts.map