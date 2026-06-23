import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UsuarioService } from '@/services/UsuarioService';
import { BrandMark } from '@/components/BrandMark';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUsuario, setToken } = useAuthStore();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'codigo'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [loadingForgot, setLoadingForgot] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const codigoTrimmed = codigo.trim();
  const codigoInformado = codigoTrimmed.length >= 6;

  const abrirModalEsqueciSenha = () => {
    setShowForgotPasswordModal(true);
    setForgotStep('email');
    setForgotEmail('');
    setCodigo('');
    setNovaSenha('');
    setError('');
    setSuccess('');
  };

  const fecharModalEsqueciSenha = () => {
    setShowForgotPasswordModal(false);
    setForgotStep('email');
    setCodigo('');
    setNovaSenha('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await UsuarioService.login({ email, senha });
      if (response.success) {
        const { accessToken, usuario } = response.data;
        setToken(accessToken);
        setUsuario(usuario);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingForgot(true);

    try {
      await UsuarioService.forgotPassword({ email: forgotEmail });
      setSuccess('Código enviado para seu email. Verifique sua caixa de entrada.');
      setForgotStep('codigo');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar código. Tente novamente.');
    } finally {
      setLoadingForgot(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingReset(true);

    if (!codigoInformado) {
      setError('Informe o código recebido para habilitar a alteração de senha');
      setLoadingReset(false);
      return;
    }

    if (!novaSenha || novaSenha.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      setLoadingReset(false);
      return;
    }

    try {
      const response = await UsuarioService.resetPassword({
        email: forgotEmail,
        codigo: codigoTrimmed,
        novaSenha,
      });
      setSuccess(response.message || 'Senha redefinida com sucesso. Faça login novamente.');
      setCodigo('');
      setNovaSenha('');
      setTimeout(() => {
        fecharModalEsqueciSenha();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao redefinir senha');
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex justify-center">
            <BrandMark showText={false} className="justify-center scale-150 origin-center" />
          </div>

          <p className="mt-4 text-center text-base font-medium text-slate-700 dark:text-slate-300">
            Sistema de Classificação Social
          </p>

          <div className="mt-6 text-center">
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Acesse o sistema com seu usuário e senha.</p>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 shadow-sm outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 font-semibold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={abrirModalEsqueciSenha}
              className="w-full text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              Esqueceu a senha?
            </button>
          </form>
        </div>
      </div>

      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={fecharModalEsqueciSenha}>
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recuperar senha</h3>
              <button
                type="button"
                onClick={fecharModalEsqueciSenha}
                className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            {forgotStep === 'email' ? (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">Informe o email para receber o código de confirmação.</p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Digite seu email cadastrado"
                  required
                />
                <button
                  type="submit"
                  disabled={loadingForgot}
                  className="w-full rounded-xl bg-primary-600 px-3 py-2 font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
                >
                  {loadingForgot ? 'Enviando código...' : 'Continuar'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">Digite o código recebido e defina sua nova senha.</p>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Código recebido por email"
                  required
                />
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  disabled={!codigoInformado}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Nova senha"
                  minLength={6}
                  required
                />
                {!codigoInformado ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Digite o código recebido para habilitar o campo de nova senha.
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={loadingReset || !codigoInformado}
                  className="w-full rounded-xl border border-primary-600 px-3 py-2 font-semibold text-primary-700 transition hover:bg-primary-50 disabled:opacity-60 dark:text-primary-300 dark:hover:bg-primary-900/20"
                >
                  {loadingReset ? 'Redefinindo...' : 'Redefinir senha'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep('email');
                    setCodigo('');
                    setNovaSenha('');
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Voltar
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
