import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
export declare class DashboardController {
    private readonly curvaProjetoLimit;
    private listarOrcadoNaoOrcadoAtivos;
    private getRegiao;
    private normalize;
    private normalizeKey;
    private isOrcadoClassificacao;
    private isNaoOrcadoClassificacao;
    private parseStringListFilter;
    private parseNumberListFilter;
    private matchFilter;
    private calcularPessoasImpactadas;
    private monthKey;
    private formatMonthKey;
    private startOfMonth;
    private addMonth;
    private monthsBetweenInclusive;
    private buildCurvaMensalProjetos;
    getMetricas(req: AuthenticatedRequest, res: Response): Promise<void>;
    getAlertas(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=DashboardController.d.ts.map