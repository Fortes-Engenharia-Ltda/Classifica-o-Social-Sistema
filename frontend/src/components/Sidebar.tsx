import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  Tags,
  Users,
  X,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { DevelopedBy } from './BrandMark';
import { DEFAULT_MODULE_VISIBILITY, SystemModuleKey } from '@/config/moduleVisibility';
import { SystemConfigService } from '@/services/SystemConfigService';

export const Sidebar: React.FC = () => {
  const { sidebarOpen, setSidebarOpen, darkMode } = useUIStore();
  const { usuario } = useAuthStore();
  const location = useLocation();
  const expandedSidebarClass = 'w-64 sm:w-72';

  const [visibleModules, setVisibleModules] = useState<Record<SystemModuleKey, boolean>>(
    DEFAULT_MODULE_VISIBILITY[usuario?.perfil || 'ANALYST'],
  );

  useEffect(() => {
    const fallback = DEFAULT_MODULE_VISIBILITY[usuario?.perfil || 'ANALYST'];
    setVisibleModules(fallback);

    SystemConfigService.getVisibleModulesForCurrentUser()
      .then((modules) => {
        setVisibleModules({ ...fallback, ...modules });
      })
      .catch(() => {
        setVisibleModules(fallback);
      });
  }, [usuario?.perfil]);

  const menuItems = useMemo(
    () => [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' as SystemModuleKey },
      { path: '/notas-fiscais', label: 'Notas Fiscais', icon: FileText, module: 'notas-fiscais' as SystemModuleKey },
      { path: '/projetos', label: 'Projetos', icon: ClipboardList, module: 'projetos' as SystemModuleKey },
      { path: '/instituicoes', label: 'Instituições', icon: Building2, module: 'instituicoes' as SystemModuleKey },
      { path: '/usuarios', label: 'Usuários', icon: Users, module: 'usuarios' as SystemModuleKey },
      { path: '/admin-cadastros', label: 'Administração', icon: Tags, module: 'admin-cadastros' as SystemModuleKey },
      {
        path: '/configuracao-sistema',
        label: 'Configuração do Sistema',
        icon: Settings,
        module: 'configuracao-sistema' as SystemModuleKey,
      },
    ],
    [],
  );

  const filteredItems = menuItems.filter((item) => visibleModules[item.module]);

  return (
    <>
      <aside
        className={`fixed left-0 top-16 z-50 h-[calc(100vh-64px)] overflow-hidden border-r shadow-2xl transition-all duration-300 ${
          darkMode
            ? 'border-slate-800 bg-slate-950 text-white'
            : 'border-slate-200/80 bg-white text-slate-900'
        } ${sidebarOpen ? expandedSidebarClass : 'w-14 sm:w-16'}`}
      >
        <div className="flex h-full flex-col">
          <nav className="space-y-1 p-2 sm:p-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`group flex w-full items-center rounded-xl py-2.5 transition-all ${
                sidebarOpen
                  ? 'justify-between px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                  : 'justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
              title={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
            >
              {sidebarOpen ? (
                <>
                  <span className="text-sm font-medium">Menu</span>
                  <X size={18} className="shrink-0" />
                </>
              ) : (
                <Menu size={18} className="shrink-0" />
              )}
            </button>

            {filteredItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`group flex items-center rounded-xl py-2.5 transition-all ${
                  sidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
                } ${
                  location.pathname === item.path
                    ? darkMode
                      ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-950/30'
                      : 'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-lg shadow-primary-300/30'
                    : darkMode
                      ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon size={18} className="shrink-0" />
                {sidebarOpen ? <span className="text-xs sm:text-sm font-medium truncate">{item.label}</span> : null}
              </Link>
            ))}
          </nav>

          {sidebarOpen ? (
            <div className={`mt-auto border-t p-4 ${darkMode ? 'border-white/10' : 'border-slate-200/80'}`}>
              <DevelopedBy inline className="flex-col" />
            </div>
          ) : null}
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 top-16 z-40 bg-slate-950/35 backdrop-blur-[1px] sm:hidden"
        />
      ) : null}
    </>
  );
};
