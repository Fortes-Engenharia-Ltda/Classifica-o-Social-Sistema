import { CreateObraDTO, UpdateObraDTO, ObraResponseDTO } from '../dtos/ObraDTO';
export declare class ObraRepository {
    create(data: CreateObraDTO): Promise<ObraResponseDTO>;
    findById(id: number): Promise<ObraResponseDTO | null>;
    findByCodigo(codigo: string): Promise<ObraResponseDTO | null>;
    findAll(page?: number, pageSize?: number, search?: string, status?: 'all' | 'active' | 'inactive', sortBy?: 'id' | 'codigoObra' | 'nomeObra' | 'status' | 'projeto' | 'idCentroCusto' | 'centroCusto' | 'idUN' | 'un' | 'local' | 'cliente' | 'gerente' | 'gestor' | 'dataCriacao', sortOrder?: 'asc' | 'desc'): Promise<{
        obras: ObraResponseDTO[];
        total: number;
    }>;
    update(id: number, data: UpdateObraDTO): Promise<ObraResponseDTO>;
    upsertByCodigo(data: CreateObraDTO): Promise<ObraResponseDTO>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=ObraRepository.d.ts.map