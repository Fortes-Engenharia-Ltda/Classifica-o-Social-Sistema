-- CreateTable: publicos_alvo
CREATE TABLE "publicos_alvo" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publicos_alvo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "publicos_alvo_status_idx" ON "publicos_alvo"("status" ASC);
