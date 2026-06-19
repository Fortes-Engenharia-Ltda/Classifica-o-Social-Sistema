"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const logger_1 = __importDefault(require("../config/logger"));
const emailTemplates_1 = require("../config/emailTemplates");
class EmailService {
    constructor() {
        this.emailTemplatesPath = path_1.default.resolve(process.cwd(), 'data', 'email-templates.json');
    }
    getRuntimeEmailConfig() {
        return {
            host: process.env.SMTP_HOST || config_1.config.email.host,
            port: parseInt(process.env.SMTP_PORT || String(config_1.config.email.port || 587), 10),
            secure: String(process.env.SMTP_SECURE ?? config_1.config.email.secure) === 'true',
            user: process.env.SMTP_USER || config_1.config.email.user,
            pass: process.env.SMTP_PASS || config_1.config.email.pass,
            from: process.env.SMTP_FROM || config_1.config.email.from,
        };
    }
    hasSmtpConfig() {
        const cfg = this.getRuntimeEmailConfig();
        return Boolean(cfg.host) && Boolean(cfg.user) && Boolean(cfg.pass);
    }
    loadEmailTemplates() {
        try {
            if (!fs_1.default.existsSync(this.emailTemplatesPath)) {
                return JSON.parse(JSON.stringify(emailTemplates_1.DEFAULT_EMAIL_TEMPLATES));
            }
            const raw = fs_1.default.readFileSync(this.emailTemplatesPath, 'utf8');
            const parsed = JSON.parse(raw);
            return {
                PASSWORD_RESET: {
                    ...emailTemplates_1.DEFAULT_EMAIL_TEMPLATES.PASSWORD_RESET,
                    ...(parsed.PASSWORD_RESET || {}),
                },
                INSTITUICAO_REVISAO: {
                    ...emailTemplates_1.DEFAULT_EMAIL_TEMPLATES.INSTITUICAO_REVISAO,
                    ...(parsed.INSTITUICAO_REVISAO || {}),
                },
                USER_WELCOME: {
                    ...emailTemplates_1.DEFAULT_EMAIL_TEMPLATES.USER_WELCOME,
                    ...(parsed.USER_WELCOME || {}),
                },
            };
        }
        catch {
            return JSON.parse(JSON.stringify(emailTemplates_1.DEFAULT_EMAIL_TEMPLATES));
        }
    }
    renderTemplate(type, variables) {
        const templates = this.loadEmailTemplates();
        const template = templates[type];
        const replaceVars = (content) => {
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
    stripHtml(html) {
        return String(html || '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    async enviarCodigoRedefinicao(email, nome, codigo) {
        const smtp = this.getRuntimeEmailConfig();
        if (!this.hasSmtpConfig()) {
            logger_1.default.warn(`SMTP não configurado. Código de redefinição para ${email}: ${codigo}. Configure SMTP_* no backend para envio real.`);
            return;
        }
        const transporter = nodemailer_1.default.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: {
                user: smtp.user,
                pass: smtp.pass,
            },
        });
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
    }
    async enviarNotificacaoStatusInstituicao(emailResponsavel, nomeResponsavel, nomeInstituicao, status, motivo, linkAjustes) {
        if (!emailResponsavel) {
            logger_1.default.warn(`Email do responsável não fornecido para instituição: ${nomeInstituicao}`);
            return;
        }
        const smtp = this.getRuntimeEmailConfig();
        if (!this.hasSmtpConfig()) {
            const msg = `SMTP não configurado. Notificação para ${emailResponsavel}: ${nomeInstituicao} - Status: ${status}${motivo ? ` - Motivo: ${motivo}` : ''}`;
            logger_1.default.info(msg);
            return;
        }
        const transporter = nodemailer_1.default.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: {
                user: smtp.user,
                pass: smtp.pass,
            },
        });
        const assuntos = {
            APROVADO: 'Instituição Aprovada',
            REJEITADO: 'Instituição Rejeitada',
            AJUSTES_SOLICITADOS: 'Ajustes Solicitados',
            PENDENTE: 'Cadastro Enviado para Validação',
        };
        const mensagens = {
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
    }
    async enviarBoasVindasUsuario(email, nome, senhaInicial) {
        const smtp = this.getRuntimeEmailConfig();
        if (!this.hasSmtpConfig()) {
            logger_1.default.warn(`SMTP não configurado. Boas-vindas para ${email}: senha inicial = ${senhaInicial}. Configure SMTP_* no backend para envio real.`);
            return;
        }
        const transporter = nodemailer_1.default.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: { user: smtp.user, pass: smtp.pass },
        });
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
    }
}
exports.EmailService = EmailService;
//# sourceMappingURL=EmailService.js.map