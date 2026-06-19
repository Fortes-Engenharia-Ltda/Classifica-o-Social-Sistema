"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_TEMPLATE_LABELS = exports.DEFAULT_EMAIL_TEMPLATES = void 0;
exports.DEFAULT_EMAIL_TEMPLATES = {
    PASSWORD_RESET: {
        subject: 'Codigo para redefinir senha',
        html: `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #111827;">
        <p>Ola <strong>{{nome}}</strong>,</p>
        <p>Seu codigo para redefinir a senha e:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">{{codigo}}</p>
        <p>Este codigo expira em 15 minutos.</p>
        <p>Atenciosamente,<br/>Fortes Engenharia</p>
      </div>
    `.trim(),
    },
    INSTITUICAO_REVISAO: {
        subject: 'Atualizacao da revisao da instituicao {{nomeInstituicao}}',
        html: `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #111827;">
        <p>Ola <strong>{{nomeResponsavel}}</strong>,</p>
        <p>{{statusMensagem}}</p>
        <p><strong>Status:</strong> {{status}}</p>
        <p><strong>Motivo:</strong> {{motivo}}</p>
        <p><strong>Link de ajustes:</strong> <a href="{{linkAjustes}}">{{linkAjustes}}</a></p>
        <p>Atenciosamente,<br/>Fortes Engenharia</p>
      </div>
    `.trim(),
    },
    USER_WELCOME: {
        subject: 'Bem-vindo ao Sistema de Classificacao Social',
        html: `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #111827;">
        <p>Ola <strong>{{nome}}</strong>,</p>
        <p>Seu acesso ao Sistema de Classificacao Social foi criado com sucesso.</p>
        <p><strong>Email:</strong> {{email}}</p>
        <p><strong>Senha inicial:</strong> {{senhaInicial}}</p>
        <p>Por seguranca, recomendamos alterar sua senha no primeiro acesso.</p>
        <p>Atenciosamente,<br/>Fortes Engenharia</p>
      </div>
    `.trim(),
    },
};
exports.EMAIL_TEMPLATE_LABELS = {
    PASSWORD_RESET: 'Troca de senha',
    INSTITUICAO_REVISAO: 'Revisao',
    USER_WELCOME: 'Criacao de usuario',
};
//# sourceMappingURL=emailTemplates.js.map