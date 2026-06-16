export type RolePerfil = 'MASTER' | 'ADMIN' | 'ANALYST' | 'MANAGER';

export const SYSTEM_MODULE_KEYS = [
  'dashboard',
  'notas-fiscais',
  'classificacoes',
  'obras',
  'projetos',
  'programas',
  'instituicoes',
  'usuarios',
  'admin-cadastros',
  'configuracao-sistema',
] as const;

export type SystemModuleKey = (typeof SYSTEM_MODULE_KEYS)[number];

export type ModuleVisibilityByRole = Record<string, Record<SystemModuleKey, boolean>>;

export const DEFAULT_MODULE_VISIBILITY: ModuleVisibilityByRole = {
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
