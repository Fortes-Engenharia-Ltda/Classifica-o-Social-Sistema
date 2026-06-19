"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const InstituicaoController_1 = require("../controllers/InstituicaoController");
const auth_1 = require("../middlewares/auth");
const config_1 = require("../config");
const router = (0, express_1.Router)();
const controller = new InstituicaoController_1.InstituicaoController();
const termoUploadDir = path_1.default.resolve(config_1.config.uploads.dir, 'instituicoes-termos');
if (!fs_1.default.existsSync(termoUploadDir)) {
    fs_1.default.mkdirSync(termoUploadDir, { recursive: true });
}
const contratoUploadDir = path_1.default.resolve(config_1.config.uploads.dir, 'instituicoes-contratos');
if (!fs_1.default.existsSync(contratoUploadDir)) {
    fs_1.default.mkdirSync(contratoUploadDir, { recursive: true });
}
const termoStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, termoUploadDir),
    filename: (_req, file, cb) => {
        const extensao = path_1.default.extname(file.originalname || '').toLowerCase();
        const nomeBase = path_1.default
            .basename(file.originalname || 'termo', extensao)
            .replace(/[^a-zA-Z0-9-_]/g, '_')
            .slice(0, 80);
        cb(null, `${Date.now()}-${nomeBase || 'termo'}${extensao}`);
    },
});
const uploadTermo = (0, multer_1.default)({
    storage: termoStorage,
    limits: { fileSize: config_1.config.uploads.maxFileSize },
    fileFilter: (_req, file, cb) => {
        const tiposPermitidos = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error('Formato de termo inválido. Envie PDF, DOC ou DOCX.'));
    },
});
const contratoStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, contratoUploadDir),
    filename: (_req, file, cb) => {
        const extensao = path_1.default.extname(file.originalname || '').toLowerCase();
        const nomeBase = path_1.default
            .basename(file.originalname || 'contrato', extensao)
            .replace(/[^a-zA-Z0-9-_]/g, '_')
            .slice(0, 80);
        cb(null, `${Date.now()}-${nomeBase || 'contrato'}${extensao}`);
    },
});
const uploadContrato = (0, multer_1.default)({
    storage: contratoStorage,
    limits: { fileSize: config_1.config.uploads.maxFileSize },
    fileFilter: (_req, file, cb) => {
        const tiposPermitidos = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error('Formato de contrato inválido. Envie PDF, DOC ou DOCX.'));
    },
});
router.post('/instituicoes/completo', uploadTermo.single('termoAnexoFile'), (req, res) => controller.criarInstituicaoCompleta(req, res));
router.get('/instituicoes', (req, res) => controller.listarInstituicoes(req, res));
router.post('/instituicoes', uploadTermo.single('termoAnexoFile'), (req, res) => controller.criarInstituicao(req, res));
router.post('/instituicoes/responsavel-instituicao', (req, res) => controller.criarResponsavelInstituicao(req, res));
router.post('/instituicoes/responsavel-tecnico', (req, res) => controller.criarResponsavelTecnico(req, res));
router.get('/instituicoes/:id/contratos', auth_1.authMiddleware, (0, auth_1.authorize)('ADMIN', 'ANALYST', 'MANAGER', 'MASTER'), (req, res) => controller.listarContratosInstituicao(req, res));
router.post('/instituicoes/:id/contratos', auth_1.authMiddleware, (0, auth_1.authorize)('ADMIN', 'ANALYST', 'MANAGER'), uploadContrato.single('contratoFile'), (req, res) => controller.criarContratoInstituicao(req, res));
router.patch('/instituicoes/:id/contratos/:contratoId', auth_1.authMiddleware, (0, auth_1.authorize)('ADMIN'), uploadContrato.single('contratoFile'), (req, res) => controller.atualizarContratoInstituicao(req, res));
router.delete('/instituicoes/:id/contratos/:contratoId', auth_1.authMiddleware, (0, auth_1.authorize)('ADMIN'), (req, res) => controller.excluirContratoInstituicao(req, res));
// Revisão de cadastros
router.get('/instituicoes/revisao', auth_1.authMiddleware, (0, auth_1.authorize)('ADMIN', 'ANALYST', 'MASTER', 'MANAGER'), (req, res) => controller.listarParaRevisao(req, res));
router.patch('/instituicoes/:id/revisar', auth_1.authMiddleware, (0, auth_1.authorize)('ADMIN', 'ANALYST', 'MASTER', 'MANAGER'), (req, res) => controller.revisarInstituicao(req, res));
router.patch('/instituicoes/:id/reabrir', auth_1.authMiddleware, (0, auth_1.authorize)('ADMIN', 'ANALYST', 'MASTER', 'MANAGER'), (req, res) => controller.reabrirRevisaoInstituicao(req, res));
router.patch('/instituicoes/:id', auth_1.authMiddleware, (0, auth_1.authorize)('ADMIN', 'ANALYST', 'MANAGER'), (req, res) => controller.atualizarInstituicao(req, res));
router.delete('/instituicoes/:id', auth_1.authMiddleware, (0, auth_1.authorize)('ADMIN', 'MANAGER', 'MASTER'), (req, res) => controller.excluirInstituicao(req, res));
router.post('/instituicoes/:id/gerar-link-revisao', auth_1.authMiddleware, (0, auth_1.authorize)('ADMIN', 'ANALYST', 'MANAGER'), (req, res) => controller.gerarLinkRevisao(req, res));
exports.default = router;
//# sourceMappingURL=instituicaoRoutes.js.map