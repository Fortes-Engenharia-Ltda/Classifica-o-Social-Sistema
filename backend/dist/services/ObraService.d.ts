import { CreateObraDTO, UpdateObraDTO } from '../dtos/ObraDTO';
export declare class ObraService {
    private obraRepository;
    private sqlServerDProjetosService;
    private construirCodigo;
    create(data: CreateObraDTO): Promise<import("../dtos/ObraDTO").ObraResponseDTO>;
    findById(id: number): Promise<import("../dtos/ObraDTO").ObraResponseDTO | null>;
    findAll(page?: number, pageSize?: number, search?: string, status?: 'all' | 'active' | 'inactive', sortBy?: 'id' | 'codigoObra' | 'nomeObra' | 'status' | 'projeto' | 'idCentroCusto' | 'centroCusto' | 'idUN' | 'un' | 'local' | 'cliente' | 'gerente' | 'gestor' | 'dataCriacao', sortOrder?: 'asc' | 'desc'): Promise<{
        obras: import("../dtos/ObraDTO").ObraResponseDTO[];
        total: number;
    }>;
    syncFromDProjetos(): Promise<{
        totalLidas: number;
        totalSincronizadas: number;
    }>;
    update(id: number, data: UpdateObraDTO): Promise<import("../dtos/ObraDTO").ObraResponseDTO>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=ObraService.d.ts.map