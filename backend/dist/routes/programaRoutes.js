"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProgramaController_1 = require("../controllers/ProgramaController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const programaController = new ProgramaController_1.ProgramaController();
// Todas as rotas protegidas
router.use(auth_1.authMiddleware);
router.post('/', (0, auth_1.authorize)('ADMIN'), (req, res) => programaController.create(req, res));
router.get('/', (req, res) => programaController.findAll(req, res));
router.get('/:id', (req, res) => programaController.findById(req, res));
router.put('/:id', (0, auth_1.authorize)('ADMIN'), (req, res) => programaController.update(req, res));
router.delete('/:id', (0, auth_1.authorize)('ADMIN'), (req, res) => programaController.delete(req, res));
exports.default = router;
//# sourceMappingURL=programaRoutes.js.map