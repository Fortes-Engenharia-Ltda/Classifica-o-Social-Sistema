CREATE TABLE IF NOT EXISTS "classificacao_contas" (
  "id" SERIAL PRIMARY KEY,
  "codigo_acao" INTEGER NOT NULL,
  "nome" VARCHAR(120) NOT NULL,
  "orcado_nao_orcado_id" INTEGER NOT NULL,
  "status" BOOLEAN NOT NULL DEFAULT true,
  "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "data_atualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "classificacao_contas_codigo_acao_key" UNIQUE ("codigo_acao"),
  CONSTRAINT "classificacao_contas_orcado_nao_orcado_id_fkey"
    FOREIGN KEY ("orcado_nao_orcado_id")
    REFERENCES "d_orcado_nao_orcado"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

ALTER TABLE "notas_fiscais"
ADD COLUMN IF NOT EXISTS "classificacao_conta_id" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notas_fiscais_classificacao_conta_id_fkey'
  ) THEN
    ALTER TABLE "notas_fiscais"
    ADD CONSTRAINT "notas_fiscais_classificacao_conta_id_fkey"
    FOREIGN KEY ("classificacao_conta_id")
    REFERENCES "classificacao_contas"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "classificacao_contas_status_idx" ON "classificacao_contas"("status");
CREATE INDEX IF NOT EXISTS "classificacao_contas_orcado_nao_orcado_id_idx" ON "classificacao_contas"("orcado_nao_orcado_id");
CREATE INDEX IF NOT EXISTS "notas_fiscais_classificacao_conta_id_idx" ON "notas_fiscais"("classificacao_conta_id");
