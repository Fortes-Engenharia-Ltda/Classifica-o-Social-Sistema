import { CreateUsuarioDTO, UpdateUsuarioDTO, LoginDTO, TokenDTO, ForgotPasswordDTO, ResetPasswordDTO } from '../dtos/UsuarioDTO';
export declare class UsuarioService {
    private usuarioRepository;
    private emailService;
    private fallbackFilePath;
    create(data: CreateUsuarioDTO): Promise<any>;
    login(data: LoginDTO): Promise<TokenDTO>;
    findById(id: number): Promise<any>;
    findAll(page?: number, pageSize?: number): Promise<{
        usuarios: any[];
        total: number;
    }>;
    update(id: number, data: UpdateUsuarioDTO): Promise<any>;
    updateOwnProfile(id: number, _perfilAtual: string, data: {
        nome?: string;
        email?: string;
    }): Promise<any>;
    updateOwnPassword(id: number, novaSenha: string): Promise<void>;
    updatePasswordById(id: number, novaSenha: string): Promise<void>;
    delete(id: number): Promise<void>;
    forgotPassword(data: ForgotPasswordDTO): Promise<void>;
    resetPassword(data: ResetPasswordDTO): Promise<void>;
    private readLocalUsers;
    private writeLocalUsers;
    private localToResponse;
    private findByEmailLocal;
    private findByIdLocal;
    private findByIdLocalRaw;
    private findAllLocal;
    private createLocal;
    private updateLocal;
    private updatePasswordByIdLocal;
    private updateResetCodeLocal;
    private updatePasswordByEmailLocal;
    private deleteLocal;
    private upsertLocalDemoUser;
}
//# sourceMappingURL=UsuarioService.d.ts.map