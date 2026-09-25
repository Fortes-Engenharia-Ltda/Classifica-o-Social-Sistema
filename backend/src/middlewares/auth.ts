import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import logger from '../config/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    nome: string;
    perfil: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ message: 'Token não fornecido' });
      return;
    }

    const [, token] = authHeader.split(' ');

    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: number;
      email: string;
      nome: string;
      perfil: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error}`);
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
