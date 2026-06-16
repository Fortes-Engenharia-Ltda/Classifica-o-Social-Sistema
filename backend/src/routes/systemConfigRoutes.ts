import { Router } from 'express';
import { authMiddleware, authorize } from '../middlewares/auth';
import { SystemConfigController } from '../controllers/SystemConfigController';

const router = Router();
const controller = new SystemConfigController();

router.use(authMiddleware);

router.get('/perfis', authorize('MASTER', 'MANAGER'), (req, res) => controller.getPerfis(req, res));
router.get('/modulos/me', (req, res) => controller.getVisibleModules(req, res));
router.get('/modulos', authorize('MASTER', 'MANAGER'), (req, res) => controller.getModulesConfig(req, res));
router.post('/modulos/perfis', authorize('MASTER', 'MANAGER'), (req, res) => controller.createModulesProfile(req, res));
router.delete('/modulos/perfis/:perfil', authorize('MASTER', 'MANAGER'), (req, res) => controller.deleteModulesProfile(req, res));
router.put('/modulos/:perfil', authorize('MASTER', 'MANAGER'), (req, res) => controller.updateModulesConfig(req, res));
router.get('/sqlserver', authorize('MASTER', 'MANAGER'), (req, res) => controller.getSqlServerConfig(req, res));
router.put('/sqlserver', authorize('MASTER', 'MANAGER'), (req, res) => controller.updateSqlServerConfig(req, res));
router.get('/smtp', authorize('MASTER', 'MANAGER'), (req, res) => controller.getSmtpConfig(req, res));
router.put('/smtp', authorize('MASTER', 'MANAGER'), (req, res) => controller.updateSmtpConfig(req, res));
router.post('/smtp/testar', authorize('MASTER', 'MANAGER'), (req, res) => controller.testSmtpConfig(req, res));
router.get('/email-templates', authorize('MASTER', 'MANAGER'), (req, res) => controller.getEmailTemplates(req, res));
router.put('/email-templates/:tipo', authorize('MASTER', 'MANAGER'), (req, res) => controller.updateEmailTemplate(req, res));
router.post('/email-templates/:tipo/restaurar', authorize('MASTER', 'MANAGER'), (req, res) => controller.restoreEmailTemplate(req, res));

export default router;
