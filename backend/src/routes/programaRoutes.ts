import { Router } from 'express';
import { ProgramaController } from '../controllers/ProgramaController';
import { authMiddleware, authorize } from '../middlewares/auth';

const router = Router();
const programaController = new ProgramaController();

// Todas as rotas protegidas
router.use(authMiddleware);

router.post('/', authorize('ADMIN'), (req, res) => programaController.create(req, res));
router.get('/', (req, res) => programaController.findAll(req, res));
router.get('/:id', (req, res) => programaController.findById(req, res));
router.put('/:id', authorize('ADMIN'), (req, res) => programaController.update(req, res));
router.delete('/:id', authorize('ADMIN'), (req, res) => programaController.delete(req, res));

export default router;
