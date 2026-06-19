export interface CreateObraDTO {
    codigoObra: string;
    nomeObra: string;
    cidade?: string;
    centroCusto?: string;
    status?: boolean;
    idCentroCusto?: string;
    idUN?: string;
    un?: string;
    descricao?: string;
    projeto?: string;
    local?: string;
    cliente?: string;
    gerente?: string;
    gestor?: string;
}
export interface UpdateObraDTO {
    codigoObra?: string;
    nomeObra?: string;
    cidade?: string;
    centroCusto?: string;
    status?: boolean;
    idCentroCusto?: string;
    idUN?: string;
    un?: string;
    descricao?: string;
    projeto?: string;
    local?: string;
    cliente?: string;
    gerente?: string;
    gestor?: string;
}
export interface ObraResponseDTO {
    id: number;
    codigoObra: string;
    nomeObra: string;
    cidade?: string;
    centroCusto?: string;
    status: boolean;
    dataCriacao: Date;
    dataAtualizacao: Date;
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
//# sourceMappingURL=ObraDTO.d.ts.map