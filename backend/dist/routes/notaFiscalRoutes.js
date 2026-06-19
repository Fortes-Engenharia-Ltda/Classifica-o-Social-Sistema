"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const NotaFiscalController_1 = require("../controllers/NotaFiscalController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const notaFiscalController = new NotaFiscalController_1.NotaFiscalController();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Todas as rotas protegidas
router.use(auth_1.authMiddleware);
// Classificação
router.post('/lote/classificar', (req, res) => notaFiscalController.classificarLote(req, res));
router.post('/:id/classificar', (req, res) => notaFiscalController.classificar(req, res));
router.delete('/lote', (0, auth_1.authorize)('MASTER'), (req, res) => notaFiscalController.deleteLote(req, res));
router.delete('/all', (0, auth_1.authorize)('MASTER'), (req, res) => notaFiscalController.deleteAll(req, res));
router.get('/template-excel', (0, auth_1.authorize)('ADMIN', 'ANALYST', 'MANAGER', 'MASTER'), (req, res) => notaFiscalController.baixarTemplateExcel(req, res));
router.get('/exportar-excel', (0, auth_1.authorize)('ADMIN', 'ANALYST', 'MANAGER', 'MASTER'), (req, res) => notaFiscalController.exportarExcel(req, res));
router.post('/importar-excel', (0, auth_1.authorize)('ADMIN', 'ANALYST'), upload.single('file'), (req, res) => notaFiscalController.importarExcel(req, res));
// CRUD
router.post('/', (0, auth_1.authorize)('ADMIN', 'ANALYST'), (req, res) => notaFiscalController.create(req, res));
router.get('/', (req, res) => notaFiscalController.findAll(req, res));
router.get('/:id', (req, res) => notaFiscalController.findById(req, res));
router.put('/:id', (0, auth_1.authorize)('ADMIN', 'ANALYST'), (req, res) => notaFiscalController.update(req, res));
router.delete('/:id', (0, auth_1.authorize)('ADMIN'), (req, res) => notaFiscalController.delete(req, res));
exports.default = router;
//# sourceMappingURL=notaFiscalRoutes.js.map