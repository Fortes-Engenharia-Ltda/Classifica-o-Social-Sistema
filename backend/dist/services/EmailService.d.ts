export declare class EmailService {
    private emailTemplatesPath;
    private getRuntimeEmailConfig;
    private hasSmtpConfig;
    private loadEmailTemplates;
    private renderTemplate;
    private stripHtml;
    enviarCodigoRedefinicao(email: string, nome: string, codigo: string): Promise<void>;
    enviarNotificacaoStatusInstituicao(emailResponsavel: string, nomeResponsavel: string, nomeInstituicao: string, status: 'APROVADO' | 'REJEITADO' | 'AJUSTES_SOLICITADOS' | 'PENDENTE', motivo?: string, linkAjustes?: string): Promise<void>;
    enviarBoasVindasUsuario(email: string, nome: string, senhaInicial: string): Promise<void>;
}
//# sourceMappingURL=EmailService.d.ts.map