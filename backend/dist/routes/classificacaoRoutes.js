"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ClassificacaoController_1 = require("../controllers/ClassificacaoController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const classificacaoController = new ClassificacaoController_1.ClassificacaoController();
// Todas as rotas protegidas
router.use(auth_1.authMiddleware);
router.post('/', (0, auth_1.authorize)('ADMIN'), (req, res) => classificacaoController.create(req, res));
router.get('/', (req, res) => classificacaoController.findAll(req, res));
router.get('/:id', (req, res) => classificacaoController.findById(req, res));
router.put('/:id', (0, auth_1.authorize)('ADMIN'), (req, res) => classificacaoController.update(req, res));
router.delete('/:id', (0, auth_1.authorize)('ADMIN'), (req, res) => classificacaoController.delete(req, res));
exports.default = router;
//# sourceMappingURL=classificacaoRoutes.js.map