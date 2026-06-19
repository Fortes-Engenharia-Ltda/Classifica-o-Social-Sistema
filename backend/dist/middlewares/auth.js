"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const logger_1 = __importDefault(require("../config/logger"));
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ message: 'Token não fornecido' });
            return;
        }
        const [, token] = authHeader.split(' ');
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        logger_1.default.error(`Auth middleware error: ${error}`);
        res.status(401).json({ message: 'Token inválido ou expirado' });
    }
};
exports.authMiddleware = authMiddleware;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Usuário não autenticado' });
            return;
        }
        if (req.user.perfil === 'MASTER') {
            next();
            return;
        }
        if (!roles.includes(req.user.perfil)) {
            res.status(403).json({ message: 'Acesso negado' });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map