-- Migração manual para PostgreSQL (caso o banco já exista)
-- 1) Renomeia usuarios para d_usuarios quando necessário
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'usuarios'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'd_usuarios'
  ) THEN
    ALTER TABLE public.usuarios RENAME TO d_usuarios;
  END IF;
END$$;

-- 2) Adiciona novas colunas de d_usuarios
ALTER TABLE IF EXISTS public.d_usuarios
  ADD COLUMN IF NOT EXISTS data_nascimento DATE,
  ADD COLUMN IF NOT EXISTS codigo_reset_senha VARCHAR(10),
  ADD COLUMN IF NOT EXISTS expira_reset_senha TIMESTAMP;

-- 3) Ajusta FKs para d_usuarios
ALTER TABLE IF EXISTS public.classificacoes_nf
  DROP CONSTRAINT IF EXISTS classificacoes_nf_usuario_id_fkey,
  ADD CONSTRAINT classificacoes_nf_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES public.d_usuarios(id);

ALTER TABLE IF EXISTS public.importacoes
  DROP CONSTRAINT IF EXISTS importacoes_usuario_id_fkey,
  ADD CONSTRAINT importacoes_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES public.d_usuarios(id);

ALTER TABLE IF EXISTS public.logs_auditoria
  DROP CONSTRAINT IF EXISTS logs_auditoria_usuario_id_fkey,
  ADD CONSTRAINT logs_auditoria_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES public.d_usuarios(id);

ALTER TABLE IF EXISTS public.alertas
  DROP CONSTRAINT IF EXISTS alertas_responsavel_id_fkey,
  ADD CONSTRAINT alertas_responsavel_id_fkey
    FOREIGN KEY (responsavel_id) REFERENCES public.d_usuarios(id);
