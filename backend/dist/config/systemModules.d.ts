export type RolePerfil = 'MASTER' | 'ADMIN' | 'ANALYST' | 'MANAGER';
export declare const SYSTEM_MODULE_KEYS: readonly ["dashboard", "notas-fiscais", "classificacoes", "obras", "projetos", "programas", "instituicoes", "usuarios", "admin-cadastros", "configuracao-sistema"];
export type SystemModuleKey = (typeof SYSTEM_MODULE_KEYS)[number];
export type ModuleVisibilityByRole = Record<string, Record<SystemModuleKey, boolean>>;
export declare const DEFAULT_MODULE_VISIBILITY: ModuleVisibilityByRole;
//# sourceMappingURL=systemModules.d.ts.map