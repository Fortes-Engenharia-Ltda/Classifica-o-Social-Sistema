"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigController = void 0;
const response_1 = require("../utils/response");
const SystemConfigService_1 = require("../services/SystemConfigService");
const systemConfigService = new SystemConfigService_1.SystemConfigService();
class SystemConfigController {
    getPerfis(req, res) {
        const perfis = systemConfigService.getProfileKeys();
        res.status(200).json((0, response_1.successResponse)('Perfis carregados com sucesso', perfis));
    }
    getVisibleModules(req, res) {
        const perfil = req.user?.perfil || 'ANALYST';
        const data = systemConfigService.getVisibleModulesByRole(perfil);
        res.status(200).json((0, response_1.successResponse)('Módulos visíveis carregados com sucesso', data));
    }
    getModulesConfig(req, res) {
        const data = systemConfigService.getModuleVisibility();
        res.status(200).json((0, response_1.successResponse)('Configuração de módulos carregada com sucesso', data));
    }
    updateModulesConfig(req, res) {
        const perfil = String(req.params.perfil || '').trim().toUpperCase();
        if (!perfil) {
            res.status(400).json((0, response_1.errorResponse)('Perfil inválido'));
            return;
        }
        const data = systemConfigService.updateRoleModuleVisibility(perfil, req.body || {});
        res.status(200).json((0, response_1.successResponse)('Configuração de módulos atualizada com sucesso', data));
    }
    createModulesProfile(req, res) {
        try {
            const perfil = String(req.body?.perfil || '').trim().toUpperCase();
            const basePerfil = String(req.body?.basePerfil || 'ANALYST').trim().toUpperCase();
            const data = systemConfigService.createCustomProfile(perfil, basePerfil);
            res.status(200).json((0, response_1.successResponse)('Perfil de módulos criado com sucesso', data));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message || 'Erro ao criar perfil de módulos'));
        }
    }
    deleteModulesProfile(req, res) {
        try {
            const perfil = String(req.params.perfil || '').trim().toUpperCase();
            const data = systemConfigService.deleteCustomProfile(perfil);
            res.status(200).json((0, response_1.successResponse)('Perfil de módulos excluído com sucesso', data));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message || 'Erro ao excluir perfil de módulos'));
        }
    }
    getSqlServerConfig(req, res) {
        const data = systemConfigService.getSqlServerSettings();
        res.status(200).json((0, response_1.successResponse)('Configuração SQL Server carregada com sucesso', data));
    }
    updateSqlServerConfig(req, res) {
        const body = req.body || {};
        const port = Number(body.port || 1433);
        if (Number.isNaN(port) || port <= 0) {
            res.status(400).json((0, response_1.errorResponse)('Porta inválida'));
            return;
        }
        const data = systemConfigService.updateSqlServerSettings({
            host: String(body.host || ''),
            port,
            database: String(body.database || ''),
            user: String(body.user || ''),
            password: body.password ? String(body.password) : undefined,
            encrypt: Boolean(body.encrypt),
            trustServerCertificate: Boolean(body.trustServerCertificate),
        });
        res.status(200).json((0, response_1.successResponse)('Configuração SQL Server atualizada com sucesso', data));
    }
    getSmtpConfig(req, res) {
        const data = systemConfigService.getSmtpSettings();
        res.status(200).json((0, response_1.successResponse)('Configuração SMTP carregada com sucesso', data));
    }
    updateSmtpConfig(req, res) {
        const body = req.body || {};
        const port = Number(body.port || 587);
        if (Number.isNaN(port) || port <= 0) {
            res.status(400).json((0, response_1.errorResponse)('Porta SMTP inválida'));
            return;
        }
        const from = String(body.from || '').trim();
        if (!from) {
            res.status(400).json((0, response_1.errorResponse)('Remetente (from) é obrigatório'));
            return;
        }
        const data = systemConfigService.updateSmtpSettings({
            host: String(body.host || ''),
            port,
            secure: Boolean(body.secure),
            user: String(body.user || ''),
            pass: body.pass ? String(body.pass) : undefined,
            from,
        });
        res.status(200).json((0, response_1.successResponse)('Configuração SMTP atualizada com sucesso', data));
    }
    async testSmtpConfig(req, res) {
        try {
            const to = String(req.body?.to || '').trim();
            if (!to) {
                res.status(400).json((0, response_1.errorResponse)('Informe o email de destino para teste'));
                return;
            }
            await systemConfigService.sendTestEmail({ to });
            res.status(200).json((0, response_1.successResponse)('Email de teste enviado com sucesso'));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message || 'Falha ao enviar email de teste'));
        }
    }
    getEmailTemplates(req, res) {
        const data = systemConfigService.getEmailTemplates();
        res.status(200).json((0, response_1.successResponse)('Templates de email carregados com sucesso', data));
    }
    updateEmailTemplate(req, res) {
        try {
            const type = String(req.params.tipo || '').trim().toUpperCase();
            const subject = String(req.body?.subject || '');
            const html = String(req.body?.html || '');
            const data = systemConfigService.updateEmailTemplate(type, { subject, html });
            res.status(200).json((0, response_1.successResponse)('Template de email atualizado com sucesso', data));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message || 'Erro ao atualizar template de email'));
        }
    }
    restoreEmailTemplate(req, res) {
        try {
            const type = String(req.params.tipo || '').trim().toUpperCase();
            const data = systemConfigService.restoreEmailTemplate(type);
            res.status(200).json((0, response_1.successResponse)('Template de email restaurado para o padrao com sucesso', data));
        }
        catch (error) {
            res.status(400).json((0, response_1.errorResponse)(error.message || 'Erro ao restaurar template de email'));
        }
    }
}
exports.SystemConfigController = SystemConfigController;
//# sourceMappingURL=SystemConfigController.js.map