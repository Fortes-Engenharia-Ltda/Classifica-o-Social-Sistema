import { CreateUsuarioDTO, UpdateUsuarioDTO, UsuarioResponseDTO } from '../dtos/UsuarioDTO';
export declare class UsuarioRepository {
    create(data: CreateUsuarioDTO): Promise<UsuarioResponseDTO>;
    findById(id: number): Promise<UsuarioResponseDTO | null>;
    findByEmail(email: string): Promise<{
        perfil: string;
        nome: string;
        email: string;
        dataNascimento: Date | null;
        senha: string;
        status: boolean;
        codigoResetSenha: string | null;
        expiraResetSenha: Date | null;
        dataCriacao: Date;
        dataAtualizacao: Date;
        id: number;
    } | null>;
    findAll(page?: number, pageSize?: number): Promise<{
        usuarios: UsuarioResponseDTO[];
        total: number;
    }>;
    update(id: number, data: UpdateUsuarioDTO): Promise<UsuarioResponseDTO>;
    updateResetCode(email: string, codigo: string, expiraEm: Date): Promise<void>;
    updatePasswordByEmail(email: string, novaSenha: string): Promise<void>;
    updatePasswordById(id: number, novaSenha: string): Promise<void>;
    delete(id: number): Promise<void>;
    private formatResponse;
}
//# sourceMappingURL=UsuarioRepository.d.ts.map