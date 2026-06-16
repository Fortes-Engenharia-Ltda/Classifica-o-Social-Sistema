import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';
import { UsuarioService } from '@/services/UsuarioService';
import {
  EmailTemplateType,
  SystemConfigService,
} from '@/services/SystemConfigService';
import {
  DEFAULT_MODULE_VISIBILITY,
  MODULE_KEYS,
  MODULE_LABELS,
  ROLE_LABELS,
  RolePerfil,
  SystemModuleKey,
} from '@/config/moduleVisibility';
import { Usuario } from '@/types';

type AbaSistema = 'usuarios' | 'modulos' | 'banco' | 'email';

const emailTemplateTypes: EmailTemplateType[] = ['INSTITUICAO_REVISAO', 'PASSWORD_RESET', 'USER_WELCOME'];

const emailTemplatePlaceholders: Record<EmailTemplateType, string[]> = {
  INSTITUICAO_REVISAO: ['{{nomeResponsavel}}', '{{nomeInstituicao}}', '{{status}}', '{{statusTitulo}}', '{{statusMensagem}}', '{{motivo}}', '{{linkAjustes}}'],
  PASSWORD_RESET: ['{{nome}}', '{{codigo}}'],
  USER_WELCOME: ['{{nome}}', '{{email}}', '{{senhaInicial}}'],
};

const abas: Record<AbaSistema, string> = {
  usuarios: 'Usuários',
  modulos: 'Módulos por Perfil',
  banco: 'Banco de Dados',
  email: 'Email (SMTP e Templates)',
};

export const ConfiguracaoSistema: React.FC = () => {
  const { usuario } = useAuthStore();
  const [abaAtiva, setAbaAtiva] = useState<AbaSistema>('usuarios');

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [showSenhaModal, setShowSenhaModal] = useState(false);
  const [usuarioSenhaSelecionado, setUsuarioSenhaSelecionado] = useState<Usuario | null>(null);
  const [novaSenhaUsuario, setNovaSenhaUsuario] = useState('');
  const [salvandoSenhaUsuario, setSalvandoSenhaUsuario] = useState(false);

  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    email: '',
    dataNascimento: '',
    senha: '',
    perfil: 'ANALYST' as RolePerfil,
  });

  const [moduleVisibility, setModuleVisibility] = useState(DEFAULT_MODULE_VISIBILITY);
  const [savingModules, setSavingModules] = useState(false);
  const [novoPerfilModulo, setNovoPerfilModulo] = useState('');
  const [basePerfilNovoModulo, setBasePerfilNovoModulo] = useState('ANALYST');

  const [sqlConfig, setSqlConfig] = useState({
    host: '',
    port: 1433,
    database: '',
    user: '',
    password: '',
    encrypt: true,
    trustServerCertificate: false,
  });
  const [hasSqlPassword, setHasSqlPassword] = useState(false);
  const [savingSql, setSavingSql] = useState(false);

  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    from: '',
    pass: '',
  });
  const [hasSmtpPassword, setHasSmtpPassword] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [emailTemplateLabels, setEmailTemplateLabels] = useState<Record<EmailTemplateType, string>>({
    INSTITUICAO_REVISAO: 'Revisao',
    PASSWORD_RESET: 'Troca de senha',
    USER_WELCOME: 'Criacao de usuario',
  });
  const [emailTemplates, setEmailTemplates] = useState<Record<EmailTemplateType, { subject: string; html: string }>>({
    INSTITUICAO_REVISAO: { subject: '', html: '' },
    PASSWORD_RESET: { subject: '', html: '' },
    USER_WELCOME: { subject: '', html: '' },
  });
  const [templateSelecionado, setTemplateSelecionado] = useState<EmailTemplateType>('INSTITUICAO_REVISAO');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateHtml, setTemplateHtml] = useState('');
  const [salvandoTemplate, setSalvandoTemplate] = useState(false);
  const [restaurandoTemplate, setRestaurandoTemplate] = useState(false);
  const templateEditorRef = useRef<HTMLTextAreaElement | null>(null);

  const [feedback, setFeedback] = useState('');
  const [erro, setErro] = useState('');

  const canAccessSystemConfig = usuario?.perfil === 'MASTER' || usuario?.perfil === 'MANAGER';

  const limparMensagens = () => {
    setErro('');
    setFeedback('');
  };

  const carregarUsuarios = async () => {
    setCarregandoUsuarios(true);
    try {
      const response = await UsuarioService.getAll(1, 100);
      const lista = response?.data?.usuarios || [];
      setUsuarios(lista);
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Não foi possível carregar usuários');
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  const carregarModulos = async () => {
    try {
      const data = await SystemConfigService.getModuleVisibilityConfig();
      if (data) {
        setModuleVisibility(data);
      }
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Não foi possível carregar módulos por perfil');
    }
  };

  const carregarConfigBanco = async () => {
    try {
      const data = await SystemConfigService.getSqlServerSettings();
      setSqlConfig((curr) => ({
        ...curr,
        host: data.host || '',
        port: data.port || 1433,
        database: data.database || '',
        user: data.user || '',
        password: '',
        encrypt: Boolean(data.encrypt),
        trustServerCertificate: Boolean(data.trustServerCertificate),
      }));
      setHasSqlPassword(Boolean(data.hasPassword));
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Não foi possível carregar configuração SQL Server');
    }
  };

  const carregarConfigEmail = async () => {
    try {
      const data = await SystemConfigService.getSmtpSettings();
      setSmtpConfig((curr) => ({
        ...curr,
        host: data.host || '',
        port: data.port || 587,
        secure: Boolean(data.secure),
        user: data.user || '',
        from: data.from || '',
        pass: '',
      }));
      setHasSmtpPassword(Boolean(data.hasPassword));
      if (!smtpTestEmail) {
        setSmtpTestEmail(data.from || '');
      }
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Não foi possível carregar configuração SMTP');
    }
  };

  const carregarTemplatesEmail = async () => {
    try {
      const data = await SystemConfigService.getEmailTemplates();
      if (data?.labels) {
        setEmailTemplateLabels(data.labels);
      }

      if (data?.templates) {
        setEmailTemplates(data.templates);
        const atual = data.templates[templateSelecionado] || { subject: '', html: '' };
        setTemplateSubject(atual.subject || '');
        setTemplateHtml(atual.html || '');
      }
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Nao foi possivel carregar templates de email');
    }
  };

  useEffect(() => {
    if (!canAccessSystemConfig) {
      return;
    }

    carregarUsuarios();
    carregarModulos();
    carregarConfigBanco();
    carregarConfigEmail();
    carregarTemplatesEmail();
  }, [canAccessSystemConfig]);

  useEffect(() => {
    const selected = emailTemplates[templateSelecionado] || { subject: '', html: '' };
    setTemplateSubject(selected.subject || '');
    setTemplateHtml(selected.html || '');
  }, [templateSelecionado, emailTemplates]);

  if (!canAccessSystemConfig) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCreateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();

    try {
      await UsuarioService.create(novoUsuario);
      setFeedback('Usuário cadastrado com sucesso');
      setNovoUsuario({ nome: '', email: '', dataNascimento: '', senha: '', perfil: 'ANALYST' });
      await carregarUsuarios();
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao cadastrar usuário');
    }
  };

  const handleToggleStatus = async (u: Usuario) => {
    limparMensagens();
    try {
      await UsuarioService.update(u.id, { status: !u.status });
      setFeedback(`Usuário ${u.status ? 'inativado' : 'ativado'} com sucesso`);
      await carregarUsuarios();
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao atualizar status do usuário');
    }
  };

  const handleDeleteUsuario = async (u: Usuario) => {
    limparMensagens();

    if (usuario?.id === u.id) {
      setErro('Você não pode excluir o próprio usuário logado');
      return;
    }

    const confirmou = window.confirm(`Tem certeza que deseja excluir o usuário ${u.nome}?`);
    if (!confirmou) {
      return;
    }

    try {
      await UsuarioService.delete(u.id);
      setFeedback('Usuário excluído com sucesso');
      await carregarUsuarios();
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao excluir usuário');
    }
  };

  const abrirModalAlterarSenha = (u: Usuario) => {
    limparMensagens();
    setUsuarioSenhaSelecionado(u);
    setNovaSenhaUsuario('');
    setShowSenhaModal(true);
  };

  const fecharModalAlterarSenha = () => {
    setShowSenhaModal(false);
    setUsuarioSenhaSelecionado(null);
    setNovaSenhaUsuario('');
  };

  const handleAlterarSenhaUsuario = async () => {
    limparMensagens();

    if (!usuarioSenhaSelecionado) {
      setErro('Usuário não selecionado para alteração de senha');
      return;
    }

    const novaSenha = String(novaSenhaUsuario || '');

    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSalvandoSenhaUsuario(true);
    try {
      await UsuarioService.updatePassword(usuarioSenhaSelecionado.id, novaSenha);
      setFeedback(`Senha de ${usuarioSenhaSelecionado.nome} alterada com sucesso`);
      fecharModalAlterarSenha();
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao alterar senha do usuário');
    } finally {
      setSalvandoSenhaUsuario(false);
    }
  };

  const handleSalvarModulos = async (perfil: string) => {
    limparMensagens();
    setSavingModules(true);
    try {
      await SystemConfigService.updateModuleVisibilityConfig(perfil, moduleVisibility[perfil]);
      setFeedback(`Módulos do perfil ${ROLE_LABELS[perfil as RolePerfil] || perfil} atualizados com sucesso`);
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao salvar módulos por perfil');
    } finally {
      setSavingModules(false);
    }
  };

  const perfisFixos = ['MASTER', 'ADMIN', 'ANALYST', 'MANAGER'];

  const handleCriarPerfilModulo = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();

    if (!novoPerfilModulo.trim()) {
      setErro('Informe o nome do novo perfil');
      return;
    }

    try {
      const response = await SystemConfigService.createModuleProfile(novoPerfilModulo.trim(), basePerfilNovoModulo);
      setModuleVisibility(response?.data || {});
      setNovoPerfilModulo('');
      setFeedback('Perfil de módulos criado com sucesso');
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao criar perfil de módulos');
    }
  };

  const handleExcluirPerfilModulo = async (perfil: string) => {
    limparMensagens();

    if (!window.confirm(`Deseja excluir o perfil ${perfil}?`)) {
      return;
    }

    try {
      const response = await SystemConfigService.deleteModuleProfile(perfil);
      setModuleVisibility(response?.data || {});
      setFeedback('Perfil de módulos excluído com sucesso');
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao excluir perfil de módulos');
    }
  };

  const handleSalvarSql = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();
    setSavingSql(true);

    try {
      await SystemConfigService.updateSqlServerSettings({
        ...sqlConfig,
        password: sqlConfig.password || undefined,
      });
      setFeedback('Configuração do SQL Server atualizada com sucesso');
      setSqlConfig((curr) => ({ ...curr, password: '' }));
      setHasSqlPassword(true);
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao salvar configuração SQL Server');
    } finally {
      setSavingSql(false);
    }
  };

  const handleSalvarSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();
    setSavingSmtp(true);

    try {
      await SystemConfigService.updateSmtpSettings({
        ...smtpConfig,
        pass: smtpConfig.pass || undefined,
      });
      setFeedback('Configuração SMTP atualizada com sucesso');
      setSmtpConfig((curr) => ({ ...curr, pass: '' }));
      setHasSmtpPassword(true);
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao salvar configuração SMTP');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestarSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();

    if (!smtpTestEmail.trim()) {
      setErro('Informe um email de destino para teste');
      return;
    }

    setTestingSmtp(true);
    try {
      await SystemConfigService.testSmtpSettings(smtpTestEmail.trim());
      setFeedback('Email de teste enviado com sucesso');
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao enviar email de teste');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSalvarTemplateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();

    if (!templateSubject.trim()) {
      setErro('Titulo do email e obrigatorio');
      return;
    }

    if (!templateHtml.trim()) {
      setErro('Conteudo do email e obrigatorio');
      return;
    }

    setSalvandoTemplate(true);
    try {
      await SystemConfigService.updateEmailTemplate(templateSelecionado, {
        subject: templateSubject,
        html: templateHtml,
      });
      setFeedback('Template de email salvo com sucesso');
      await carregarTemplatesEmail();
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao salvar template de email');
    } finally {
      setSalvandoTemplate(false);
    }
  };

  const handleRestaurarTemplateEmail = async () => {
    limparMensagens();

    const confirmou = window.confirm('Deseja restaurar este template para o padrao do sistema?');
    if (!confirmou) {
      return;
    }

    setRestaurandoTemplate(true);
    try {
      await SystemConfigService.restoreEmailTemplate(templateSelecionado);
      setFeedback('Template restaurado para o padrao com sucesso');
      await carregarTemplatesEmail();
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao restaurar template de email');
    } finally {
      setRestaurandoTemplate(false);
    }
  };

  const insertAroundSelection = (before: string, after: string = '') => {
    const textarea = templateEditorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const original = templateHtml;
    const selected = original.slice(start, end);
    const updated = `${original.slice(0, start)}${before}${selected}${after}${original.slice(end)}`;

    setTemplateHtml(updated);

    window.setTimeout(() => {
      textarea.focus();
      const caret = start + before.length + selected.length + after.length;
      textarea.setSelectionRange(caret, caret);
    }, 0);
  };

  const insertImageTag = () => {
    const imageUrl = window.prompt('Informe a URL da imagem para inserir no corpo do email:');
    if (!imageUrl) return;
    insertAroundSelection(`<img src="${imageUrl}" alt="Imagem do email" style="max-width:100%;height:auto;" />`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configuração do Sistema</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Gestão do perfil Master: módulos por perfil, usuários, senhas e banco de dados.
        </p>
      </div>

      {erro && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}
      {feedback && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{feedback}</div>}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(abas) as AbaSistema[]).map((aba) => (
          <button
            key={aba}
            type="button"
            onClick={() => {
              limparMensagens();
              setAbaAtiva(aba);
            }}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              abaAtiva === aba
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {abas[aba]}
          </button>
        ))}
      </div>

      {abaAtiva === 'usuarios' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Cadastrar usuário</h2>
            <form onSubmit={handleCreateUsuario} className="space-y-3">
              <input
                value={novoUsuario.nome}
                onChange={(e) => setNovoUsuario((curr) => ({ ...curr, nome: e.target.value }))}
                placeholder="Nome"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                required
              />
              <input
                type="email"
                value={novoUsuario.email}
                onChange={(e) => setNovoUsuario((curr) => ({ ...curr, email: e.target.value }))}
                placeholder="Email"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                required
              />
              <input
                type="date"
                value={novoUsuario.dataNascimento}
                onChange={(e) => setNovoUsuario((curr) => ({ ...curr, dataNascimento: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                required
              />
              <input
                type="password"
                value={novoUsuario.senha}
                onChange={(e) => setNovoUsuario((curr) => ({ ...curr, senha: e.target.value }))}
                placeholder="Senha"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                required
              />
              <select
                value={novoUsuario.perfil}
                onChange={(e) => setNovoUsuario((curr) => ({ ...curr, perfil: e.target.value as RolePerfil }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              >
                {(Object.keys(ROLE_LABELS) as RolePerfil[]).map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700"
              >
                Cadastrar
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Ativar/Inativar/Excluir usuários</h2>

            {carregandoUsuarios ? (
              <p className="text-sm text-slate-500">Carregando usuários...</p>
            ) : (
              <div className="space-y-2">
                {usuarios.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{u.nome}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{u.email} • {ROLE_LABELS[u.perfil as RolePerfil] || u.perfil}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirModalAlterarSenha(u)}
                          className="rounded-lg border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
                        >
                          Alterar senha
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                            u.status
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {u.status ? 'Inativar' : 'Ativar'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUsuario(u)}
                          className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {abaAtiva === 'modulos' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Criar perfil de módulos</h2>
            <form onSubmit={handleCriarPerfilModulo} className="grid gap-3 md:grid-cols-3">
              <input
                value={novoPerfilModulo}
                onChange={(e) => setNovoPerfilModulo(e.target.value.toUpperCase())}
                placeholder="Ex: SUPERVISOR"
                className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                required
              />
              <select
                value={basePerfilNovoModulo}
                onChange={(e) => setBasePerfilNovoModulo(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              >
                {Object.keys(moduleVisibility).map((perfil) => (
                  <option key={perfil} value={perfil}>{perfil}</option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700"
              >
                Criar perfil
              </button>
            </form>
          </div>

          {Object.keys(moduleVisibility).map((perfil) => (
            <div key={perfil} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Perfil {ROLE_LABELS[perfil as RolePerfil] || perfil}</h2>
                <div className="flex items-center gap-2">
                  {!perfisFixos.includes(perfil) ? (
                    <button
                      type="button"
                      onClick={() => handleExcluirPerfilModulo(perfil)}
                      className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
                    >
                      Excluir perfil
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={savingModules}
                    onClick={() => handleSalvarModulos(perfil)}
                    className="rounded-xl bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                  >
                    Salvar {ROLE_LABELS[perfil as RolePerfil] || perfil}
                  </button>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {MODULE_KEYS.map((moduleKey) => (
                  <label key={moduleKey} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(moduleVisibility[perfil]?.[moduleKey])}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setModuleVisibility((curr) => ({
                          ...curr,
                          [perfil]: {
                            ...curr[perfil],
                            [moduleKey]: checked,
                          },
                        }));
                      }}
                    />
                    <span className="text-slate-700 dark:text-slate-200">{MODULE_LABELS[moduleKey]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {abaAtiva === 'banco' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Configuração SQL Server</h2>
          <form onSubmit={handleSalvarSql} className="grid gap-3 md:grid-cols-2">
            <input
              value={sqlConfig.host}
              onChange={(e) => setSqlConfig((curr) => ({ ...curr, host: e.target.value }))}
              placeholder="Host"
              className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              required
            />
            <input
              type="number"
              value={sqlConfig.port}
              onChange={(e) => setSqlConfig((curr) => ({ ...curr, port: Number(e.target.value || 1433) }))}
              placeholder="Porta"
              className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              required
            />
            <input
              value={sqlConfig.database}
              onChange={(e) => setSqlConfig((curr) => ({ ...curr, database: e.target.value }))}
              placeholder="Database"
              className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              required
            />
            <input
              value={sqlConfig.user}
              onChange={(e) => setSqlConfig((curr) => ({ ...curr, user: e.target.value }))}
              placeholder="Usuário"
              className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              required
            />
            <input
              type="password"
              value={sqlConfig.password}
              onChange={(e) => setSqlConfig((curr) => ({ ...curr, password: e.target.value }))}
              placeholder={hasSqlPassword ? 'Nova senha (opcional)' : 'Senha'}
              className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 md:col-span-2"
            />

            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={sqlConfig.encrypt}
                onChange={(e) => setSqlConfig((curr) => ({ ...curr, encrypt: e.target.checked }))}
              />
              Conexão criptografada (encrypt)
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={sqlConfig.trustServerCertificate}
                onChange={(e) => setSqlConfig((curr) => ({ ...curr, trustServerCertificate: e.target.checked }))}
              />
              Confiar no certificado do servidor
            </label>

            <button
              type="submit"
              disabled={savingSql}
              className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:opacity-60 md:col-span-2"
            >
              {savingSql ? 'Salvando...' : 'Salvar configuração do banco'}
            </button>
          </form>
        </div>
      )}

      {abaAtiva === 'email' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Configuração SMTP</h2>
            <form onSubmit={handleSalvarSmtp} className="grid gap-3 md:grid-cols-2">
              <input
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig((curr) => ({ ...curr, host: e.target.value }))}
                placeholder="Host SMTP"
                className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                required
              />
              <input
                type="number"
                value={smtpConfig.port}
                onChange={(e) => setSmtpConfig((curr) => ({ ...curr, port: Number(e.target.value || 587) }))}
                placeholder="Porta SMTP"
                className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                required
              />
              <input
                value={smtpConfig.user}
                onChange={(e) => setSmtpConfig((curr) => ({ ...curr, user: e.target.value }))}
                placeholder="Usuário SMTP"
                className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                required
              />
              <input
                value={smtpConfig.from}
                onChange={(e) => setSmtpConfig((curr) => ({ ...curr, from: e.target.value }))}
                placeholder="Remetente (from)"
                className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                required
              />

              <input
                type="password"
                value={smtpConfig.pass}
                onChange={(e) => setSmtpConfig((curr) => ({ ...curr, pass: e.target.value }))}
                placeholder={hasSmtpPassword ? 'Nova senha SMTP (opcional)' : 'Senha SMTP'}
                className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 md:col-span-2"
              />

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 md:col-span-2">
                <input
                  type="checkbox"
                  checked={smtpConfig.secure}
                  onChange={(e) => setSmtpConfig((curr) => ({ ...curr, secure: e.target.checked }))}
                />
                Usar conexão segura (SMTP_SECURE)
              </label>

              <button
                type="submit"
                disabled={savingSmtp}
                className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:opacity-60 md:col-span-2"
              >
                {savingSmtp ? 'Salvando...' : 'Salvar configuração SMTP'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Testar envio de email</h2>
            <form onSubmit={handleTestarSmtp} className="space-y-3">
              <input
                type="email"
                value={smtpTestEmail}
                onChange={(e) => setSmtpTestEmail(e.target.value)}
                placeholder="Email de destino"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                required
              />

              <button
                type="submit"
                disabled={testingSmtp}
                className="w-full rounded-xl border border-primary-600 px-4 py-2 font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-60 dark:text-primary-300 dark:hover:bg-primary-900/20"
              >
                {testingSmtp ? 'Enviando teste...' : 'Enviar email de teste'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Templates de email automatico</h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Edite titulo e corpo dos emails automaticos. Voce pode usar variaveis como
              {' '}
              <strong>{'{{nome}}'}</strong>, <strong>{'{{email}}'}</strong>, <strong>{'{{codigo}}'}</strong>,
              {' '}
              <strong>{'{{nomeInstituicao}}'}</strong>, <strong>{'{{status}}'}</strong>, <strong>{'{{motivo}}'}</strong>.
            </p>

            <form onSubmit={handleSalvarTemplateEmail} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={templateSelecionado}
                  onChange={(e) => setTemplateSelecionado(e.target.value as EmailTemplateType)}
                  className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                >
                  {emailTemplateTypes.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {emailTemplateLabels[tipo] || tipo}
                    </option>
                  ))}
                </select>

                <input
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  placeholder="Titulo do email"
                  className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                  required
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Placeholders disponiveis para este template</h3>
                <div className="flex flex-wrap gap-2">
                  {(emailTemplatePlaceholders[templateSelecionado] || []).map((placeholder) => (
                    <button
                      key={placeholder}
                      type="button"
                      onClick={() => insertAroundSelection(placeholder)}
                      className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {placeholder}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => insertAroundSelection('<strong>', '</strong>')}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold dark:border-slate-700"
                >
                  Negrito
                </button>
                <button
                  type="button"
                  onClick={() => insertAroundSelection('<em>', '</em>')}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold dark:border-slate-700"
                >
                  Italico
                </button>
                <button
                  type="button"
                  onClick={() => insertAroundSelection('<h2>', '</h2>')}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold dark:border-slate-700"
                >
                  Titulo
                </button>
                <button
                  type="button"
                  onClick={() => insertAroundSelection('<p>', '</p>')}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold dark:border-slate-700"
                >
                  Paragrafo
                </button>
                <button
                  type="button"
                  onClick={() => insertAroundSelection('<ul><li>', '</li></ul>')}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold dark:border-slate-700"
                >
                  Lista
                </button>
                <button
                  type="button"
                  onClick={insertImageTag}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold dark:border-slate-700"
                >
                  Imagem
                </button>
              </div>

              <textarea
                ref={templateEditorRef}
                value={templateHtml}
                onChange={(e) => setTemplateHtml(e.target.value)}
                rows={12}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                placeholder="Corpo HTML do email"
                required
              />

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Preview</h3>
                <div
                  className="prose max-w-none text-sm dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: templateHtml || '<p>Sem conteudo para preview.</p>' }}
                />
              </div>

              <button
                type="submit"
                disabled={salvandoTemplate}
                className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {salvandoTemplate ? 'Salvando template...' : 'Salvar template de email'}
              </button>
              <button
                type="button"
                onClick={handleRestaurarTemplateEmail}
                disabled={restaurandoTemplate}
                className="ml-2 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {restaurandoTemplate ? 'Restaurando...' : 'Restaurar padrao'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showSenhaModal && usuarioSenhaSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Alterar senha</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{usuarioSenhaSelecionado.nome} ({usuarioSenhaSelecionado.email})</p>
              </div>
              <button
                type="button"
                onClick={fecharModalAlterarSenha}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAlterarSenhaUsuario();
              }}
              className="space-y-3"
            >
              <input
                type="password"
                value={novaSenhaUsuario}
                onChange={(e) => setNovaSenhaUsuario(e.target.value)}
                placeholder="Nova senha"
                minLength={6}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                required
              />

              <p className="text-xs text-slate-500 dark:text-slate-400">A senha deve ter pelo menos 6 caracteres.</p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={fecharModalAlterarSenha}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoSenhaUsuario}
                  className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {salvandoSenhaUsuario ? 'Salvando...' : 'Salvar senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
