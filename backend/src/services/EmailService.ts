import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import logger from '../config/logger';
import { DEFAULT_EMAIL_TEMPLATES, EmailTemplatesConfig, EmailTemplateType } from '../config/emailTemplates';

export class EmailService {
  private emailTemplatesPath = path.resolve(process.cwd(), 'data', 'email-templates.json');

  private getRuntimeEmailConfig() {
    return {
      host: process.env.SMTP_HOST || config.email.host,
      port: parseInt(process.env.SMTP_PORT || String(config.email.port || 587), 10),
      secure: String(process.env.SMTP_SECURE ?? config.email.secure) === 'true',
      user: process.env.SMTP_USER || config.email.user,
      pass: process.env.SMTP_PASS || config.email.pass,
      from: process.env.SMTP_FROM || config.email.from,
    };
  }

  private hasSmtpConfig() {
    const cfg = this.getRuntimeEmailConfig();
    return Boolean(cfg.host) && Boolean(cfg.user) && Boolean(cfg.pass);
  }

  private createTransport(smtp: ReturnType<typeof this.getRuntimeEmailConfig>) {
    return nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
      tls: { rejectUnauthorized: false },
    });
  }

  private loadEmailTemplates(): EmailTemplatesConfig {
    try {
      if (!fs.existsSync(this.emailTemplatesPath)) {
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

  private renderTemplate(type: EmailTemplateType, variables: Record<string, string | number | undefined | null>) {
    const templates = this.loadEmailTemplates();
    const template = templates[type];

    const replaceVars = (content: string): string => {
      return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_fullMatch, key) => {
        const value = variables[key];
        return value == null ? '' : String(value);
      });
    };

    return {
      subject: replaceVars(template.subject),
      html: replaceVars(template.html),
    };
  }

  private stripHtml(html: string): string {
    return String(html || '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async enviarCodigoRedefinicao(email: string, nome: string, codigo: string): Promise<void> {
    const smtp = this.getRuntimeEmailConfig();
    if (!this.hasSmtpConfig()) {
      logger.warn(
        `SMTP não configurado. Código de redefinição para ${email}: ${codigo}. Configure SMTP_* no backend para envio real.`,
      );
      return;
    }

    try {
      const transporter = this.createTransport(smtp);

      const rendered = this.renderTemplate('PASSWORD_RESET', {
        nome,
        codigo,
      });

      await transporter.sendMail({
        from: smtp.from,
        to: email,
        subject: rendered.subject,
        html: rendered.html,
        text: this.stripHtml(rendered.html),
      });
      logger.info(`Email de redefinição enviado com sucesso para ${email}`);
    } catch (error) {
      logger.error(`Falha ao enviar email de redefinição para ${email}: ${(error as Error).message}`, error);
    }
  }

  async enviarNotificacaoStatusInstituicao(
    emailResponsavel: string,
    nomeResponsavel: string,
    nomeInstituicao: string,
    status: 'APROVADO' | 'REJEITADO' | 'AJUSTES_SOLICITADOS' | 'PENDENTE',
    motivo?: string,
    linkAjustes?: string,
  ): Promise<void> {
    if (!emailResponsavel) {
      logger.warn(`Email do responsável não fornecido para instituição: ${nomeInstituicao}`);
      return;
    }
    
    const smtp = this.getRuntimeEmailConfig();
    if (!this.hasSmtpConfig()) {
      const msg = `SMTP não configurado. Notificação para ${emailResponsavel}: ${nomeInstituicao} - Status: ${status}${motivo ? ` - Motivo: ${motivo}` : ''}`;
      logger.info(msg);
      return;
    }

    try {
      const transporter = this.createTransport(smtp);

      const assuntos: Record<string, string> = {
        APROVADO: 'Instituição Aprovada',
        REJEITADO: 'Instituição Rejeitada',
        AJUSTES_SOLICITADOS: 'Ajustes Solicitados',
        PENDENTE: 'Cadastro Enviado para Validação',
      };

      const mensagens: Record<string, string> = {
        APROVADO: `Parabéns! Sua instituição "${nomeInstituicao}" foi aprovada e está disponível no sistema.`,
        REJEITADO: `Sua instituição "${nomeInstituicao}" foi rejeitada.${motivo ? ` Motivo: ${motivo}` : ''}`,
        AJUSTES_SOLICITADOS: `Sua instituição "${nomeInstituicao}" requer ajustes.${motivo ? ` Detalhes: ${motivo}` : ''}${linkAjustes ? `\n\nAcesse o link abaixo para realizar os ajustes:\n${linkAjustes}` : ''}`,
        PENDENTE: `Seu cadastro para "${nomeInstituicao}" foi enviado com sucesso. Aguarde a validação pela equipe Fortes Engenharia.`,
      };

      const rendered = this.renderTemplate('INSTITUICAO_REVISAO', {
        nomeResponsavel,
        nomeInstituicao,
        status,
        statusTitulo: assuntos[status],
        statusMensagem: mensagens[status],
        motivo: motivo || '',
        linkAjustes: linkAjustes || '',
      });

      await transporter.sendMail({
        from: smtp.from,
        to: emailResponsavel,
        subject: rendered.subject,
        html: rendered.html,
        text: this.stripHtml(rendered.html),
      });
    } catch (error) {
      logger.error(`Falha ao enviar notificação para ${emailResponsavel}: ${(error as Error).message}`, error);
    }
  }

  async enviarBoasVindasUsuario(email: string, nome: string, senhaInicial: string): Promise<void> {
    const smtp = this.getRuntimeEmailConfig();
    if (!this.hasSmtpConfig()) {
      logger.warn(
        `SMTP não configurado. Boas-vindas para ${email}: senha inicial = ${senhaInicial}. Configure SMTP_* no backend para envio real.`,
      );
      return;
    }

    try {
      const transporter = this.createTransport(smtp);

      const rendered = this.renderTemplate('USER_WELCOME', {
        nome,
        email,
        senhaInicial,
      });

      await transporter.sendMail({
        from: smtp.from,
        to: email,
        subject: rendered.subject,
        html: rendered.html,
        text: this.stripHtml(rendered.html),
      });
    } catch (error) {
      logger.error(`Falha ao enviar email de boas-vindas para ${email}: ${(error as Error).message}`, error);
    }
  }
}
