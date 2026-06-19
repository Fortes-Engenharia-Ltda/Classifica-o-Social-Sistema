import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import {
  DEFAULT_MODULE_VISIBILITY,
  ModuleVisibilityByRole,
  RolePerfil,
  SYSTEM_MODULE_KEYS,
  SystemModuleKey,
} from '../config/systemModules';
import { config } from '../config';
import {
  DEFAULT_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_LABELS,
  EmailTemplate,
  EmailTemplateType,
  EmailTemplatesConfig,
} from '../config/emailTemplates';

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

export class SystemConfigService {
  private configPath = path.resolve(process.cwd(), 'data', 'system-config.json');
  private envPath = path.resolve(process.cwd(), '.env');
  private emailTemplatesPath = path.resolve(process.cwd(), 'data', 'email-templates.json');

  getModuleVisibility(): ModuleVisibilityByRole {
    return this.loadConfigFile();
  }

  getProfileKeys(): string[] {
    const visibility = this.loadConfigFile();
    return Object.keys(visibility);
  }

  getVisibleModulesByRole(role: string): Record<SystemModuleKey, boolean> {
    const visibility = this.loadConfigFile();
    const perfil = (role in visibility ? role : 'ANALYST') as RolePerfil;

    if (perfil === 'MANAGER') {
      return { ...DEFAULT_MODULE_VISIBILITY.MANAGER };
    }

    return visibility[perfil];
  }

  updateRoleModuleVisibility(role: string, payload: Partial<Record<SystemModuleKey, boolean>>): ModuleVisibilityByRole {
    const current = this.loadConfigFile();

    if (!current[role]) {
      current[role] = { ...DEFAULT_MODULE_VISIBILITY.ANALYST };
    }

    if (role === 'MANAGER') {
      current.MANAGER = { ...DEFAULT_MODULE_VISIBILITY.MANAGER };
      this.saveConfigFile(current);
      return current;
    }

    const mergedRoleConfig = { ...current[role] };

    for (const moduleKey of SYSTEM_MODULE_KEYS) {
      if (typeof payload[moduleKey] === 'boolean') {
        mergedRoleConfig[moduleKey] = payload[moduleKey] as boolean;
      }
    }

    current[role] = mergedRoleConfig;
    this.saveConfigFile(current);
    return current;
  }

  createCustomProfile(role: string, baseRole?: string): ModuleVisibilityByRole {
    const perfil = String(role || '').trim().toUpperCase();
    if (!perfil) {
      throw new Error('Informe o nome do perfil');
    }

    const current = this.loadConfigFile();
    if (current[perfil]) {
      throw new Error('Perfil já existe');
    }

    const base = String(baseRole || 'ANALYST').trim().toUpperCase();
    const baseConfig = current[base] || DEFAULT_MODULE_VISIBILITY.ANALYST;
    current[perfil] = { ...baseConfig };

    this.saveConfigFile(current);
    return current;
  }

  deleteCustomProfile(role: string): ModuleVisibilityByRole {
    const perfil = String(role || '').trim().toUpperCase();
    if (!perfil) {
      throw new Error('Perfil inválido');
    }

    const fixedProfiles = new Set<RolePerfil>(['MASTER', 'ADMIN', 'ANALYST', 'MANAGER']);
    if (fixedProfiles.has(perfil as RolePerfil)) {
      throw new Error('Perfis fixos não podem ser excluídos');
    }

    const current = this.loadConfigFile();
    if (!current[perfil]) {
      throw new Error('Perfil não encontrado');
    }

    delete current[perfil];
    this.saveConfigFile(current);
    return current;
  }

  getSqlServerSettings() {
    return {
      host: config.sqlServer.host,
      port: config.sqlServer.port,
      database: config.sqlServer.database,
      user: config.sqlServer.user,
      hasPassword: Boolean(config.sqlServer.password),
      encrypt: config.sqlServer.encrypt,
      trustServerCertificate: config.sqlServer.trustServerCertificate,
    };
  }

  updateSqlServerSettings(input: UpdateSqlServerInput) {
    const updatedValues: Record<string, string> = {
      SQLSERVER_HOST: String(input.host || ''),
      SQLSERVER_PORT: String(input.port || 1433),
      SQLSERVER_DATABASE: String(input.database || ''),
      SQLSERVER_USER: String(input.user || ''),
      SQLSERVER_ENCRYPT: String(input.encrypt),
      SQLSERVER_TRUST_SERVER_CERTIFICATE: String(input.trustServerCertificate),
    };

    if (typeof input.password === 'string' && input.password.length > 0) {
      updatedValues.SQLSERVER_PASSWORD = input.password;
    }

    this.updateEnvFile(updatedValues);

    process.env.SQLSERVER_HOST = updatedValues.SQLSERVER_HOST;
    process.env.SQLSERVER_PORT = updatedValues.SQLSERVER_PORT;
    process.env.SQLSERVER_DATABASE = updatedValues.SQLSERVER_DATABASE;
    process.env.SQLSERVER_USER = updatedValues.SQLSERVER_USER;
    process.env.SQLSERVER_ENCRYPT = updatedValues.SQLSERVER_ENCRYPT;
    process.env.SQLSERVER_TRUST_SERVER_CERTIFICATE = updatedValues.SQLSERVER_TRUST_SERVER_CERTIFICATE;
    if (updatedValues.SQLSERVER_PASSWORD) {
      process.env.SQLSERVER_PASSWORD = updatedValues.SQLSERVER_PASSWORD;
    }

    return this.getSqlServerSettings();
  }

  getSmtpSettings() {
    const cfg = config.email;
    return {
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      user: cfg.user,
      from: cfg.from,
      hasPassword: Boolean(cfg.pass),
    };
  }

  updateSmtpSettings(input: UpdateSmtpInput) {
    const updatedValues: Record<string, string> = {
      SMTP_HOST: String(input.host || ''),
      SMTP_PORT: String(input.port || 587),
      SMTP_SECURE: String(input.secure),
      SMTP_USER: String(input.user || ''),
      SMTP_FROM: String(input.from || ''),
    };

    if (typeof input.pass === 'string' && input.pass.length > 0) {
      updatedValues.SMTP_PASS = input.pass;
    }

    this.updateEnvFile(updatedValues);

    process.env.SMTP_HOST = updatedValues.SMTP_HOST;
    process.env.SMTP_PORT = updatedValues.SMTP_PORT;
    process.env.SMTP_SECURE = updatedValues.SMTP_SECURE;
    process.env.SMTP_USER = updatedValues.SMTP_USER;
    process.env.SMTP_FROM = updatedValues.SMTP_FROM;
    if (updatedValues.SMTP_PASS) {
      process.env.SMTP_PASS = updatedValues.SMTP_PASS;
    }

    config.email.host = updatedValues.SMTP_HOST || config.email.host;
    config.email.port = Number(updatedValues.SMTP_PORT || config.email.port || 587);
    config.email.secure = updatedValues.SMTP_SECURE === 'true';
    config.email.user = updatedValues.SMTP_USER || config.email.user;
    config.email.from = updatedValues.SMTP_FROM || config.email.from;
    if (updatedValues.SMTP_PASS) {
      config.email.pass = updatedValues.SMTP_PASS;
    }

    return this.getSmtpSettings();
  }

  async sendTestEmail(input: SendTestEmailInput): Promise<void> {
    const settings = this.getSmtpSettings();
    const smtpPass = config.email.pass;

    if (!settings.host || !settings.user || !smtpPass || !settings.from) {
      throw new Error('Configuração SMTP incompleta. Preencha host, usuário, senha e remetente.');
    }

    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.user,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: settings.from,
      to: input.to,
      subject: 'Teste de SMTP - Classificação Social',
      text: 'Seu SMTP foi configurado com sucesso no sistema Classificação Social.',
    });
  }

  getEmailTemplates(): { labels: Record<EmailTemplateType, string>; templates: EmailTemplatesConfig } {
    return {
      labels: EMAIL_TEMPLATE_LABELS,
      templates: this.loadEmailTemplates(),
    };
  }

  updateEmailTemplate(type: EmailTemplateType, payload: Partial<EmailTemplate>) {
    const current = this.loadEmailTemplates();
    const templateType = String(type || '').trim().toUpperCase() as EmailTemplateType;

    if (!current[templateType]) {
      throw new Error('Tipo de template de email invalido');
    }

    const subject = String(payload.subject || '').trim();
    const html = String(payload.html || '').trim();

    if (!subject) {
      throw new Error('Titulo do email e obrigatorio');
    }

    if (!html) {
      throw new Error('Conteudo do email e obrigatorio');
    }

    current[templateType] = {
      subject,
      html,
    };

    this.saveEmailTemplates(current);
    return this.getEmailTemplates();
  }

  restoreEmailTemplate(type: EmailTemplateType) {
    const current = this.loadEmailTemplates();
    const templateType = String(type || '').trim().toUpperCase() as EmailTemplateType;

    if (!current[templateType] || !DEFAULT_EMAIL_TEMPLATES[templateType]) {
      throw new Error('Tipo de template de email invalido');
    }

    current[templateType] = {
      ...DEFAULT_EMAIL_TEMPLATES[templateType],
    };

    this.saveEmailTemplates(current);
    return this.getEmailTemplates();
  }

  private loadConfigFile(): ModuleVisibilityByRole {
    try {
      if (!fs.existsSync(this.configPath)) {
        this.ensureDataDir();
        this.saveConfigFile(DEFAULT_MODULE_VISIBILITY);
        return JSON.parse(JSON.stringify(DEFAULT_MODULE_VISIBILITY)) as ModuleVisibilityByRole;
      }

      const raw = fs.readFileSync(this.configPath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<ModuleVisibilityByRole>;

      const merged: ModuleVisibilityByRole = {
        MASTER: this.mergeModuleDefaults('MASTER', parsed.MASTER),
        ADMIN: this.mergeModuleDefaults('ADMIN', parsed.ADMIN),
        ANALYST: this.mergeModuleDefaults('ANALYST', parsed.ANALYST),
        MANAGER: this.mergeModuleDefaults('MANAGER', parsed.MANAGER),
      };

      for (const [perfil, profileConfig] of Object.entries(parsed || {})) {
        const perfilNormalizado = String(perfil || '').trim().toUpperCase();
        if (!perfilNormalizado || merged[perfilNormalizado]) {
          continue;
        }

        merged[perfilNormalizado] = this.mergeModuleDefaults('ANALYST', profileConfig);
      }

      return merged;
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_MODULE_VISIBILITY)) as ModuleVisibilityByRole;
    }
  }

  private saveConfigFile(data: ModuleVisibilityByRole): void {
    this.ensureDataDir();
    fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2), 'utf8');
  }

  private ensureDataDir(): void {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private mergeModuleDefaults(
    role: RolePerfil,
    input: Partial<Record<SystemModuleKey, boolean>> | undefined,
  ): Record<SystemModuleKey, boolean> {
    const merged = { ...DEFAULT_MODULE_VISIBILITY[role] };

    if (!input) {
      return merged;
    }

    for (const moduleKey of SYSTEM_MODULE_KEYS) {
      if (typeof input[moduleKey] === 'boolean') {
        merged[moduleKey] = input[moduleKey] as boolean;
      }
    }

    return merged;
  }

  private updateEnvFile(values: Record<string, string>): void {
    let lines: string[] = [];

    if (fs.existsSync(this.envPath)) {
      lines = fs.readFileSync(this.envPath, 'utf8').split(/\r?\n/);
    }

    for (const [key, value] of Object.entries(values)) {
      const formattedValue = this.formatEnvValue(value);
      const newLine = `${key}=${formattedValue}`;
      const idx = lines.findIndex((line) => line.startsWith(`${key}=`));

      if (idx >= 0) {
        lines[idx] = newLine;
      } else {
        lines.push(newLine);
      }
    }

    fs.writeFileSync(this.envPath, `${lines.filter(Boolean).join('\n')}\n`, 'utf8');
  }

  private formatEnvValue(value: string): string {
    const escaped = value.replace(/\"/g, '\\"');
    return `"${escaped}"`;
  }

  private loadEmailTemplates(): EmailTemplatesConfig {
    try {
      if (!fs.existsSync(this.emailTemplatesPath)) {
        this.ensureDataDir();
        this.saveEmailTemplates(DEFAULT_EMAIL_TEMPLATES);
        return JSON.parse(JSON.stringify(DEFAULT_EMAIL_TEMPLATES)) as EmailTemplatesConfig;
      }

      const raw = fs.readFileSync(this.emailTemplatesPath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<EmailTemplatesConfig>;

      return {
        PASSWORD_RESET: {
          ...DEFAULT_EMAIL_TEMPLATES.PASSWORD_RESET,
          ...(parsed.PASSWORD_RESET || {}),
        },
        INSTITUICAO_REVISAO: {
          ...DEFAULT_EMAIL_TEMPLATES.INSTITUICAO_REVISAO,
          ...(parsed.INSTITUICAO_REVISAO || {}),
        },
        USER_WELCOME: {
          ...DEFAULT_EMAIL_TEMPLATES.USER_WELCOME,
          ...(parsed.USER_WELCOME || {}),
        },
      };
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_EMAIL_TEMPLATES)) as EmailTemplatesConfig;
    }
  }

  private saveEmailTemplates(data: EmailTemplatesConfig): void {
    this.ensureDataDir();
    fs.writeFileSync(this.emailTemplatesPath, JSON.stringify(data, null, 2), 'utf8');
  }
}
