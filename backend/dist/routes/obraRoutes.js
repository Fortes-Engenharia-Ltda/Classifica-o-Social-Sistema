"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ObraController_1 = require("../controllers/ObraController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const obraController = new ObraController_1.ObraController();
// Todas as rotas protegidas
router.use(auth_1.authMiddleware);
router.post('/sync/dprojetos', (0, auth_1.authorize)('ADMIN'), (req, res) => obraController.syncDProjetos(req, res));
router.post('/', (0, auth_1.authorize)('ADMIN'), (req, res) => obraController.create(req, res));
router.get('/', (req, res) => obraController.findAll(req, res));
router.get('/:id', (req, res) => obraController.findById(req, res));
router.put('/:id', (0, auth_1.authorize)('ADMIN'), (req, res) => obraController.update(req, res));
router.delete('/:id', (0, auth_1.authorize)('ADMIN'), (req, res) => obraController.delete(req, res));
exports.default = router;
//# sourceMappingURL=obraRoutes.js.map