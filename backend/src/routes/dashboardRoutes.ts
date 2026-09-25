import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const dashboardController = new DashboardController();

// Todas as rotas protegidas
router.use(authMiddleware);

router.get('/metricas', (req, res) => dashboardController.getMetricas(req, res));
router.get('/alertas', (req, res) => dashboardController.getAlertas(req, res));

export default router;
