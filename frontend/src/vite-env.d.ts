/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_COMPANY_NAME?: string;
  readonly VITE_COMPANY_LOGO_LIGHT?: string;
  readonly VITE_COMPANY_LOGO_DARK?: string;
  readonly VITE_COMPANY_LOGO_ALT?: string;
  readonly VITE_DEV_BY_LABEL?: string;
  readonly VITE_DEV_LOGO_LIGHT?: string;
  readonly VITE_DEV_LOGO_DARK?: string;
  readonly VITE_DEV_LOGO_ALT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}