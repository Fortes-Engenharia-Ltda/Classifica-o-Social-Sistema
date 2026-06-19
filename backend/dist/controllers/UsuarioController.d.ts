import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
export declare class UsuarioController {
    create(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    forgotPassword(req: Request, res: Response): Promise<void>;
    resetPassword(req: Request, res: Response): Promise<void>;
    findById(req: Request, res: Response): Promise<void>;
    findAll(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    updatePassword(req: Request, res: Response): Promise<void>;
    updateMe(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateMyPassword(req: AuthenticatedRequest, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    profile(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=UsuarioController.d.ts.map