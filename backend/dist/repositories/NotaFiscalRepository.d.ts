import { CreateNotaFiscalDTO, UpdateNotaFiscalDTO, NotaFiscalResponseDTO, ListarNotasFiscaisFiltersDTO } from '../dtos/NotaFiscalDTO';
export declare class NotaFiscalRepository {
    private fallbackFilePath;
    private normalize;
    private parseDateBoundary;
    private stringFilterMatch;
    private numberFilterMatch;
    private applyAdvancedFilters;
    create(data: CreateNotaFiscalDTO): Promise<NotaFiscalResponseDTO>;
    private defaultIncludes;
    findById(id: number): Promise<NotaFiscalResponseDTO | null>;
    findAll(page?: number, pageSize?: number, filters?: ListarNotasFiscaisFiltersDTO): Promise<{
        notasFiscais: NotaFiscalResponseDTO[];
        total: number;
    }>;
    update(id: number, data: UpdateNotaFiscalDTO): Promise<NotaFiscalResponseDTO>;
    delete(id: number): Promise<void>;
    deleteMany(ids: number[]): Promise<number>;
    deleteAll(): Promise<number>;
    findByNumero(numero: string): Promise<NotaFiscalResponseDTO | null>;
    getAllForPendenciaMetric(): Promise<{
        id: number;
        observacao: string | null;
    }[]>;
    private mapResponse;
    private readFallback;
    private writeFallback;
    private createFallback;
    private updateFallback;
}
//# sourceMappingURL=NotaFiscalRepository.d.ts.map