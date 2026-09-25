-- Add FK columns to notas_fiscais for proper relationships
ALTER TABLE "notas_fiscais"
ADD COLUMN IF NOT EXISTS "orcado_nao_orcado_id" INTEGER,
ADD COLUMN IF NOT EXISTS "programa_id" INTEGER,
ADD COLUMN IF NOT EXISTS "instituicao_id" INTEGER,
ADD COLUMN IF NOT EXISTS "projeto_id" INTEGER,
ADD COLUMN IF NOT EXISTS "classificacao_att_id" INTEGER,
ADD COLUMN IF NOT EXISTS "publico_alvo_id" INTEGER;

-- Add foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_orcado_nao_orcado_id_fkey'
  ) THEN
    ALTER TABLE "notas_fiscais"
    ADD CONSTRAINT "notas_fiscais_orcado_nao_orcado_id_fkey"
    FOREIGN KEY ("orcado_nao_orcado_id") REFERENCES "d_orcado_nao_orcado"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_programa_id_fkey'
  ) THEN
    ALTER TABLE "notas_fiscais"
    ADD CONSTRAINT "notas_fiscais_programa_id_fkey"
    FOREIGN KEY ("programa_id") REFERENCES "programas"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_instituicao_id_fkey'
  ) THEN
    ALTER TABLE "notas_fiscais"
    ADD CONSTRAINT "notas_fiscais_instituicao_id_fkey"
    FOREIGN KEY ("instituicao_id") REFERENCES "instituicoes_sociais"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_projeto_id_fkey'
  ) THEN
    ALTER TABLE "notas_fiscais"
    ADD CONSTRAINT "notas_fiscais_projeto_id_fkey"
    FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_classificacao_att_id_fkey'
  ) THEN
    ALTER TABLE "notas_fiscais"
    ADD CONSTRAINT "notas_fiscais_classificacao_att_id_fkey"
    FOREIGN KEY ("classificacao_att_id") REFERENCES "classificacoes"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_publico_alvo_id_fkey'
  ) THEN
    ALTER TABLE "notas_fiscais"
    ADD CONSTRAINT "notas_fiscais_publico_alvo_id_fkey"
    FOREIGN KEY ("publico_alvo_id") REFERENCES "publicos_alvo"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS "notas_fiscais_orcado_nao_orcado_id_idx" ON "notas_fiscais"("orcado_nao_orcado_id");
CREATE INDEX IF NOT EXISTS "notas_fiscais_programa_id_idx" ON "notas_fiscais"("programa_id");
CREATE INDEX IF NOT EXISTS "notas_fiscais_instituicao_id_idx" ON "notas_fiscais"("instituicao_id");
CREATE INDEX IF NOT EXISTS "notas_fiscais_projeto_id_idx" ON "notas_fiscais"("projeto_id");
CREATE INDEX IF NOT EXISTS "notas_fiscais_classificacao_att_id_idx" ON "notas_fiscais"("classificacao_att_id");
CREATE INDEX IF NOT EXISTS "notas_fiscais_publico_alvo_id_idx" ON "notas_fiscais"("publico_alvo_id");
