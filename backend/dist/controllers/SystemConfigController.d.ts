import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
export declare class SystemConfigController {
    getPerfis(req: AuthenticatedRequest, res: Response): void;
    getVisibleModules(req: AuthenticatedRequest, res: Response): void;
    getModulesConfig(req: AuthenticatedRequest, res: Response): void;
    updateModulesConfig(req: AuthenticatedRequest, res: Response): void;
    createModulesProfile(req: AuthenticatedRequest, res: Response): void;
    deleteModulesProfile(req: AuthenticatedRequest, res: Response): void;
    getSqlServerConfig(req: AuthenticatedRequest, res: Response): void;
    updateSqlServerConfig(req: AuthenticatedRequest, res: Response): void;
    getSmtpConfig(req: AuthenticatedRequest, res: Response): void;
    updateSmtpConfig(req: AuthenticatedRequest, res: Response): void;
    testSmtpConfig(req: AuthenticatedRequest, res: Response): Promise<void>;
    getEmailTemplates(req: AuthenticatedRequest, res: Response): void;
    updateEmailTemplate(req: AuthenticatedRequest, res: Response): void;
    restoreEmailTemplate(req: AuthenticatedRequest, res: Response): void;
}
//# sourceMappingURL=SystemConfigController.d.ts.map