"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const systemModules_1 = require("../config/systemModules");
const config_1 = require("../config");
const emailTemplates_1 = require("../config/emailTemplates");
class SystemConfigService {
    constructor() {
        this.configPath = path_1.default.resolve(process.cwd(), 'data', 'system-config.json');
        this.envPath = path_1.default.resolve(process.cwd(), '.env');
        this.emailTemplatesPath = path_1.default.resolve(process.cwd(), 'data', 'email-templates.json');
    }
    getModuleVisibility() {
        return this.loadConfigFile();
    }
    getProfileKeys() {
        const visibility = this.loadConfigFile();
        return Object.keys(visibility);
    }
    getVisibleModulesByRole(role) {
        const visibility = this.loadConfigFile();
        const perfil = (role in visibility ? role : 'ANALYST');
        if (perfil === 'MANAGER') {
            return { ...systemModules_1.DEFAULT_MODULE_VISIBILITY.MANAGER };
        }
        return visibility[perfil];
    }
    updateRoleModuleVisibility(role, payload) {
        const current = this.loadConfigFile();
        if (!current[role]) {
            current[role] = { ...systemModules_1.DEFAULT_MODULE_VISIBILITY.ANALYST };
        }
        if (role === 'MANAGER') {
            current.MANAGER = { ...systemModules_1.DEFAULT_MODULE_VISIBILITY.MANAGER };
            this.saveConfigFile(current);
            return current;
        }
        const mergedRoleConfig = { ...current[role] };
        for (const moduleKey of systemModules_1.SYSTEM_MODULE_KEYS) {
            if (typeof payload[moduleKey] === 'boolean') {
                mergedRoleConfig[moduleKey] = payload[moduleKey];
            }
        }
        current[role] = mergedRoleConfig;
        this.saveConfigFile(current);
        return current;
    }
    createCustomProfile(role, baseRole) {
        const perfil = String(role || '').trim().toUpperCase();
        if (!perfil) {
            throw new Error('Informe o nome do perfil');
        }
        const current = this.loadConfigFile();
        if (current[perfil]) {
            throw new Error('Perfil já existe');
        }
        const base = String(baseRole || 'ANALYST').trim().toUpperCase();
        const baseConfig = current[base] || systemModules_1.DEFAULT_MODULE_VISIBILITY.ANALYST;
        current[perfil] = { ...baseConfig };
        this.saveConfigFile(current);
        return current;
    }
    deleteCustomProfile(role) {
        const perfil = String(role || '').trim().toUpperCase();
        if (!perfil) {
            throw new Error('Perfil inválido');
        }
        const fixedProfiles = new Set(['MASTER', 'ADMIN', 'ANALYST', 'MANAGER']);
        if (fixedProfiles.has(perfil)) {
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
            host: config_1.config.sqlServer.host,
            port: config_1.config.sqlServer.port,
            database: config_1.config.sqlServer.database,
            user: config_1.config.sqlServer.user,
            hasPassword: Boolean(config_1.config.sqlServer.password),
            encrypt: config_1.config.sqlServer.encrypt,
            trustServerCertificate: config_1.config.sqlServer.trustServerCertificate,
        };
    }
    updateSqlServerSettings(input) {
        const updatedValues = {
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
        const host = process.env.SMTP_HOST || config_1.config.email.host;
        const port = Number(process.env.SMTP_PORT || config_1.config.email.port || 587);
        const secure = String(process.env.SMTP_SECURE ?? config_1.config.email.secure) === 'true';
        const user = process.env.SMTP_USER || config_1.config.email.user;
        const pass = process.env.SMTP_PASS || config_1.config.email.pass;
        const from = process.env.SMTP_FROM || config_1.config.email.from;
        return {
            host,
            port,
            secure,
            user,
            from,
            hasPassword: Boolean(pass),
        };
    }
    updateSmtpSettings(input) {
        const updatedValues = {
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
        config_1.config.email.host = process.env.SMTP_HOST || config_1.config.email.host;
        config_1.config.email.port = Number(process.env.SMTP_PORT || config_1.config.email.port || 587);
        config_1.config.email.secure = String(process.env.SMTP_SECURE ?? config_1.config.email.secure) === 'true';
        config_1.config.email.user = process.env.SMTP_USER || config_1.config.email.user;
        config_1.config.email.pass = process.env.SMTP_PASS || config_1.config.email.pass;
        config_1.config.email.from = process.env.SMTP_FROM || config_1.config.email.from;
        return this.getSmtpSettings();
    }
    async sendTestEmail(input) {
        const settings = this.getSmtpSettings();
        const smtpPass = process.env.SMTP_PASS || config_1.config.email.pass;
        if (!settings.host || !settings.user || !smtpPass || !settings.from) {
            throw new Error('Configuração SMTP incompleta. Preencha host, usuário, senha e remetente.');
        }
        const transporter = nodemailer_1.default.createTransport({
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
    getEmailTemplates() {
        return {
            labels: emailTemplates_1.EMAIL_TEMPLATE_LABELS,
            templates: this.loadEmailTemplates(),
        };
    }
    updateEmailTemplate(type, payload) {
        const current = this.loadEmailTemplates();
        const templateType = String(type || '').trim().toUpperCase();
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
    restoreEmailTemplate(type) {
        const current = this.loadEmailTemplates();
        const templateType = String(type || '').trim().toUpperCase();
        if (!current[templateType] || !emailTemplates_1.DEFAULT_EMAIL_TEMPLATES[templateType]) {
            throw new Error('Tipo de template de email invalido');
        }
        current[templateType] = {
            ...emailTemplates_1.DEFAULT_EMAIL_TEMPLATES[templateType],
        };
        this.saveEmailTemplates(current);
        return this.getEmailTemplates();
    }
    loadConfigFile() {
        try {
            if (!fs_1.default.existsSync(this.configPath)) {
                this.ensureDataDir();
                this.saveConfigFile(systemModules_1.DEFAULT_MODULE_VISIBILITY);
                return JSON.parse(JSON.stringify(systemModules_1.DEFAULT_MODULE_VISIBILITY));
            }
            const raw = fs_1.default.readFileSync(this.configPath, 'utf8');
            const parsed = JSON.parse(raw);
            const merged = {
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
        }
        catch {
            return JSON.parse(JSON.stringify(systemModules_1.DEFAULT_MODULE_VISIBILITY));
        }
    }
    saveConfigFile(data) {
        this.ensureDataDir();
        fs_1.default.writeFileSync(this.configPath, JSON.stringify(data, null, 2), 'utf8');
    }
    ensureDataDir() {
        const dir = path_1.default.dirname(this.configPath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    }
    mergeModuleDefaults(role, input) {
        const merged = { ...systemModules_1.DEFAULT_MODULE_VISIBILITY[role] };
        if (!input) {
            return merged;
        }
        for (const moduleKey of systemModules_1.SYSTEM_MODULE_KEYS) {
            if (typeof input[moduleKey] === 'boolean') {
                merged[moduleKey] = input[moduleKey];
            }
        }
        return merged;
    }
    updateEnvFile(values) {
        let lines = [];
        if (fs_1.default.existsSync(this.envPath)) {
            lines = fs_1.default.readFileSync(this.envPath, 'utf8').split(/\r?\n/);
        }
        for (const [key, value] of Object.entries(values)) {
            const formattedValue = this.formatEnvValue(value);
            const newLine = `${key}=${formattedValue}`;
            const idx = lines.findIndex((line) => line.startsWith(`${key}=`));
            if (idx >= 0) {
                lines[idx] = newLine;
            }
            else {
                lines.push(newLine);
            }
        }
        fs_1.default.writeFileSync(this.envPath, `${lines.filter(Boolean).join('\n')}\n`, 'utf8');
    }
    formatEnvValue(value) {
        const escaped = value.replace(/\"/g, '\\"');
        return `"${escaped}"`;
    }
    loadEmailTemplates() {
        try {
            if (!fs_1.default.existsSync(this.emailTemplatesPath)) {
                this.ensureDataDir();
                this.saveEmailTemplates(emailTemplates_1.DEFAULT_EMAIL_TEMPLATES);
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
    saveEmailTemplates(data) {
        this.ensureDataDir();
        fs_1.default.writeFileSync(this.emailTemplatesPath, JSON.stringify(data, null, 2), 'utf8');
    }
}
exports.SystemConfigService = SystemConfigService;
//# sourceMappingURL=SystemConfigService.js.map