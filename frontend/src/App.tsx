import React, { Suspense, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

// Pages
const Login = React.lazy(() => import('@/pages/Login').then((module) => ({ default: module.Login })));
const Dashboard = React.lazy(() => import('@/pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const NotasFiscais = React.lazy(() => import('@/pages/NotasFiscais').then((module) => ({ default: module.NotasFiscais })));
const Obras = React.lazy(() => import('@/pages/Obras').then((module) => ({ default: module.Obras })));
const Projetos = React.lazy(() => import('@/pages/Projetos').then((module) => ({ default: module.Projetos })));
const Programas = React.lazy(() => import('@/pages/Programas').then((module) => ({ default: module.Programas })));
const Classificacoes = React.lazy(() => import('@/pages/Classificacoes').then((module) => ({ default: module.Classificacoes })));
const Usuarios = React.lazy(() => import('@/pages/Usuarios').then((module) => ({ default: module.Usuarios })));
const NotFound = React.lazy(() => import('@/pages/NotFound').then((module) => ({ default: module.NotFound })));
const AdminCadastros = React.lazy(() => import('@/pages/AdminCadastros').then((module) => ({ default: module.AdminCadastros })));
const CadastrosInstituicoes = React.lazy(() => import('@/pages/CadastrosInstituicoes').then((module) => ({ default: module.CadastrosInstituicoes })));
const Instituicoes = React.lazy(() => import('@/pages/Instituicoes').then((module) => ({ default: module.Instituicoes })));
const ConfiguracaoSistema = React.lazy(() => import('@/pages/ConfiguracaoSistema').then((module) => ({ default: module.ConfiguracaoSistema })));

// Components
import { ProtectedLayout } from '@/components/ProtectedLayout';

// Styles
import '@/styles/globals.css';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  const { darkMode } = useUIStore();
  const { usuario, setUsuario } = useAuthStore();

  // Initialize dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load usuario from localStorage
  useEffect(() => {
    const savedUsuario = localStorage.getItem('usuario');
    if (savedUsuario && !usuario) {
      try {
        setUsuario(JSON.parse(savedUsuario));
      } catch (error) {
        localStorage.removeItem('usuario');
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
              Carregando...
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/notas-fiscais"
              element={
                <ProtectedLayout>
                  <NotasFiscais />
                </ProtectedLayout>
              }
            />
            <Route
              path="/obras"
              element={
                <ProtectedLayout>
                  <Obras />
                </ProtectedLayout>
              }
            />
            <Route
              path="/projetos"
              element={
                <ProtectedLayout>
                  <Projetos />
                </ProtectedLayout>
              }
            />
            <Route
              path="/programas"
              element={
                <ProtectedLayout>
                  <Programas />
                </ProtectedLayout>
              }
            />
            <Route
              path="/classificacoes"
              element={
                <ProtectedLayout>
                  <Classificacoes />
                </ProtectedLayout>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedLayout>
                  <Usuarios />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin-cadastros"
              element={
                <ProtectedLayout>
                  <AdminCadastros />
                </ProtectedLayout>
              }
            />
            <Route
              path="/instituicoes"
              element={
                <ProtectedLayout>
                  <Instituicoes />
                </ProtectedLayout>
              }
            />
            <Route
              path="/configuracao-sistema"
              element={
                <ProtectedLayout>
                  <ConfiguracaoSistema />
                </ProtectedLayout>
              }
            />
            <Route
              path="/cadastros"
              element={<CadastrosInstituicoes />}
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
};
