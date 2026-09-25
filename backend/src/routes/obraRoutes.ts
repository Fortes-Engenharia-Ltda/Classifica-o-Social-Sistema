import { Router } from 'express';
import { ObraController } from '../controllers/ObraController';
import { authMiddleware, authorize } from '../middlewares/auth';

const router = Router();
const obraController = new ObraController();

// Todas as rotas protegidas
router.use(authMiddleware);

router.post('/sync/dprojetos', authorize('ADMIN'), (req, res) => obraController.syncDProjetos(req, res));
router.post('/', authorize('ADMIN'), (req, res) => obraController.create(req, res));
router.get('/', (req, res) => obraController.findAll(req, res));
router.get('/:id', (req, res) => obraController.findById(req, res));
router.put('/:id', authorize('ADMIN'), (req, res) => obraController.update(req, res));
router.delete('/:id', authorize('ADMIN'), (req, res) => obraController.delete(req, res));

export default router;
