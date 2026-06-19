import { ModuleVisibilityByRole, SystemModuleKey } from '../config/systemModules';
import { EmailTemplate, EmailTemplateType, EmailTemplatesConfig } from '../config/emailTemplates';
interface UpdateSqlServerInput {
    host: string;
    port: number;
    database: string;
    user: string;
    password?: string;
    encrypt: boolean;
    trustServerCertificate: boolean;
}
interface UpdateSmtpInput {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass?: string;
    from: string;
}
interface SendTestEmailInput {
    to: string;
}
export declare class SystemConfigService {
    private configPath;
    private envPath;
    private emailTemplatesPath;
    getModuleVisibility(): ModuleVisibilityByRole;
    getProfileKeys(): string[];
    getVisibleModulesByRole(role: string): Record<SystemModuleKey, boolean>;
    updateRoleModuleVisibility(role: string, payload: Partial<Record<SystemModuleKey, boolean>>): ModuleVisibilityByRole;
    createCustomProfile(role: string, baseRole?: string): ModuleVisibilityByRole;
    deleteCustomProfile(role: string): ModuleVisibilityByRole;
    getSqlServerSettings(): {
        host: string;
        port: number;
        database: string;
        user: string;
        hasPassword: boolean;
        encrypt: boolean;
        trustServerCertificate: boolean;
    };
    updateSqlServerSettings(input: UpdateSqlServerInput): {
        host: string;
        port: number;
        database: string;
        user: string;
        hasPassword: boolean;
        encrypt: boolean;
        trustServerCertificate: boolean;
    };
    getSmtpSettings(): {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        from: string;
        hasPassword: boolean;
    };
    updateSmtpSettings(input: UpdateSmtpInput): {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        from: string;
        hasPassword: boolean;
    };
    sendTestEmail(input: SendTestEmailInput): Promise<void>;
    getEmailTemplates(): {
        labels: Record<EmailTemplateType, string>;
        templates: EmailTemplatesConfig;
    };
    updateEmailTemplate(type: EmailTemplateType, payload: Partial<EmailTemplate>): {
        labels: Record<EmailTemplateType, string>;
        templates: EmailTemplatesConfig;
    };
    restoreEmailTemplate(type: EmailTemplateType): {
        labels: Record<EmailTemplateType, string>;
        templates: EmailTemplatesConfig;
    };
    private loadConfigFile;
    private saveConfigFile;
    private ensureDataDir;
    private mergeModuleDefaults;
    private updateEnvFile;
    private formatEnvValue;
    private loadEmailTemplates;
    private saveEmailTemplates;
}
export {};
//# sourceMappingURL=SystemConfigService.d.ts.map