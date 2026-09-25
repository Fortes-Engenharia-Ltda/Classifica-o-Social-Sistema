import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { InstituicaoController } from '../controllers/InstituicaoController';
import { authMiddleware, authorize } from '../middlewares/auth';
import { config } from '../config';

const router = Router();
const controller = new InstituicaoController();

const termoUploadDir = path.resolve(config.uploads.dir, 'instituicoes-termos');
if (!fs.existsSync(termoUploadDir)) {
	fs.mkdirSync(termoUploadDir, { recursive: true });
}

const contratoUploadDir = path.resolve(config.uploads.dir, 'instituicoes-contratos');
if (!fs.existsSync(contratoUploadDir)) {
	fs.mkdirSync(contratoUploadDir, { recursive: true });
}

const termoStorage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, termoUploadDir),
	filename: (_req, file, cb) => {
		const extensao = path.extname(file.originalname || '').toLowerCase();
		const nomeBase = path
			.basename(file.originalname || 'termo', extensao)
			.replace(/[^a-zA-Z0-9-_]/g, '_')
			.slice(0, 80);
		cb(null, `${Date.now()}-${nomeBase || 'termo'}${extensao}`);
	},
});

const uploadTermo = multer({
	storage: termoStorage,
	limits: { fileSize: config.uploads.maxFileSize },
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

const contratoStorage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, contratoUploadDir),
	filename: (_req, file, cb) => {
		const extensao = path.extname(file.originalname || '').toLowerCase();
		const nomeBase = path
			.basename(file.originalname || 'contrato', extensao)
			.replace(/[^a-zA-Z0-9-_]/g, '_')
			.slice(0, 80);
		cb(null, `${Date.now()}-${nomeBase || 'contrato'}${extensao}`);
	},
});

const uploadContrato = multer({
	storage: contratoStorage,
	limits: { fileSize: config.uploads.maxFileSize },
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
router.get('/instituicoes/:id/contratos', authMiddleware, authorize('ADMIN', 'ANALYST', 'MANAGER', 'MASTER'), (req, res) => controller.listarContratosInstituicao(req as any, res));
router.post('/instituicoes/:id/contratos', authMiddleware, authorize('ADMIN', 'ANALYST', 'MANAGER'), uploadContrato.single('contratoFile'), (req, res) => controller.criarContratoInstituicao(req as any, res));
router.patch('/instituicoes/:id/contratos/:contratoId', authMiddleware, authorize('ADMIN'), uploadContrato.single('contratoFile'), (req, res) => controller.atualizarContratoInstituicao(req as any, res));
router.delete('/instituicoes/:id/contratos/:contratoId', authMiddleware, authorize('ADMIN'), (req, res) => controller.excluirContratoInstituicao(req as any, res));

// Revisão de cadastros
router.get('/instituicoes/revisao', authMiddleware, authorize('ADMIN', 'ANALYST', 'MASTER', 'MANAGER'), (req, res) => controller.listarParaRevisao(req, res));
router.patch('/instituicoes/:id/revisar', authMiddleware, authorize('ADMIN', 'ANALYST', 'MASTER', 'MANAGER'), (req, res) => controller.revisarInstituicao(req as any, res));
router.patch('/instituicoes/:id/reabrir', authMiddleware, authorize('ADMIN', 'ANALYST', 'MASTER', 'MANAGER'), (req, res) => controller.reabrirRevisaoInstituicao(req as any, res));
router.patch('/instituicoes/:id', authMiddleware, authorize('ADMIN', 'ANALYST', 'MANAGER'), (req, res) => controller.atualizarInstituicao(req as any, res));
router.delete('/instituicoes/:id', authMiddleware, authorize('ADMIN', 'MANAGER', 'MASTER'), (req, res) => controller.excluirInstituicao(req as any, res));
router.post('/instituicoes/:id/gerar-link-revisao', authMiddleware, authorize('ADMIN', 'ANALYST', 'MANAGER'), (req, res) => controller.gerarLinkRevisao(req as any, res));

export default router;
