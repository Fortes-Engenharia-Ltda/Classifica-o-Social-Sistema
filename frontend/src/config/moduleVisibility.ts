export type RolePerfil = 'MASTER' | 'ADMIN' | 'ANALYST' | 'MANAGER';

export type SystemModuleKey =
  | 'dashboard'
  | 'notas-fiscais'
  | 'classificacoes'
  | 'obras'
  | 'projetos'
  | 'programas'
  | 'instituicoes'
  | 'usuarios'
  | 'admin-cadastros'
  | 'configuracao-sistema';

export const MODULE_LABELS: Record<SystemModuleKey, string> = {
  dashboard: 'Dashboard',
  'notas-fiscais': 'Notas Fiscais',
  classificacoes: 'Classificações',
  obras: 'Obras',
  projetos: 'Projetos',
  programas: 'Programas',
  instituicoes: 'Instituições',
  usuarios: 'Usuários',
  'admin-cadastros': 'Administração',
  'configuracao-sistema': 'Configuração do Sistema',
};

export const MODULE_KEYS = Object.keys(MODULE_LABELS) as SystemModuleKey[];

export const ROLE_LABELS: Record<RolePerfil, string> = {
  MASTER: 'Master',
  ADMIN: 'Admin',
  ANALYST: 'Analista',
  MANAGER: 'Gestor',
};

export const DEFAULT_MODULE_VISIBILITY: Record<RolePerfil, Record<SystemModuleKey, boolean>> = {
  MASTER: {
    dashboard: true,
    'notas-fiscais': true,
    classificacoes: true,
    obras: true,
    projetos: true,
    programas: true,
    instituicoes: true,
    usuarios: true,
    'admin-cadastros': true,
    'configuracao-sistema': true,
  },
  ADMIN: {
    dashboard: true,
    'notas-fiscais': true,
    classificacoes: true,
    obras: true,
    projetos: true,
    programas: true,
    instituicoes: true,
    usuarios: true,
    'admin-cadastros': true,
    'configuracao-sistema': false,
  },
  ANALYST: {
    dashboard: true,
    'notas-fiscais': true,
    classificacoes: true,
    obras: false,
    projetos: false,
    programas: false,
    instituicoes: true,
    usuarios: false,
    'admin-cadastros': false,
    'configuracao-sistema': false,
  },
  MANAGER: {
    dashboard: true,
    'notas-fiscais': true,
    classificacoes: true,
    obras: true,
    projetos: true,
    programas: true,
    instituicoes: true,
    usuarios: true,
    'admin-cadastros': true,
    'configuracao-sistema': true,
  },
};
