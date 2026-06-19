import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
interface TokenEntry {
    expiry: Date;
    criadoPor: string;
    used?: boolean;
    usedAt?: Date;
    instituicaoId?: number;
}
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
type TokenValidationResult = {
    ok: true;
    entry: TokenEntry;
} | {
    ok: false;
    status: 404 | 409 | 410;
    message: string;
};
export declare function validarTokenCadastro(token: string): TokenValidationResult;
export declare function consumirTokenCadastro(token: string): boolean;
export declare function resolveTokenExpiry(request?: TokenExpiryRequest): ResolvedTokenExpiry;
export declare function gerarTokenParaInstituicao(instituicaoId: number, criadoPor: string, expiryRequest?: TokenExpiryRequest): {
    token: string;
    expiry: Date;
    validadeValor: number;
    validadeUnidade: TokenExpiryUnit;
    validadeEmMinutos: number;
};
export declare class TokenCadastroController {
    gerarToken(req: AuthenticatedRequest, res: Response): void;
    validarToken(req: Request, res: Response): void;
}
export {};
//# sourceMappingURL=TokenCadastroController.d.ts.map