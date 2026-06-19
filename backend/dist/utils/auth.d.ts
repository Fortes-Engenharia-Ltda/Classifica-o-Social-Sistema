export declare const hashPassword: (password: string) => Promise<string>;
export declare const verifyPassword: (password: string, hash: string) => Promise<boolean>;
export declare const generateToken: (payload: {
    id: number;
    email: string;
    nome: string;
    perfil: string;
}) => string;
export declare const verifyToken: (token: string) => {
    id: number;
    email: string;
    nome: string;
    perfil: string;
} | null;
//# sourceMappingURL=auth.d.ts.map