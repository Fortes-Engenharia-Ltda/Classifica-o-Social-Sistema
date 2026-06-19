import 'express-async-errors';
import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import logger from './config/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { loggerMiddleware } from './middlewares/logger';

const app = express();

// Middlewares de segurança
app.use(helmet());
const allowedOrigins = [
  config.server.frontendUrl,
  'https://classificacaosocial-fortes.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Middlewares de parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(config.uploads.dir)));
app.use('/api/uploads', express.static(path.resolve(config.uploads.dir)));

// Middleware de logs
app.use(loggerMiddleware);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Rotas
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (deve ser o último middleware)
app.use(errorHandler);

// Iniciar servidor
const port = config.server.port;
app.listen(port, () => {
  logger.info(`Servidor iniciado na porta ${port}`);
  logger.info(`Ambiente: ${config.server.env}`);
});

export default app;
