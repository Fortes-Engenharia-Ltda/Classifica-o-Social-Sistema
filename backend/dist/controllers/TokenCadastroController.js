"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenCadastroController = void 0;
exports.validarTokenCadastro = validarTokenCadastro;
exports.consumirTokenCadastro = consumirTokenCadastro;
exports.resolveTokenExpiry = resolveTokenExpiry;
exports.gerarTokenParaInstituicao = gerarTokenParaInstituicao;
const crypto_1 = __importDefault(require("crypto"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const response_1 = require("../utils/response");
const database_1 = __importDefault(require("../config/database"));
const prismaCircuitBreaker_1 = require("../utils/prismaCircuitBreaker");
// In-memory store — sobrevive enquanto o processo estiver rodando.
// Em produção, persistir na tabela token_cadastro_instituicao.
const tokenStore = new Map();
const fallbackFilePath = path_1.default.resolve(process.cwd(), 'data', 'instituicoes-cadastros-fallback.json');
const DEFAULT_EXPIRY_VALUE = 72;
const DEFAULT_EXPIRY_UNIT = 'HORAS';
const TOKEN_EXPIRY_LIMITS = {
    MINUTOS: { min: 1, max: 43200 },
    HORAS: { min: 1, max: 720 },
    DIAS: { min: 1, max: 30 },
};
const TOKEN_EXPIRY_MULTIPLIERS = {
    MINUTOS: 1,
    HORAS: 60,
    DIAS: 1440,
};
function validarTokenCadastro(token) {
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
function consumirTokenCadastro(token) {
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
function limparExpirados() {
    const agora = new Date();
    for (const [token, entry] of tokenStore) {
        if (agora > entry.expiry) {
            tokenStore.delete(token);
        }
    }
}
function normalizeTokenExpiryUnit(value) {
    const normalized = String(value ?? '').trim().toUpperCase();
    if (normalized === 'MINUTO' || normalized === 'MINUTOS') {
        return 'MINUTOS';
    }
    if (normalized === 'DIA' || normalized === 'DIAS') {
        return 'DIAS';
    }
    return 'HORAS';
}
function clampTokenExpiryValue(value, unit) {
    const { min, max } = TOKEN_EXPIRY_LIMITS[unit];
    return Math.min(max, Math.max(min, Math.round(value)));
}
function resolveTokenExpiry(request = {}) {
    let validadeUnidade = DEFAULT_EXPIRY_UNIT;
    let validadeValor = DEFAULT_EXPIRY_VALUE;
    const requestedValue = Number(request.validadeValor);
    if (Number.isFinite(requestedValue)) {
        validadeUnidade = normalizeTokenExpiryUnit(request.validadeUnidade);
        validadeValor = clampTokenExpiryValue(requestedValue, validadeUnidade);
    }
    else {
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
function gerarTokenParaInstituicao(instituicaoId, criadoPor, expiryRequest = {}) {
    limparExpirados();
    const token = crypto_1.default.randomUUID();
    const expiryConfig = resolveTokenExpiry(expiryRequest);
    const { expiry } = expiryConfig;
    tokenStore.set(token, { expiry, criadoPor, instituicaoId });
    return { token, ...expiryConfig };
}
function getFallbackPublicId(item) {
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
function normalizeFallbackInstituicao(item) {
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
async function readInstituicoesFallback() {
    try {
        const raw = await promises_1.default.readFile(fallbackFilePath, 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return [];
    }
}
async function findInstituicaoFallback(requestId) {
    const itens = await readInstituicoesFallback();
    const item = itens.find((candidate) => (getFallbackPublicId(candidate) === requestId || Number(candidate?.instituicaoIdOrigem) === requestId));
    return item ? normalizeFallbackInstituicao(item) : null;
}
class TokenCadastroController {
    gerarToken(req, res) {
        try {
            const perfil = req.user?.perfil ?? '';
            if (perfil !== 'ADMIN' && perfil !== 'ANALYST' && perfil !== 'MASTER' && perfil !== 'MANAGER') {
                res.status(403).json((0, response_1.errorResponse)('Sem permissão para gerar tokens de acesso'));
                return;
            }
            limparExpirados();
            const expiryConfig = resolveTokenExpiry(req.body ?? {});
            const token = crypto_1.default.randomUUID();
            const { expiry } = expiryConfig;
            tokenStore.set(token, { expiry, criadoPor: req.user?.email ?? 'desconhecido' });
            res.status(201).json((0, response_1.successResponse)('Token gerado com sucesso', {
                token,
                expiry,
                expiresAt: expiry.toISOString(),
                validadeHoras: Number((expiryConfig.validadeEmMinutos / 60).toFixed(2)),
                validadeValor: expiryConfig.validadeValor,
                validadeUnidade: expiryConfig.validadeUnidade,
                validadeEmMinutos: expiryConfig.validadeEmMinutos,
                validoAte: expiry.toLocaleString('pt-BR'),
            }));
        }
        catch (error) {
            res.status(500).json((0, response_1.errorResponse)(error.message));
        }
    }
    validarToken(req, res) {
        (async () => {
            try {
                const token = String(req.query.token ?? '').trim();
                if (!token) {
                    res.status(400).json((0, response_1.errorResponse)('Token não informado'));
                    return;
                }
                const validacao = validarTokenCadastro(token);
                if (!validacao.ok) {
                    res.status(validacao.status).json((0, response_1.errorResponse)(validacao.message));
                    return;
                }
                const responseData = {
                    token,
                    validoAte: validacao.entry.expiry.toLocaleString('pt-BR'),
                    expiresAt: validacao.entry.expiry.toISOString(),
                    segundosRestantes: Math.max(0, Math.floor((validacao.entry.expiry.getTime() - Date.now()) / 1000)),
                };
                if (validacao.entry.instituicaoId) {
                    const instituicaoDb = validacao.entry.instituicaoId > 0
                        ? await (0, prismaCircuitBreaker_1.runWithPrismaFallback)(() => database_1.default.instituicaoSocial.findUnique({
                            where: { id: validacao.entry.instituicaoId },
                            include: {
                                responsaveis: { take: 1 },
                                responsaveisTecnicos: { take: 1 },
                            },
                        }), async () => null)
                        : null;
                    const instituicao = instituicaoDb ?? await findInstituicaoFallback(validacao.entry.instituicaoId);
                    if (instituicao) {
                        responseData.instituicao = instituicao;
                    }
                }
                res.status(200).json((0, response_1.successResponse)('Token válido', responseData));
            }
            catch (error) {
                res.status(500).json((0, response_1.errorResponse)(error.message));
            }
        })();
    }
}
exports.TokenCadastroController = TokenCadastroController;
//# sourceMappingURL=TokenCadastroController.js.map