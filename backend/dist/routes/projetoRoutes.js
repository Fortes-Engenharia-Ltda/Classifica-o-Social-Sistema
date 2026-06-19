"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const ProjetoController_1 = require("../controllers/ProjetoController");
const auth_1 = require("../middlewares/auth");
const config_1 = require("../config");
const router = (0, express_1.Router)();
const projetoController = new ProjetoController_1.ProjetoController();
// Diretório de upload de imagens de projetos
const imagemUploadDir = path_1.default.resolve(config_1.config.uploads.dir, 'projetos-imagens');
if (!fs_1.default.existsSync(imagemUploadDir)) {
    fs_1.default.mkdirSync(imagemUploadDir, { recursive: true });
}
const imagemStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, imagemUploadDir),
    filename: (_req, file, cb) => {
        const extensao = path_1.default.extname(file.originalname || '').toLowerCase();
        const nomeBase = path_1.default
            .basename(file.originalname || 'imagem', extensao)
            .replace(/[^a-zA-Z0-9-_]/g, '_')
            .slice(0, 80);
        cb(null, `${Date.now()}-${nomeBase || 'imagem'}${extensao}`);
    },
});
const uploadImagem = (0, multer_1.default)({
    storage: imagemStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error('Formato de imagem inválido. Envie JPG, PNG, WEBP ou GIF.'));
    },
});
// Todas as rotas protegidas
router.use(auth_1.authMiddleware);
router.post('/', (0, auth_1.authorize)('ADMIN'), (req, res) => projetoController.create(req, res));
router.post('/upload-imagem', (0, auth_1.authorize)('ADMIN'), uploadImagem.single('imagem'), (req, res) => projetoController.uploadImagem(req, res));
router.get('/', (req, res) => projetoController.findAll(req, res));
router.get('/:id', (req, res) => projetoController.findById(req, res));
router.get('/:id/instituicoes', (req, res) => projetoController.listarInstituicoesPorProjeto(req, res));
router.put('/:id', (0, auth_1.authorize)('ADMIN'), (req, res) => projetoController.update(req, res));
router.delete('/:id', (0, auth_1.authorize)('ADMIN'), (req, res) => projetoController.delete(req, res));
exports.default = router;
//# sourceMappingURL=projetoRoutes.js.map