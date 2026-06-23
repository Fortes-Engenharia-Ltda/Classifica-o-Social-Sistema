-- CreateTable
CREATE TABLE "tokens_cadastro_instituicao" (
    "id" SERIAL NOT NULL,
    "token" UUID NOT NULL,
    "instituicao_id" INTEGER,
    "criado_por" VARCHAR(120) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "usado_em" TIMESTAMP(3),
    "expira_em" TIMESTAMP(3) NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_cadastro_instituicao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_cadastro_instituicao_token_key" ON "tokens_cadastro_instituicao"("token");

-- CreateIndex
CREATE INDEX "tokens_cadastro_instituicao_expira_em_idx" ON "tokens_cadastro_instituicao"("expira_em");
