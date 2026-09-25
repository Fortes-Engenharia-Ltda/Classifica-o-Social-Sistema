import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { errorResponse, successResponse } from '../utils/response';
import { SystemConfigService } from '../services/SystemConfigService';
import { EmailTemplateType } from '../config/emailTemplates';

const systemConfigService = new SystemConfigService();

export class SystemConfigController {
  getPerfis(req: AuthenticatedRequest, res: Response): void {
    const perfis = systemConfigService.getProfileKeys();
    res.status(200).json(successResponse('Perfis carregados com sucesso', perfis));
  }

  getVisibleModules(req: AuthenticatedRequest, res: Response): void {
    const perfil = req.user?.perfil || 'ANALYST';
    const data = systemConfigService.getVisibleModulesByRole(perfil);
    res.status(200).json(successResponse('Módulos visíveis carregados com sucesso', data));
  }

  getModulesConfig(req: AuthenticatedRequest, res: Response): void {
    const data = systemConfigService.getModuleVisibility();
    res.status(200).json(successResponse('Configuração de módulos carregada com sucesso', data));
  }

  updateModulesConfig(req: AuthenticatedRequest, res: Response): void {
    const perfil = String(req.params.perfil || '').trim().toUpperCase();
    if (!perfil) {
      res.status(400).json(errorResponse('Perfil inválido'));
      return;
    }

    const data = systemConfigService.updateRoleModuleVisibility(perfil, req.body || {});
    res.status(200).json(successResponse('Configuração de módulos atualizada com sucesso', data));
  }

  createModulesProfile(req: AuthenticatedRequest, res: Response): void {
    try {
      const perfil = String(req.body?.perfil || '').trim().toUpperCase();
      const basePerfil = String(req.body?.basePerfil || 'ANALYST').trim().toUpperCase();
      const data = systemConfigService.createCustomProfile(perfil, basePerfil);
      res.status(200).json(successResponse('Perfil de módulos criado com sucesso', data));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message || 'Erro ao criar perfil de módulos'));
    }
  }

  deleteModulesProfile(req: AuthenticatedRequest, res: Response): void {
    try {
      const perfil = String(req.params.perfil || '').trim().toUpperCase();
      const data = systemConfigService.deleteCustomProfile(perfil);
      res.status(200).json(successResponse('Perfil de módulos excluído com sucesso', data));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message || 'Erro ao excluir perfil de módulos'));
    }
  }

  getSqlServerConfig(req: AuthenticatedRequest, res: Response): void {
    const data = systemConfigService.getSqlServerSettings();
    res.status(200).json(successResponse('Configuração SQL Server carregada com sucesso', data));
  }

  updateSqlServerConfig(req: AuthenticatedRequest, res: Response): void {
    const body = req.body || {};

    const port = Number(body.port || 1433);
    if (Number.isNaN(port) || port <= 0) {
      res.status(400).json(errorResponse('Porta inválida'));
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

    res.status(200).json(successResponse('Configuração SQL Server atualizada com sucesso', data));
  }

  getSmtpConfig(req: AuthenticatedRequest, res: Response): void {
    const data = systemConfigService.getSmtpSettings();
    res.status(200).json(successResponse('Configuração SMTP carregada com sucesso', data));
  }

  updateSmtpConfig(req: AuthenticatedRequest, res: Response): void {
    const body = req.body || {};

    const port = Number(body.port || 587);
    if (Number.isNaN(port) || port <= 0) {
      res.status(400).json(errorResponse('Porta SMTP inválida'));
      return;
    }

    const from = String(body.from || '').trim();
    if (!from) {
      res.status(400).json(errorResponse('Remetente (from) é obrigatório'));
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

    res.status(200).json(successResponse('Configuração SMTP atualizada com sucesso', data));
  }

  async testSmtpConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const to = String(req.body?.to || '').trim();
      if (!to) {
        res.status(400).json(errorResponse('Informe o email de destino para teste'));
        return;
      }

      await systemConfigService.sendTestEmail({ to });
      res.status(200).json(successResponse('Email de teste enviado com sucesso'));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message || 'Falha ao enviar email de teste'));
    }
  }

  getEmailTemplates(req: AuthenticatedRequest, res: Response): void {
    const data = systemConfigService.getEmailTemplates();
    res.status(200).json(successResponse('Templates de email carregados com sucesso', data));
  }

  updateEmailTemplate(req: AuthenticatedRequest, res: Response): void {
    try {
      const type = String(req.params.tipo || '').trim().toUpperCase() as EmailTemplateType;
      const subject = String(req.body?.subject || '');
      const html = String(req.body?.html || '');

      const data = systemConfigService.updateEmailTemplate(type, { subject, html });
      res.status(200).json(successResponse('Template de email atualizado com sucesso', data));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message || 'Erro ao atualizar template de email'));
    }
  }

  restoreEmailTemplate(req: AuthenticatedRequest, res: Response): void {
    try {
      const type = String(req.params.tipo || '').trim().toUpperCase() as EmailTemplateType;
      const data = systemConfigService.restoreEmailTemplate(type);
      res.status(200).json(successResponse('Template de email restaurado para o padrao com sucesso', data));
    } catch (error: any) {
      res.status(400).json(errorResponse(error.message || 'Erro ao restaurar template de email'));
    }
  }
}
