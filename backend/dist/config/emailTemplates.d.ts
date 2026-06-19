export type EmailTemplateType = 'PASSWORD_RESET' | 'INSTITUICAO_REVISAO' | 'USER_WELCOME';
export interface EmailTemplate {
    subject: string;
    html: string;
}
export type EmailTemplatesConfig = Record<EmailTemplateType, EmailTemplate>;
export declare const DEFAULT_EMAIL_TEMPLATES: EmailTemplatesConfig;
export declare const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateType, string>;
//# sourceMappingURL=emailTemplates.d.ts.map