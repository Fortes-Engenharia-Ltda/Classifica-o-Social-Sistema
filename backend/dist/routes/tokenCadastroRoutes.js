"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TokenCadastroController_1 = require("../controllers/TokenCadastroController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const controller = new TokenCadastroController_1.TokenCadastroController();
// Protegido — ADMIN, ANALYST, MASTER e MANAGER
router.post('/gerar', auth_1.authMiddleware, (req, res) => controller.gerarToken(req, res));
// Público — a instituição usa para validar o link recebido
router.get('/validar', (req, res) => controller.validarToken(req, res));
exports.default = router;
//# sourceMappingURL=tokenCadastroRoutes.js.map