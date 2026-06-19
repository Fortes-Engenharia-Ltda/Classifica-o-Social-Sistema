import { CreateProjetoDTO, UpdateProjetoDTO, ProjetoResponseDTO } from '../dtos/ProjetoDTO';
export declare class ProjetoRepository {
    /**
     * Calcula a soma de todas as Notas Fiscais classificadas para um projeto
     */
    private calcularValorRealizado;
    private mapResponse;
    create(data: CreateProjetoDTO): Promise<ProjetoResponseDTO>;
    findById(id: number): Promise<ProjetoResponseDTO | null>;
    findAll(page?: number, pageSize?: number, search?: string, status?: 'all' | 'active' | 'inactive', sortBy?: 'id' | 'nome' | 'codigo' | 'dataCriacao', sortOrder?: 'asc' | 'desc'): Promise<{
        projetos: ProjetoResponseDTO[];
        total: number;
    }>;
    update(id: number, data: UpdateProjetoDTO): Promise<ProjetoResponseDTO>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=ProjetoRepository.d.ts.map