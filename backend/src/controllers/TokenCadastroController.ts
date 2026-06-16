import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../config/database';
import { runWithPrismaFallback } from '../utils/prismaCircuitBreaker';

interface TokenEntry {
  expiry: Date;
  criadoPor: string;
  used?: boolean;
  usedAt?: Date;
  instituicaoId?: number;
}

// In-memory store — sobrevive enquanto o processo estiver rodando.
// Em produção, persistir na tabela token_cadastro_instituicao.
const tokenStore = new Map<string, TokenEntry>();
const fallbackFilePath = path.resolve(process.cwd(), 'data', 'instituicoes-cadastros-fallback.json');

type TokenExpiryUnit = 'MINUTOS' | 'HORAS' | 'DIAS';

interface TokenExpiryRequest {
  validadeValor?: unknown;
  validadeUnidade?: unknown;
  validadeHoras?: unknown;
}

interface ResolvedTokenExpiry {
  expiry: Date;
  validadeValor: number;
  validadeUnidade: TokenExpiryUnit;
  validadeEmMinutos: number;
}

const DEFAULT_EXPIRY_VALUE = 72;
const DEFAULT_EXPIRY_UNIT: TokenExpiryUnit = 'HORAS';
const TOKEN_EXPIRY_LIMITS: Record<TokenExpiryUnit, { min: number; max: number }> = {
  MINUTOS: { min: 1, max: 43200 },
  HORAS: { min: 1, max: 720 },
  DIAS: { min: 1, max: 30 },
};
const TOKEN_EXPIRY_MULTIPLIERS: Record<TokenExpiryUnit, number> = {
  MINUTOS: 1,
  HORAS: 60,
  DIAS: 1440,
};

type TokenValidationResult =
  | { ok: true; entry: TokenEntry }
  | { ok: false; status: 404 | 409 | 410; message: string };

export function validarTokenCadastro(token: string): TokenValidationResult {
  limparExpirados();

  const entry = tokenStore.get(token);

  if (!entry) {
    return { ok: false, status: 404, message: 'Token inválido ou não encontrado' };
  }

  if (entry.used) {
    return { ok: false, status: 409, message: 'Token já utilizado' };
  }

  if (new Date() > entry.expiry) {
    tokenStore.delete(token);
    return { ok: false, status: 410, message: 'Token expirado' };
  }

  return { ok: true, entry };
}

export function consumirTokenCadastro(token: string): boolean {
  const resultado = validarTokenCadastro(token);

  if (!resultado.ok) {
    return false;
  }

  const entry = tokenStore.get(token);
  if (!entry) {
    return false;
  }

  entry.used = true;
  entry.usedAt = new Date();
  tokenStore.set(token, entry);
  return true;
}

function limparExpirados(): void {
  const agora = new Date();
  for (const [token, entry] of tokenStore) {
    if (agora > entry.expiry) {
      tokenStore.delete(token);
    }
  }
}

function normalizeTokenExpiryUnit(value: unknown): TokenExpiryUnit {
  const normalized = String(value ?? '').trim().toUpperCase();

  if (normalized === 'MINUTO' || normalized === 'MINUTOS') {
    return 'MINUTOS';
  }

  if (normalized === 'DIA' || normalized === 'DIAS') {
    return 'DIAS';
  }

  return 'HORAS';
}

function clampTokenExpiryValue(value: number, unit: TokenExpiryUnit): number {
  const { min, max } = TOKEN_EXPIRY_LIMITS[unit];
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function resolveTokenExpiry(request: TokenExpiryRequest = {}): ResolvedTokenExpiry {
  let validadeUnidade = DEFAULT_EXPIRY_UNIT;
  let validadeValor = DEFAULT_EXPIRY_VALUE;

  const requestedValue = Number(request.validadeValor);
  if (Number.isFinite(requestedValue)) {
    validadeUnidade = normalizeTokenExpiryUnit(request.validadeUnidade);
    validadeValor = clampTokenExpiryValue(requestedValue, validadeUnidade);
  } else {
    const requestedHours = Number(request.validadeHoras);
    if (Number.isFinite(requestedHours)) {
      validadeUnidade = 'HORAS';
      validadeValor = clampTokenExpiryValue(requestedHours, validadeUnidade);
    }
  }

  const validadeEmMinutos = validadeValor * TOKEN_EXPIRY_MULTIPLIERS[validadeUnidade];
  const expiry = new Date(Date.now() + validadeEmMinutos * 60 * 1000);

  return {
    expiry,
    validadeValor,
    validadeUnidade,
    validadeEmMinutos,
  };
}

export function gerarTokenParaInstituicao(
  instituicaoId: number,
  criadoPor: string,
  expiryRequest: TokenExpiryRequest = {},
): { token: string; expiry: Date; validadeValor: number; validadeUnidade: TokenExpiryUnit; validadeEmMinutos: number } {
  limparExpirados();
  const token = crypto.randomUUID();
  const expiryConfig = resolveTokenExpiry(expiryRequest);
  const { expiry } = expiryConfig;
  tokenStore.set(token, { expiry, criadoPor, instituicaoId });
  return { token, ...expiryConfig };
}

function getFallbackPublicId(item: any): number {
  const fallbackPublicId = Number(item?.fallbackPublicId);
  if (Number.isFinite(fallbackPublicId) && fallbackPublicId < 0) {
    return fallbackPublicId;
  }

  const id = Number(item?.id);
  if (Number.isFinite(id) && id < 0) {
    return id;
  }

  const safeId = Number.isFinite(id) && id !== 0 ? Math.abs(id) : Date.now();
  return -1000000 - safeId;
}

function normalizeFallbackInstituicao(item: any): any {
  const responsavelInstituicao = item?.responsavelInstituicao ?? item?.responsaveis?.[0] ?? null;
  const responsavelTecnico = item?.responsavelTecnico ?? item?.responsaveisTecnicos?.[0] ?? null;
  const fallbackPublicId = getFallbackPublicId(item);

  return {
    ...item,
    id: fallbackPublicId,
    fallback: true,
    fallbackPublicId,
    responsavel: item?.responsavel ?? responsavelInstituicao?.representante ?? null,
    responsaveis: responsavelInstituicao ? [responsavelInstituicao] : [],
    responsaveisTecnicos: responsavelTecnico ? [responsavelTecnico] : [],
  };
}

async function readInstituicoesFallback(): Promise<any[]> {
  try {
    const raw = await fs.readFile(fallbackFilePath, 'utf8');
    return JSON.parse(raw) as any[];
  } catch {
    return [];
  }
}

async function findInstituicaoFallback(requestId: number): Promise<any | null> {
  const itens = await readInstituicoesFallback();
  const item = itens.find((candidate) => (
    getFallbackPublicId(candidate) === requestId || Number(candidate?.instituicaoIdOrigem) === requestId
  ));

  return item ? normalizeFallbackInstituicao(item) : null;
}

export class TokenCadastroController {
  gerarToken(req: AuthenticatedRequest, res: Response): void {
    try {
      const perfil = req.user?.perfil ?? '';

      if (perfil !== 'ADMIN' && perfil !== 'ANALYST' && perfil !== 'MASTER' && perfil !== 'MANAGER') {
        res.status(403).json(errorResponse('Sem permissão para gerar tokens de acesso'));
        return;
      }

      limparExpirados();

      const expiryConfig = resolveTokenExpiry(req.body ?? {});

      const token = crypto.randomUUID();
      const { expiry } = expiryConfig;

      tokenStore.set(token, { expiry, criadoPor: req.user?.email ?? 'desconhecido' });

      res.status(201).json(
        successResponse('Token gerado com sucesso', {
          token,
          expiry,
          expiresAt: expiry.toISOString(),
          validadeHoras: Number((expiryConfig.validadeEmMinutos / 60).toFixed(2)),
          validadeValor: expiryConfig.validadeValor,
          validadeUnidade: expiryConfig.validadeUnidade,
          validadeEmMinutos: expiryConfig.validadeEmMinutos,
          validoAte: expiry.toLocaleString('pt-BR'),
        }),
      );
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  validarToken(req: Request, res: Response): void {
    (async () => {
      try {
        const token = String(req.query.token ?? '').trim();

        if (!token) {
          res.status(400).json(errorResponse('Token não informado'));
          return;
        }

        const validacao = validarTokenCadastro(token);
        if (!validacao.ok) {
          res.status(validacao.status).json(errorResponse(validacao.message));
          return;
        }

        const responseData: Record<string, unknown> = {
          token,
          validoAte: validacao.entry.expiry.toLocaleString('pt-BR'),
          expiresAt: validacao.entry.expiry.toISOString(),
          segundosRestantes: Math.max(
            0,
            Math.floor((validacao.entry.expiry.getTime() - Date.now()) / 1000),
          ),
        };

        if (validacao.entry.instituicaoId) {
          const instituicaoDb = validacao.entry.instituicaoId > 0
            ? await runWithPrismaFallback(
                () => prisma.instituicaoSocial.findUnique({
                  where: { id: validacao.entry.instituicaoId },
                  include: {
                    responsaveis: { take: 1 },
                    responsaveisTecnicos: { take: 1 },
                  },
                }),
                async () => null,
              )
            : null;
          const instituicao = instituicaoDb ?? await findInstituicaoFallback(validacao.entry.instituicaoId);
          if (instituicao) {
            responseData.instituicao = instituicao;
          }
        }

        res.status(200).json(successResponse('Token válido', responseData));
      } catch (error: any) {
        res.status(500).json(errorResponse(error.message));
      }
    })();
  }
}
