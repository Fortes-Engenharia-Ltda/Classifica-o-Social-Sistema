export interface DProjetoRow {
    idCentroCusto: string | null;
    idUN: string | null;
    un: string | null;
    descricao: string | null;
    projeto: string | null;
    local: string | null;
    cliente: string | null;
    gerente: string | null;
    gestor: string | null;
    ativo: number | null;
}
export declare class SqlServerDProjetosService {
    private validarConfig;
    buscarDProjetos(): Promise<DProjetoRow[]>;
}
//# sourceMappingURL=SqlServerDProjetosService.d.ts.map