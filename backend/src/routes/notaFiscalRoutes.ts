import { Router } from 'express';
import multer from 'multer';
import { NotaFiscalController } from '../controllers/NotaFiscalController';
import { authMiddleware, authorize } from '../middlewares/auth';

const router = Router();
const notaFiscalController = new NotaFiscalController();
const upload = multer({ storage: multer.memoryStorage() });

// Todas as rotas protegidas
router.use(authMiddleware);

// Classificação
router.post('/lote/classificar', (req, res) => notaFiscalController.classificarLote(req, res));
router.post('/:id/classificar', (req, res) => notaFiscalController.classificar(req, res));
router.delete('/lote', authorize('MASTER'), (req, res) => notaFiscalController.deleteLote(req, res));
router.delete('/all', authorize('MASTER'), (req, res) => notaFiscalController.deleteAll(req, res));
router.get('/template-excel', authorize('ADMIN', 'ANALYST', 'MANAGER', 'MASTER'), (req, res) =>
  notaFiscalController.baixarTemplateExcel(req as any, res),
);
router.get('/exportar-excel', authorize('ADMIN', 'ANALYST', 'MANAGER', 'MASTER'), (req, res) =>
	notaFiscalController.exportarExcel(req as any, res),
);
router.post('/importar-excel', authorize('ADMIN', 'ANALYST'), upload.single('file'), (req, res) =>
	notaFiscalController.importarExcel(req, res),
);

// CRUD
router.post('/', authorize('ADMIN', 'ANALYST'), (req, res) => notaFiscalController.create(req, res));
router.get('/', (req, res) => notaFiscalController.findAll(req, res));
router.get('/:id', (req, res) => notaFiscalController.findById(req, res));
router.put('/:id', authorize('ADMIN', 'ANALYST'), (req, res) => notaFiscalController.update(req, res));
router.delete('/:id', authorize('ADMIN'), (req, res) => notaFiscalController.delete(req, res));

export default router;
