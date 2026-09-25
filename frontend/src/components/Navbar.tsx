import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, KeyRound, LogOut, Moon, Save, Sun, Trash2, User, UserCog, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { UsuarioService } from '@/services/UsuarioService';
import { BrandMark } from './BrandMark';

export const Navbar: React.FC = () => {
  const { usuario, setUsuario, logout } = useAuthStore();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [nome, setNome] = useState(usuario?.nome || '');
  const [novaSenha, setNovaSenha] = useState('');
  const [codigoSenha, setCodigoSenha] = useState('');
  const [codigoEnviadoSenha, setCodigoEnviadoSenha] = useState(false);
  const [enviandoCodigoSenha, setEnviandoCodigoSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNome(usuario?.nome || '');

    if (!usuario?.id) {
      return;
    }

    const savedPhoto = localStorage.getItem(`profile-photo:${usuario.id}`);
    if (savedPhoto && !usuario.fotoPerfil) {
      setUsuario({ ...usuario, fotoPerfil: savedPhoto });
    }
  }, [usuario?.id, usuario?.nome, usuario?.email]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !usuario) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || '');
      if (!base64) {
        return;
      }

      localStorage.setItem(`profile-photo:${usuario.id}`, base64);
      setUsuario({ ...usuario, fotoPerfil: base64 });
      setSucesso('Foto do perfil atualizada com sucesso');
      setErro('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (!usuario) {
      return;
    }

    const confirmed = window.confirm('Deseja excluir a foto do perfil?');
    if (!confirmed) {
      return;
    }

    localStorage.removeItem(`profile-photo:${usuario.id}`);
    setUsuario({ ...usuario, fotoPerfil: undefined });
    setSucesso('Foto do perfil removida com sucesso');
    setErro('');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    try {
      const response = await UsuarioService.updateMyProfile({ nome });
      const updatedUser = response?.data;
      if (updatedUser && usuario) {
        setUsuario({ ...usuario, ...updatedUser, fotoPerfil: usuario.fotoPerfil });
      }
      setSucesso('Perfil atualizado com sucesso');
      setShowEditProfile(false);
    } catch (error: any) {
      setErro(error?.response?.data?.message || 'Erro ao atualizar perfil');
    }
  };

  const handleSolicitarCodigoSenha = async () => {
    if (!usuario?.email) {
      setErro('Email do usuário não encontrado para enviar o código');
      return;
    }

    setErro('');
    setSucesso('');
    setEnviandoCodigoSenha(true);

    try {
      await UsuarioService.forgotPassword({ email: usuario.email });
      setCodigoEnviadoSenha(true);
      setSucesso('Código enviado para o seu email. Verifique a caixa de entrada.');
    } catch (error: any) {
      setErro(error?.response?.data?.message || 'Erro ao enviar código de confirmação');
    } finally {
      setEnviandoCodigoSenha(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!usuario?.email) {
      setErro('Email do usuário não encontrado para redefinir senha');
      return;
    }

    if (!codigoEnviadoSenha) {
      setErro('Solicite o código por email antes de alterar a senha');
      return;
    }

    if (codigoSenha.trim().length < 6) {
      setErro('Informe o código recebido para habilitar a alteração da senha');
      return;
    }

    try {
      await UsuarioService.resetPassword({
        email: usuario.email,
        codigo: codigoSenha,
        novaSenha,
      });
      setNovaSenha('');
      setCodigoSenha('');
      setCodigoEnviadoSenha(false);
      setSucesso('Senha atualizada com sucesso');
      setShowEditPassword(false);
    } catch (error: any) {
      setErro(error?.response?.data?.message || 'Erro ao atualizar senha');
    }
  };

  return (
    <nav className="fixed top-0 right-0 left-0 h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.03)] z-40 dark:border-slate-800 dark:bg-slate-950/85">
      <div className="h-full px-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3">
          <BrandMark compact showText={false} className="scale-110 origin-left" />
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white sm:text-sm">Classificação Social</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">Sistema corporativo de NF</p>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-primary-300 hover:text-primary-700 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Alternar tema"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="flex items-center gap-4" ref={menuRef}>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Bem-vindo, {usuario?.nome}!</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{usuario?.perfil}</p>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md"
              title="Abrir perfil"
            >
              {usuario?.fotoPerfil ? (
                <img src={usuario.fotoPerfil} alt="Foto de perfil" className="h-full w-full object-cover" />
              ) : (
                <User size={18} />
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-16 top-14 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    {usuario?.fotoPerfil ? (
                      <img src={usuario.fotoPerfil} alt="Foto de perfil" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        <User size={22} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{usuario?.nome}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{usuario?.email}</p>
                    <p className="mt-1 text-xs font-semibold text-primary-700 dark:text-primary-300">Perfil: {usuario?.perfil}</p>
                  </div>
                </div>

                {(erro || sucesso) && (
                  <div className={`mt-3 rounded-xl px-3 py-2 text-xs ${erro ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {erro || sucesso}
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    <Camera size={16} />
                    Alterar foto
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
                  </label>

                  {usuario?.fotoPerfil && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex w-full items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={16} />
                      Excluir foto
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowEditProfile(true);
                      setShowEditPassword(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <UserCog size={16} />
                    Alterar nome
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowEditPassword(true);
                      setShowEditProfile(false);
                      setCodigoEnviadoSenha(false);
                      setCodigoSenha('');
                      setNovaSenha('');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <KeyRound size={16} />
                    Trocar senha
                  </button>
                </div>

                {showEditProfile && (
                  <form onSubmit={handleUpdateProfile} className="mt-4 space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <div className="relative">
                      <User size={14} className="absolute left-2 top-2.5 text-slate-400" />
                      <input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Nome"
                        className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      O email do usuário é fixo e não pode ser alterado.
                    </p>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700">
                        <span className="inline-flex items-center gap-1"><Save size={14} /> Salvar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEditProfile(false)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </form>
                )}

                {showEditPassword && (
                  <form onSubmit={handleUpdatePassword} className="mt-4 space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={handleSolicitarCodigoSenha}
                      disabled={enviandoCodigoSenha}
                      className="w-full rounded-lg border border-primary-600 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-60 dark:text-primary-300 dark:hover:bg-primary-900/20"
                    >
                      {enviandoCodigoSenha ? 'Enviando código...' : (codigoEnviadoSenha ? 'Reenviar código' : 'Enviar código por email')}
                    </button>
                    <input
                      type="text"
                      value={codigoSenha}
                      onChange={(e) => setCodigoSenha(e.target.value)}
                      placeholder="Código recebido por email"
                      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                      required
                    />
                    <input
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Nova senha"
                      minLength={6}
                      disabled={!codigoEnviadoSenha || codigoSenha.trim().length < 6}
                      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                      required
                    />
                    {!codigoEnviadoSenha || codigoSenha.trim().length < 6 ? (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Digite o código recebido para habilitar o campo de nova senha.
                      </p>
                    ) : null}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={!codigoEnviadoSenha || codigoSenha.trim().length < 6}
                        className="flex-1 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                      >
                        <span className="inline-flex items-center gap-1"><Save size={14} /> Salvar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditPassword(false);
                          setCodigoEnviadoSenha(false);
                          setCodigoSenha('');
                          setNovaSenha('');
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-red-300 hover:text-red-600 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
