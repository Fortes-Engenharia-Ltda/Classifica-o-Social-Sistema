import { CreateClassificacaoDTO, UpdateClassificacaoDTO, ClassificacaoResponseDTO } from '../dtos/ClassificacaoDTO';
export declare class ClassificacaoRepository {
    create(data: CreateClassificacaoDTO): Promise<ClassificacaoResponseDTO>;
    findById(id: number): Promise<ClassificacaoResponseDTO | null>;
    findAll(page?: number, pageSize?: number, search?: string, status?: 'all' | 'active' | 'inactive', sortBy?: 'id' | 'nome' | 'codigo' | 'dataCriacao', sortOrder?: 'asc' | 'desc'): Promise<{
        classificacoes: ClassificacaoResponseDTO[];
        total: number;
    }>;
    update(id: number, data: UpdateClassificacaoDTO): Promise<ClassificacaoResponseDTO>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=ClassificacaoRepository.d.ts.map