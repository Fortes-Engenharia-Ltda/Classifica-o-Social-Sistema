import React, { useEffect, useState } from 'react';
import { UsuarioService } from '@/services/UsuarioService';
import { Usuario } from '@/types';
import { Mail, Pencil, Plus, Search, X } from 'lucide-react';
import { ROLE_LABELS, RolePerfil } from '@/config/moduleVisibility';
import { useAuthStore } from '@/store/authStore';

const FORM_VAZIO = {
  nome: '',
  email: '',
  dataNascimento: '',
  perfil: 'ANALYST' as RolePerfil,
  status: true,
  senha: '',
  novaSenha: '',
};

export const Usuarios: React.FC = () => {
  const { usuario } = useAuthStore();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState('');
  const [feedback, setFeedback] = useState('');
  const [erro, setErro] = useState('');
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [modalTipo, setModalTipo] = useState<'novo' | 'editar' | null>(null);
  const [usuarioEdicaoId, setUsuarioEdicaoId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...FORM_VAZIO });

  const limparMensagens = () => { setErro(''); setFeedback(''); };

  const carregarUsuarios = async () => {
    setCarregando(true);
    try {
      const response = await UsuarioService.getAll(1, 500);
      setUsuarios(response?.data?.usuarios || []);
    } catch (e: any) {
      setErro(e?.response?.data?.message || 'Não foi possível carregar usuários');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarUsuarios(); }, []);

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase()),
  );

  const abrirNovo = () => {
    setForm({ ...FORM_VAZIO });
    setUsuarioEdicaoId(null);
    setModalTipo('novo');
    limparMensagens();
  };

  const abrirEditar = (u: Usuario) => {
    setUsuarioEdicaoId(u.id);
    setForm({
      nome: u.nome,
      email: u.email,
      dataNascimento: u.dataNascimento ? new Date(u.dataNascimento).toISOString().split('T')[0] : '',
      perfil: u.perfil,
      status: u.status,
      senha: '',
      novaSenha: '',
    });
    setModalTipo('editar');
    limparMensagens();
  };

  const fecharModal = () => {
    setModalTipo(null);
    setUsuarioEdicaoId(null);
    setForm({ ...FORM_VAZIO });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();
    try {
      await UsuarioService.create({
        nome: form.nome,
        email: form.email,
        dataNascimento: form.dataNascimento,
        senha: form.senha,
        perfil: form.perfil,
        status: true,
      });
      fecharModal();
      setFeedback('Usuário criado com sucesso. Email de boas-vindas enviado ao colaborador.');
      await carregarUsuarios();
    } catch (error: any) {
      setErro(error?.response?.data?.message || 'Erro ao criar usuário');
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    limparMensagens();
    if (!usuarioEdicaoId) return;

    if (usuario?.id === usuarioEdicaoId && form.status === false) {
      setErro('Você não pode inativar o próprio usuário logado');
      return;
    }

    try {
      await UsuarioService.update(usuarioEdicaoId, {
        nome: form.nome,
        dataNascimento: form.dataNascimento,
        perfil: form.perfil,
        status: form.status,
      });

      if (form.novaSenha.trim()) {
        await UsuarioService.updatePassword(usuarioEdicaoId, form.novaSenha.trim());
      }

      setFeedback('Usuário atualizado com sucesso');
      fecharModal();
      await carregarUsuarios();
    } catch (error: any) {
      setErro(error?.response?.data?.message || 'Erro ao atualizar usuário');
    }
  };

  const handleToggleStatus = async (u: Usuario) => {
    limparMensagens();
    if (usuario?.id === u.id && u.status) {
      setErro('Você não pode inativar o próprio usuário logado');
      return;
    }
    try {
      await UsuarioService.update(u.id, { status: !u.status });
      setFeedback(`Usuário ${u.status ? 'inativado' : 'ativado'} com sucesso`);
      await carregarUsuarios();
    } catch (error: any) {
      setErro(error?.response?.data?.message || 'Erro ao atualizar status');
    }
  };

  const handleEnviarResetSenha = async () => {
    if (!form.email) return;
    setEnviandoEmail(true);
    limparMensagens();
    try {
      await UsuarioService.forgotPassword({ email: form.email });
      setFeedback(`Email de redefinição de senha enviado para ${form.nome}`);
    } catch (error: any) {
      setErro(error?.response?.data?.message || 'Erro ao enviar email de redefinição');
    } finally {
      setEnviandoEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Usuários</h1>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700"
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>

      {(feedback || erro) && (
        <div className="space-y-2">
          {feedback && <p className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800">{feedback}</p>}
          {erro && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">{erro}</p>}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        {/* Campo de busca */}
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por nome ou email..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        {carregando ? (
          <p className="text-sm text-slate-500">Carregando usuários...</p>
        ) : usuariosFiltrados.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum usuário encontrado.</p>
        ) : (
          <div className="space-y-2">
            {usuariosFiltrados.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{u.nome}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {u.email} • {ROLE_LABELS[u.perfil as RolePerfil] || u.perfil} •{' '}
                    <span className={u.status ? 'text-green-600' : 'text-red-500'}>
                      {u.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                    onClick={() => abrirEditar(u)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal unificado: Novo / Editar */}
      {modalTipo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {modalTipo === 'novo' ? 'Novo usuário' : 'Editar usuário'}
              </h2>
              <button type="button" onClick={fecharModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={modalTipo === 'novo' ? handleCreate : handleEditar} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Nome</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm((c) => ({ ...c, nome: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Email</label>
                  {modalTipo === 'novo' ? (
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                      required
                    />
                  ) : (
                    <>
                      <input
                        type="email"
                        value={form.email}
                        disabled
                        className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      />
                      <p className="mt-1 text-xs text-slate-500">Email não pode ser alterado.</p>
                    </>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    value={form.dataNascimento}
                    onChange={(e) => setForm((c) => ({ ...c, dataNascimento: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Perfil</label>
                  <select
                    value={form.perfil}
                    onChange={(e) => setForm((c) => ({ ...c, perfil: e.target.value as RolePerfil }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="ANALYST">Analista</option>
                    <option value="MANAGER">Gestor</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MASTER">Master</option>
                  </select>
                </div>
              </div>

              {modalTipo === 'editar' && (
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.status}
                    onChange={(e) => setForm((c) => ({ ...c, status: e.target.checked }))}
                  />
                  Usuário ativo
                </label>
              )}

              {modalTipo === 'novo' ? (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Senha inicial
                  </label>
                  <input
                    type="password"
                    value={form.senha}
                    onChange={(e) => setForm((c) => ({ ...c, senha: e.target.value }))}
                    placeholder="Senha inicial do usuário"
                    minLength={6}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Um email de boas-vindas será enviado automaticamente ao colaborador.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Alterar senha (opcional)
                    </label>
                    <input
                      type="password"
                      value={form.novaSenha}
                      onChange={(e) => setForm((c) => ({ ...c, novaSenha: e.target.value }))}
                      placeholder="Nova senha (deixe em branco para manter)"
                      minLength={6}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={enviandoEmail}
                    onClick={handleEnviarResetSenha}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary-300 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100 disabled:opacity-60 dark:bg-primary-900/20 dark:text-primary-300"
                  >
                    <Mail size={14} />
                    {enviandoEmail ? 'Enviando...' : 'Enviar email de redefinição de senha'}
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700"
                >
                  {modalTipo === 'novo' ? 'Criar usuário' : 'Salvar alterações'}
                </button>
                <button
                  type="button"
                  onClick={fecharModal}
                  className="rounded-lg bg-slate-200 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
