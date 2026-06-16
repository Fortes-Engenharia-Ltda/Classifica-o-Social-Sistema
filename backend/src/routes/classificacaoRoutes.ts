import { Router } from 'express';
import { ClassificacaoController } from '../controllers/ClassificacaoController';
import { authMiddleware, authorize } from '../middlewares/auth';

const router = Router();
const classificacaoController = new ClassificacaoController();

// Todas as rotas protegidas
router.use(authMiddleware);

router.post('/', authorize('ADMIN'), (req, res) => classificacaoController.create(req, res));
router.get('/', (req, res) => classificacaoController.findAll(req, res));
router.get('/:id', (req, res) => classificacaoController.findById(req, res));
router.put('/:id', authorize('ADMIN'), (req, res) => classificacaoController.update(req, res));
router.delete('/:id', authorize('ADMIN'), (req, res) => classificacaoController.delete(req, res));

export default router;
