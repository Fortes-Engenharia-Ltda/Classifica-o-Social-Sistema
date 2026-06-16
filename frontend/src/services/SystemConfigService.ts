import api from './api';
import { RolePerfil, SystemModuleKey } from '@/config/moduleVisibility';

export interface SqlServerSettings {
  host: string;
  port: number;
  database: string;
  user: string;
  hasPassword: boolean;
  encrypt: boolean;
  trustServerCertificate: boolean;
}

export interface SqlServerUpdatePayload {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  hasPassword: boolean;
}

export interface SmtpUpdatePayload {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  pass?: string;
}

export type EmailTemplateType = 'PASSWORD_RESET' | 'INSTITUICAO_REVISAO' | 'USER_WELCOME';

export interface EmailTemplateItem {
  subject: string;
  html: string;
}

export interface EmailTemplatesResponse {
  labels: Record<EmailTemplateType, string>;
  templates: Record<EmailTemplateType, EmailTemplateItem>;
}

export class SystemConfigService {
  static async getVisibleModulesForCurrentUser(): Promise<Record<SystemModuleKey, boolean>> {
    const response = await api.get('/sistema-config/modulos/me');
    return response.data?.data || {};
  }

  static async getModuleVisibilityConfig(): Promise<Record<string, Record<SystemModuleKey, boolean>>> {
    const response = await api.get('/sistema-config/modulos');
    return response.data?.data || {};
  }

  static async getModuleProfiles(): Promise<string[]> {
    const response = await api.get('/sistema-config/perfis');
    return response.data?.data || [];
  }

  static async updateModuleVisibilityConfig(
    perfil: string,
    data: Partial<Record<SystemModuleKey, boolean>>,
  ): Promise<any> {
    const response = await api.put(`/sistema-config/modulos/${perfil}`, data);
    return response.data;
  }

  static async createModuleProfile(perfil: string, basePerfil?: string): Promise<any> {
    const response = await api.post('/sistema-config/modulos/perfis', { perfil, basePerfil });
    return response.data;
  }

  static async deleteModuleProfile(perfil: string): Promise<any> {
    const response = await api.delete(`/sistema-config/modulos/perfis/${encodeURIComponent(perfil)}`);
    return response.data;
  }

  static async getSqlServerSettings(): Promise<SqlServerSettings> {
    const response = await api.get('/sistema-config/sqlserver');
    return response.data?.data;
  }

  static async updateSqlServerSettings(data: SqlServerUpdatePayload): Promise<any> {
    const response = await api.put('/sistema-config/sqlserver', data);
    return response.data;
  }

  static async getSmtpSettings(): Promise<SmtpSettings> {
    const response = await api.get('/sistema-config/smtp');
    return response.data?.data;
  }

  static async updateSmtpSettings(data: SmtpUpdatePayload): Promise<any> {
    const response = await api.put('/sistema-config/smtp', data);
    return response.data;
  }

  static async testSmtpSettings(to: string): Promise<any> {
    const response = await api.post('/sistema-config/smtp/testar', { to });
    return response.data;
  }

  static async getEmailTemplates(): Promise<EmailTemplatesResponse> {
    const response = await api.get('/sistema-config/email-templates');
    return response.data?.data;
  }

  static async updateEmailTemplate(tipo: EmailTemplateType, payload: EmailTemplateItem): Promise<any> {
    const response = await api.put(`/sistema-config/email-templates/${tipo}`, payload);
    return response.data;
  }

  static async restoreEmailTemplate(tipo: EmailTemplateType): Promise<any> {
    const response = await api.post(`/sistema-config/email-templates/${tipo}/restaurar`);
    return response.data;
  }
}
