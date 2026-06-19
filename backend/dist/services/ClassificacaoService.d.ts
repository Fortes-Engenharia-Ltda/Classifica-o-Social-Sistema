import { CreateClassificacaoDTO, UpdateClassificacaoDTO } from '../dtos/ClassificacaoDTO';
export declare class ClassificacaoService {
    private classificacaoRepository;
    create(data: CreateClassificacaoDTO): Promise<import("../dtos/ClassificacaoDTO").ClassificacaoResponseDTO>;
    findById(id: number): Promise<import("../dtos/ClassificacaoDTO").ClassificacaoResponseDTO | null>;
    findAll(page?: number, pageSize?: number, search?: string, status?: 'all' | 'active' | 'inactive', sortBy?: 'id' | 'nome' | 'codigo' | 'dataCriacao', sortOrder?: 'asc' | 'desc'): Promise<{
        classificacoes: import("../dtos/ClassificacaoDTO").ClassificacaoResponseDTO[];
        total: number;
    }>;
    update(id: number, data: UpdateClassificacaoDTO): Promise<import("../dtos/ClassificacaoDTO").ClassificacaoResponseDTO>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=ClassificacaoService.d.ts.map