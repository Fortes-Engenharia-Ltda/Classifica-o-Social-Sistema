ALTER TABLE "projetos"
ADD COLUMN "publico_alvo" VARCHAR(200);

ALTER TABLE "projetos"
ADD COLUMN "instituicao_id" INTEGER;

CREATE INDEX "projetos_instituicao_id_idx" ON "projetos"("instituicao_id");

ALTER TABLE "projetos"
ADD CONSTRAINT "projetos_instituicao_id_fkey"
FOREIGN KEY ("instituicao_id") REFERENCES "instituicoes_sociais"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
