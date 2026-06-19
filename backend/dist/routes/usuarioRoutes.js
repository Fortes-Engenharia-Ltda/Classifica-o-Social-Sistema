"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UsuarioController_1 = require("../controllers/UsuarioController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const usuarioController = new UsuarioController_1.UsuarioController();
// Rotas públicas
router.post('/login', (req, res) => usuarioController.login(req, res));
router.post('/esqueci-senha', (req, res) => usuarioController.forgotPassword(req, res));
router.post('/redefinir-senha', (req, res) => usuarioController.resetPassword(req, res));
// Rotas protegidas
router.use(auth_1.authMiddleware);
router.get('/profile', (req, res) => usuarioController.profile(req, res));
router.put('/me', (req, res) => usuarioController.updateMe(req, res));
router.put('/me/senha', (req, res) => usuarioController.updateMyPassword(req, res));
router.post('/', (0, auth_1.authorize)('MASTER', 'ADMIN', 'MANAGER'), (req, res) => usuarioController.create(req, res));
router.get('/:id', (0, auth_1.authorize)('MASTER', 'ADMIN', 'MANAGER'), (req, res) => usuarioController.findById(req, res));
router.get('/', (0, auth_1.authorize)('MASTER', 'ADMIN', 'MANAGER'), (req, res) => usuarioController.findAll(req, res));
router.put('/:id', (0, auth_1.authorize)('MASTER', 'ADMIN', 'MANAGER'), (req, res) => usuarioController.update(req, res));
router.put('/:id/senha', (0, auth_1.authorize)('MASTER', 'ADMIN', 'MANAGER'), (req, res) => usuarioController.updatePassword(req, res));
router.delete('/:id', (0, auth_1.authorize)('MASTER', 'ADMIN', 'MANAGER'), (req, res) => usuarioController.delete(req, res));
exports.default = router;
//# sourceMappingURL=usuarioRoutes.js.map