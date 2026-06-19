"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usuarioRoutes_1 = __importDefault(require("./usuarioRoutes"));
const obraRoutes_1 = __importDefault(require("./obraRoutes"));
const projetoRoutes_1 = __importDefault(require("./projetoRoutes"));
const programaRoutes_1 = __importDefault(require("./programaRoutes"));
const classificacaoRoutes_1 = __importDefault(require("./classificacaoRoutes"));
const notaFiscalRoutes_1 = __importDefault(require("./notaFiscalRoutes"));
const dashboardRoutes_1 = __importDefault(require("./dashboardRoutes"));
const cadastroAdminRoutes_1 = __importDefault(require("./cadastroAdminRoutes"));
const instituicaoRoutes_1 = __importDefault(require("./instituicaoRoutes"));
const tokenCadastroRoutes_1 = __importDefault(require("./tokenCadastroRoutes"));
const systemConfigRoutes_1 = __importDefault(require("./systemConfigRoutes"));
const router = (0, express_1.Router)();
router.use('/usuarios', usuarioRoutes_1.default);
router.use('/obras', obraRoutes_1.default);
router.use('/projetos', projetoRoutes_1.default);
router.use('/programas', programaRoutes_1.default);
router.use('/classificacoes', classificacaoRoutes_1.default);
router.use('/notas-fiscais', notaFiscalRoutes_1.default);
router.use('/dashboard', dashboardRoutes_1.default);
// Rotas administrativas para cadastros
router.use('/admin-cadastros', cadastroAdminRoutes_1.default);
router.use('/', instituicaoRoutes_1.default);
// Token de acesso para Cadastro (Legado) de instituições
router.use('/token-cadastro', tokenCadastroRoutes_1.default);
// Configuração de sistema (perfil MASTER)
router.use('/sistema-config', systemConfigRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map