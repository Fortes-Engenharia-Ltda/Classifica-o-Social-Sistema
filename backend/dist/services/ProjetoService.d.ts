import { CreateProjetoDTO, UpdateProjetoDTO } from '../dtos/ProjetoDTO';
export declare class ProjetoService {
    private projetoRepository;
    create(data: CreateProjetoDTO): Promise<import("../dtos/ProjetoDTO").ProjetoResponseDTO>;
    findById(id: number): Promise<import("../dtos/ProjetoDTO").ProjetoResponseDTO | null>;
    findAll(page?: number, pageSize?: number, search?: string, status?: 'all' | 'active' | 'inactive', sortBy?: 'id' | 'nome' | 'codigo' | 'dataCriacao', sortOrder?: 'asc' | 'desc'): Promise<{
        projetos: import("../dtos/ProjetoDTO").ProjetoResponseDTO[];
        total: number;
    }>;
    update(id: number, data: UpdateProjetoDTO): Promise<import("../dtos/ProjetoDTO").ProjetoResponseDTO>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=ProjetoService.d.ts.map