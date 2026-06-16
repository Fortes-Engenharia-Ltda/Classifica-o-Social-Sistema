import { Router } from 'express';

import usuarioRoutes from './usuarioRoutes';
import obraRoutes from './obraRoutes';
import projetoRoutes from './projetoRoutes';
import programaRoutes from './programaRoutes';
import classificacaoRoutes from './classificacaoRoutes';
import notaFiscalRoutes from './notaFiscalRoutes';
import dashboardRoutes from './dashboardRoutes';
import cadastroAdminRoutes from './cadastroAdminRoutes';
import instituicaoRoutes from './instituicaoRoutes';
import tokenCadastroRoutes from './tokenCadastroRoutes';
import systemConfigRoutes from './systemConfigRoutes';

const router = Router();

router.use('/usuarios', usuarioRoutes);
router.use('/obras', obraRoutes);
router.use('/projetos', projetoRoutes);
router.use('/programas', programaRoutes);
router.use('/classificacoes', classificacaoRoutes);
router.use('/notas-fiscais', notaFiscalRoutes);
router.use('/dashboard', dashboardRoutes);

// Rotas administrativas para cadastros
router.use('/admin-cadastros', cadastroAdminRoutes);
router.use('/', instituicaoRoutes);

// Token de acesso para Cadastro (Legado) de instituições
router.use('/token-cadastro', tokenCadastroRoutes);

// Configuração de sistema (perfil MASTER)
router.use('/sistema-config', systemConfigRoutes);

export default router;
