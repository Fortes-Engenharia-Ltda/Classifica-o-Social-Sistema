import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
export declare class NotaFiscalController {
    private parseStringListFilter;
    private parseNumberListFilter;
    private buildFilters;
    create(req: Request, res: Response): Promise<void>;
    findById(req: Request, res: Response): Promise<void>;
    findAll(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    deleteLote(req: Request, res: Response): Promise<void>;
    deleteAll(req: Request, res: Response): Promise<void>;
    classificar(req: AuthenticatedRequest, res: Response): Promise<void>;
    classificarLote(req: AuthenticatedRequest, res: Response): Promise<void>;
    importarExcel(req: AuthenticatedRequest, res: Response): Promise<void>;
    baixarTemplateExcel(req: AuthenticatedRequest, res: Response): Promise<void>;
    exportarExcel(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=NotaFiscalController.d.ts.map