import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// Hash de senha
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Verificar senha
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Gerar JWT
export const generateToken = (payload: { id: number; email: string; nome: string; perfil: string }): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
};

// Verificar JWT
export const verifyToken = (
  token: string,
): { id: number; email: string; nome: string; perfil: string } | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as {
      id: number;
      email: string;
      nome: string;
      perfil: string;
    };
  } catch {
    return null;
  }
};
