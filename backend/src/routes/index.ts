import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

import usuarioRoutes from './usuarioRoutes';
import obraRoutes from './obraRoutes';
import projetoRoutes from './projetoRoutes';
import programaRoutes from './programaRoutes';
import classificacaoRoutes from './classificacaoRoutes';
import notaFiscalRoutes from './notaFiscalRoutes';
import dashboardRoutes from './dashboardRoutes';
import cadastroAdminRoutes from './cadastroAdminRoutes';
import instituicaoRoutes from './instituicaoRoutes';
import tokenCadastroRoutes from './tokenCadastroRoutes';
import systemConfigRoutes from './systemConfigRoutes';

const router = Router();

router.post('/test-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const target = email || process.env.SMTP_FROM || 'teste@teste.com';

    const smtp = {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || '',
    };

    const configOk = Boolean(smtp.host && smtp.user && smtp.pass);
    const maskedPass = smtp.pass ? smtp.pass.slice(0, 3) + '***' : '(vazio)';

    if (!configOk) {
      res.status(400).json({
        success: false,
        message: 'SMTP não configurado',
        config: { host: smtp.host, user: smtp.user, pass: maskedPass, port: smtp.port, secure: smtp.secure, from: smtp.from },
      });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: smtp.from,
      to: target,
      subject: 'Teste SMTP - Classificação Social',
      html: `<p>Este é um email de teste do Sistema de Classificação Social.</p><p>SMTP configurado corretamente!</p>`,
    });

    res.status(200).json({
      success: true,
      message: `Email de teste enviado para ${target}`,
      messageId: info.messageId,
      config: { host: smtp.host, user: smtp.user, pass: maskedPass, port: smtp.port, secure: smtp.secure, from: smtp.from },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Falha ao enviar email: ${error.message}`,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

router.use('/usuarios', usuarioRoutes);
router.use('/obras', obraRoutes);
router.use('/projetos', projetoRoutes);
router.use('/programas', programaRoutes);
router.use('/classificacoes', classificacaoRoutes);
router.use('/notas-fiscais', notaFiscalRoutes);
router.use('/dashboard', dashboardRoutes);

// Rotas administrativas para cadastros
router.use('/admin-cadastros', cadastroAdminRoutes);
router.use('/', instituicaoRoutes);

// Token de acesso para Cadastro (Legado) de instituições
router.use('/token-cadastro', tokenCadastroRoutes);

// Configuração de sistema (perfil MASTER)
router.use('/sistema-config', systemConfigRoutes);

export default router;
