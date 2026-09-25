import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { ProjetoController } from '../controllers/ProjetoController';
import { authMiddleware, authorize } from '../middlewares/auth';
import { config } from '../config';

const router = Router();
const projetoController = new ProjetoController();

// Diretório de upload de imagens de projetos
const imagemUploadDir = path.resolve(config.uploads.dir, 'projetos-imagens');
if (!fs.existsSync(imagemUploadDir)) {
  fs.mkdirSync(imagemUploadDir, { recursive: true });
}

const imagemStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, imagemUploadDir),
  filename: (_req, file, cb) => {
    const extensao = path.extname(file.originalname || '').toLowerCase();
    const nomeBase = path
      .basename(file.originalname || 'imagem', extensao)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 80);
    cb(null, `${Date.now()}-${nomeBase || 'imagem'}${extensao}`);
  },
});

const uploadImagem = multer({
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
router.use(authMiddleware);

router.post('/', authorize('ADMIN'), (req, res) => projetoController.create(req, res));
router.post('/upload-imagem', authorize('ADMIN'), uploadImagem.single('imagem'), (req, res) => projetoController.uploadImagem(req, res));
router.get('/', (req, res) => projetoController.findAll(req, res));
router.get('/:id', (req, res) => projetoController.findById(req, res));
router.get('/:id/instituicoes', (req, res) => projetoController.listarInstituicoesPorProjeto(req, res));
router.put('/:id', authorize('ADMIN'), (req, res) => projetoController.update(req, res));
router.delete('/:id', authorize('ADMIN'), (req, res) => projetoController.delete(req, res));

export default router;
