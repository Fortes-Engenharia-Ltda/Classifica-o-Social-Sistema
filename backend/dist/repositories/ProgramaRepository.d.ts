import { CreateProgramaDTO, UpdateProgramaDTO, ProgramaResponseDTO } from '../dtos/ProgramaDTO';
export declare class ProgramaRepository {
    create(data: CreateProgramaDTO): Promise<ProgramaResponseDTO>;
    findById(id: number): Promise<ProgramaResponseDTO | null>;
    findAll(page?: number, pageSize?: number, search?: string, status?: 'all' | 'active' | 'inactive', sortBy?: 'id' | 'nome' | 'codigo' | 'dataCriacao', sortOrder?: 'asc' | 'desc'): Promise<{
        programas: ProgramaResponseDTO[];
        total: number;
    }>;
    update(id: number, data: UpdateProgramaDTO): Promise<ProgramaResponseDTO>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=ProgramaRepository.d.ts.map