CREATE TABLE IF NOT EXISTS "d_orcado_nao_orcado" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50),
    "nome" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "d_orcado_nao_orcado_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "d_orcado_nao_orcado"
    ADD COLUMN IF NOT EXISTS "codigo" VARCHAR(50);

ALTER TABLE "d_orcado_nao_orcado"
    ADD COLUMN IF NOT EXISTS "status" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "d_orcado_nao_orcado"
    ADD COLUMN IF NOT EXISTS "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "d_orcado_nao_orcado"
    ADD COLUMN IF NOT EXISTS "data_atualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "d_orcado_nao_orcado_codigo_key"
    ON "d_orcado_nao_orcado"("codigo");

CREATE UNIQUE INDEX IF NOT EXISTS "d_orcado_nao_orcado_nome_key"
    ON "d_orcado_nao_orcado"("nome");

CREATE INDEX IF NOT EXISTS "d_orcado_nao_orcado_status_idx"
    ON "d_orcado_nao_orcado"("status");

INSERT INTO "d_orcado_nao_orcado" ("codigo", "nome", "status", "data_criacao", "data_atualizacao") VALUES
('ORCADO', 'Orçado', true, NOW(), NOW()),
('NAO_ORCADO', 'Não Orçado', true, NOW(), NOW())
ON CONFLICT ("nome") DO UPDATE SET
    "codigo" = EXCLUDED."codigo",
    "status" = EXCLUDED."status",
    "data_atualizacao" = NOW();
