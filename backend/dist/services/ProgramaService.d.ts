import { CreateProgramaDTO, UpdateProgramaDTO } from '../dtos/ProgramaDTO';
export declare class ProgramaService {
    private programaRepository;
    create(data: CreateProgramaDTO): Promise<import("../dtos/ProgramaDTO").ProgramaResponseDTO>;
    findById(id: number): Promise<import("../dtos/ProgramaDTO").ProgramaResponseDTO | null>;
    findAll(page?: number, pageSize?: number, search?: string, status?: 'all' | 'active' | 'inactive', sortBy?: 'id' | 'nome' | 'codigo' | 'dataCriacao', sortOrder?: 'asc' | 'desc'): Promise<{
        programas: import("../dtos/ProgramaDTO").ProgramaResponseDTO[];
        total: number;
    }>;
    update(id: number, data: UpdateProgramaDTO): Promise<import("../dtos/ProgramaDTO").ProgramaResponseDTO>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=ProgramaService.d.ts.map