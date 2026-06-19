import { CreateNotaFiscalDTO, UpdateNotaFiscalDTO, ClassificarNotaFiscalDTO, ClassificarLoteDTO, ExcluirNotasFiscaisLoteDTO, ListarNotasFiscaisFiltersDTO } from '../dtos/NotaFiscalDTO';
export declare class NotaFiscalService {
    private notaFiscalRepository;
    private normalizeLookup;
    private getOrcadoNaoOrcadoMapAtivos;
    private getClassificacaoContaByActionCode;
    private resolveClassificacaoContaId;
    gerarTemplateExcel(): Promise<Buffer>;
    exportarExcel(pageSize?: number, filters?: ListarNotasFiscaisFiltersDTO): Promise<Buffer>;
    create(data: CreateNotaFiscalDTO): Promise<import("../dtos/NotaFiscalDTO").NotaFiscalResponseDTO>;
    findById(id: number): Promise<import("../dtos/NotaFiscalDTO").NotaFiscalResponseDTO | null>;
    findAll(page?: number, pageSize?: number, filters?: ListarNotasFiscaisFiltersDTO): Promise<{
        notasFiscais: import("../dtos/NotaFiscalDTO").NotaFiscalResponseDTO[];
        total: number;
    }>;
    update(id: number, data: UpdateNotaFiscalDTO): Promise<import("../dtos/NotaFiscalDTO").NotaFiscalResponseDTO>;
    delete(id: number): Promise<void>;
    deleteLote(data: ExcluirNotasFiscaisLoteDTO): Promise<number>;
    deleteAll(): Promise<number>;
    classificarNF(data: ClassificarNotaFiscalDTO, usuarioId: number): Promise<any>;
    classificarLote(data: ClassificarLoteDTO, usuarioId: number): Promise<{
        total: number;
        classificacoes: any[];
    }>;
    importarExcel(buffer: Buffer): Promise<{
        totalLinhas: number;
        importadas: number;
        ignoradas: number;
    }>;
    private toActionCode;
    private normalizeString;
    private toNumber;
    private toISODate;
    private getObraPadrao;
    private getOpcoesImportacao;
    private getOrcadoNaoOrcadoAtivos;
}
//# sourceMappingURL=NotaFiscalService.d.ts.map