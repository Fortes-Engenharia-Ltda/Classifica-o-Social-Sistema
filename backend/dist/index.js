"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config");
const logger_1 = __importDefault(require("./config/logger"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const logger_2 = require("./middlewares/logger");
const app = (0, express_1.default)();
// Middlewares de segurança
app.use((0, helmet_1.default)());
const allowedOrigins = [
    config_1.config.server.frontendUrl,
    'https://classificacaosocial-fortes.vercel.app',
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
// Middlewares de parser
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.resolve(config_1.config.uploads.dir)));
app.use('/api/uploads', express_1.default.static(path_1.default.resolve(config_1.config.uploads.dir)));
// Middleware de logs
app.use(logger_2.loggerMiddleware);
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});
// Rotas
app.use('/api', routes_1.default);
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Error handler (deve ser o último middleware)
app.use(errorHandler_1.errorHandler);
// Iniciar servidor
const port = config_1.config.server.port;
app.listen(port, () => {
    logger_1.default.info(`Servidor iniciado na porta ${port}`);
    logger_1.default.info(`Ambiente: ${config_1.config.server.env}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map