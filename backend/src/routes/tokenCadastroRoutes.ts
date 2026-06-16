import { Router, Request, Response } from 'express';
import { TokenCadastroController } from '../controllers/TokenCadastroController';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();
const controller = new TokenCadastroController();

// Protegido — ADMIN, ANALYST, MASTER e MANAGER
router.post('/gerar', authMiddleware, (req: Request, res: Response) =>
  controller.gerarToken(req as AuthenticatedRequest, res),
);

// Público — a instituição usa para validar o link recebido
router.get('/validar', (req: Request, res: Response) =>
  controller.validarToken(req, res),
);

export default router;
