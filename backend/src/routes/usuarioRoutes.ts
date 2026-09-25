import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { authMiddleware, authorize } from '../middlewares/auth';

const router = Router();
const usuarioController = new UsuarioController();

// Rotas públicas
router.post('/login', (req, res) => usuarioController.login(req, res));
router.post('/esqueci-senha', (req, res) => usuarioController.forgotPassword(req, res));
router.post('/redefinir-senha', (req, res) => usuarioController.resetPassword(req, res));

// Rotas protegidas
router.use(authMiddleware);

router.get('/profile', (req, res) => usuarioController.profile(req, res));
router.put('/me', (req, res) => usuarioController.updateMe(req, res));
router.put('/me/senha', (req, res) => usuarioController.updateMyPassword(req, res));
router.post('/', authorize('MASTER', 'ADMIN', 'MANAGER'), (req, res) => usuarioController.create(req, res));
router.get('/:id', authorize('MASTER', 'ADMIN', 'MANAGER'), (req, res) => usuarioController.findById(req, res));
router.get('/', authorize('MASTER', 'ADMIN', 'MANAGER'), (req, res) => usuarioController.findAll(req, res));
router.put('/:id', authorize('MASTER', 'ADMIN', 'MANAGER'), (req, res) => usuarioController.update(req, res));
router.put('/:id/senha', authorize('MASTER', 'ADMIN', 'MANAGER'), (req, res) => usuarioController.updatePassword(req, res));
router.delete('/:id', authorize('MASTER', 'ADMIN', 'MANAGER'), (req, res) => usuarioController.delete(req, res));

export default router;
