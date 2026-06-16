import { Router } from 'express';
import { CadastroAdminController } from '../controllers/CadastroAdminController';

const router = Router();
const controller = new CadastroAdminController();

// dOrçadoNãoOrçado
router.get('/orcado-nao-orcado', controller.listarOrcadoNaoOrcado);
router.post('/orcado-nao-orcado', controller.criarOrcadoNaoOrcado);
router.put('/orcado-nao-orcado/:id', controller.atualizarOrcadoNaoOrcado);

// dClassificaçõesSociais
router.get('/classificacoes-sociais', controller.listarClassificacoes);
router.post('/classificacoes-sociais', controller.criarClassificacao);

// Classificação de Contas
router.get('/classificacao-contas', controller.listarClassificacaoContas);
router.post('/classificacao-contas', controller.criarClassificacaoConta);
router.put('/classificacao-contas/:id', controller.atualizarClassificacaoConta);

// dProgramasSociais
router.get('/programas-sociais', controller.listarProgramas);
router.post('/programas-sociais', controller.criarPrograma);

export default router;
