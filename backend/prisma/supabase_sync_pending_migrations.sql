ALTER TABLE "instituicoes_sociais"
ADD COLUMN IF NOT EXISTS "historico_finalidade_osc" TEXT,
ADD COLUMN IF NOT EXISTS "principais_acoes_proponente" TEXT,
ADD COLUMN IF NOT EXISTS "publico_alvo_proponente" TEXT,
ADD COLUMN IF NOT EXISTS "regiao_alcance_bairros" TEXT,
ADD COLUMN IF NOT EXISTS "infraestrutura_proponente" TEXT,
ADD COLUMN IF NOT EXISTS "termo_anexo" TEXT;

ALTER TABLE "obras"
ADD COLUMN IF NOT EXISTS "id_centro_custo" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "id_un" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "un" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "descricao" TEXT,
ADD COLUMN IF NOT EXISTS "projeto" VARCHAR(200),
ADD COLUMN IF NOT EXISTS "local" VARCHAR(200),
ADD COLUMN IF NOT EXISTS "cliente" VARCHAR(150),
ADD COLUMN IF NOT EXISTS "gerente" VARCHAR(120),
ADD COLUMN IF NOT EXISTS "gestor" VARCHAR(120);

ALTER TABLE "projetos"
ADD COLUMN IF NOT EXISTS "imagem" TEXT,
ADD COLUMN IF NOT EXISTS "publico_alvo" VARCHAR(200),
ADD COLUMN IF NOT EXISTS "instituicao_id" INTEGER;

ALTER TABLE "notas_fiscais"
ADD COLUMN IF NOT EXISTS "action_code" INTEGER,
ADD COLUMN IF NOT EXISTS "classificacao_conta_id" INTEGER;

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

CREATE INDEX IF NOT EXISTS "projetos_instituicao_id_idx" ON "projetos"("instituicao_id");
CREATE INDEX IF NOT EXISTS "classificacao_contas_status_idx" ON "classificacao_contas"("status");
CREATE INDEX IF NOT EXISTS "classificacao_contas_orcado_nao_orcado_id_idx" ON "classificacao_contas"("orcado_nao_orcado_id");
CREATE INDEX IF NOT EXISTS "notas_fiscais_classificacao_conta_id_idx" ON "notas_fiscais"("classificacao_conta_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projetos_instituicao_id_fkey'
  ) THEN
    ALTER TABLE "projetos"
    ADD CONSTRAINT "projetos_instituicao_id_fkey"
    FOREIGN KEY ("instituicao_id") REFERENCES "instituicoes_sociais"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notas_fiscais_classificacao_conta_id_fkey'
  ) THEN
    ALTER TABLE "notas_fiscais"
    ADD CONSTRAINT "notas_fiscais_classificacao_conta_id_fkey"
    FOREIGN KEY ("classificacao_conta_id") REFERENCES "classificacao_contas"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
