-- CreateTable
CREATE TABLE "d_usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "data_nascimento" DATE,
    "senha" VARCHAR(255) NOT NULL,
    "perfil" VARCHAR(20) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "codigo_reset_senha" VARCHAR(10),
    "expira_reset_senha" TIMESTAMP(3),
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obras" (
    "id" SERIAL NOT NULL,
    "codigo_obra" VARCHAR(50) NOT NULL,
    "nome_obra" VARCHAR(100) NOT NULL,
    "cidade" VARCHAR(100),
    "centro_custo" VARCHAR(50),
    "status" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,
    "id_centro_custo" VARCHAR(50),
    "id_un" VARCHAR(50),
    "un" VARCHAR(100),
    "descricao" TEXT,
    "projeto" VARCHAR(200),
    "local" VARCHAR(200),
    "cliente" VARCHAR(150),
    "gerente" VARCHAR(120),
    "gestor" VARCHAR(120),

    CONSTRAINT "obras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projetos" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "data_inicio" DATE,
    "data_fim" DATE,
    "impacto_mensal" JSONB,
    "participantes_projeto" JSONB,
    "pessoas_cadastradas" TEXT,
    "quantidade_pessoas_cadastradas" INTEGER NOT NULL DEFAULT 0,
    "valor_monetario_previsto" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "valor_monetario_realizado" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "imagem" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projetos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classificacoes" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "categoria" VARCHAR(50),
    "status" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_orcado_nao_orcado" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50),
    "nome" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_orcado_nao_orcado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" SERIAL NOT NULL,
    "numero_nf" VARCHAR(50) NOT NULL,
    "fornecedor" VARCHAR(100),
    "cnpj" VARCHAR(20),
    "valor" DECIMAL(15,2) NOT NULL,
    "data_emissao" DATE NOT NULL,
    "obra_id" INTEGER,
    "status" VARCHAR(20) NOT NULL,
    "origem_importacao" VARCHAR(50),
    "observacao" TEXT,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classificacoes_nf" (
    "id" SERIAL NOT NULL,
    "nota_fiscal_id" INTEGER,
    "projeto_id" INTEGER,
    "programa_id" INTEGER,
    "classificacao_id" INTEGER,
    "obra_id" INTEGER,
    "data_classificacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classificacoes_nf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "importacoes" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "data_importacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arquivo" VARCHAR(255),
    "status" VARCHAR(20),
    "log" TEXT,

    CONSTRAINT "importacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acao" VARCHAR(100),
    "alteracao" TEXT,
    "ip" VARCHAR(50),

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" SERIAL NOT NULL,
    "nota_fiscal_id" INTEGER,
    "tipo" VARCHAR(50),
    "mensagem" TEXT,
    "status" VARCHAR(20),
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsavel_id" INTEGER,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instituicoes_sociais" (
    "id" SERIAL NOT NULL,
    "instituicao" VARCHAR(150) NOT NULL,
    "responsavel" VARCHAR(120),
    "cep" VARCHAR(20),
    "logradouro" VARCHAR(180),
    "numero" VARCHAR(20),
    "complemento" VARCHAR(120),
    "bairro" VARCHAR(120),
    "cidade" VARCHAR(120),
    "estado" VARCHAR(10),
    "cnpj" VARCHAR(20),
    "valor_monetario_previsto" DECIMAL(15,2),
    "prazo_pagamento" VARCHAR(50),
    "data_inicio" DATE,
    "data_fim" DATE,
    "descricao" TEXT,
    "historico_finalidade_osc" TEXT,
    "principais_acoes_proponente" TEXT,
    "publico_alvo_proponente" TEXT,
    "regiao_alcance_bairros" TEXT,
    "infraestrutura_proponente" TEXT,
    "termo_anexo" TEXT,
    "liberado_admin" BOOLEAN NOT NULL DEFAULT false,
    "status_revisao" VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    "observacoes_revisao" TEXT,
    "revisor_email" VARCHAR(120),
    "revisor_nome" VARCHAR(120),
    "data_revisao" TIMESTAMP(3),
    "motivo_rejeicao" TEXT,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instituicoes_sociais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsaveis_instituicao" (
    "id" SERIAL NOT NULL,
    "instituicao_id" INTEGER,
    "representante" VARCHAR(120) NOT NULL,
    "cpf" VARCHAR(20),
    "rg" VARCHAR(30),
    "orgao_expedidor" VARCHAR(50),
    "cargo" VARCHAR(80),
    "mandato" VARCHAR(80),
    "endereco" VARCHAR(180),
    "contato" VARCHAR(30),
    "contato2" VARCHAR(30),
    "contato3" VARCHAR(30),
    "email" VARCHAR(120),
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "responsaveis_instituicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsaveis_tecnicos" (
    "id" SERIAL NOT NULL,
    "instituicao_id" INTEGER,
    "representante" VARCHAR(120) NOT NULL,
    "cpf" VARCHAR(20),
    "rg" VARCHAR(30),
    "orgao_expedidor" VARCHAR(50),
    "cargo" VARCHAR(80),
    "mandato" VARCHAR(80),
    "endereco" VARCHAR(180),
    "contato" VARCHAR(30),
    "contato2" VARCHAR(30),
    "contato3" VARCHAR(30),
    "email" VARCHAR(120),
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "responsaveis_tecnicos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "d_usuarios_email_key" ON "d_usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "obras_codigo_obra_key" ON "obras"("codigo_obra");

-- CreateIndex
CREATE UNIQUE INDEX "projetos_codigo_key" ON "projetos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "programas_codigo_key" ON "programas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "classificacoes_codigo_key" ON "classificacoes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "d_orcado_nao_orcado_codigo_key" ON "d_orcado_nao_orcado"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "d_orcado_nao_orcado_nome_key" ON "d_orcado_nao_orcado"("nome");

-- CreateIndex
CREATE INDEX "d_orcado_nao_orcado_status_idx" ON "d_orcado_nao_orcado"("status");

-- CreateIndex
CREATE INDEX "notas_fiscais_obra_id_idx" ON "notas_fiscais"("obra_id");

-- CreateIndex
CREATE INDEX "notas_fiscais_status_idx" ON "notas_fiscais"("status");

-- CreateIndex
CREATE INDEX "classificacoes_nf_nota_fiscal_id_idx" ON "classificacoes_nf"("nota_fiscal_id");

-- CreateIndex
CREATE INDEX "classificacoes_nf_usuario_id_idx" ON "classificacoes_nf"("usuario_id");

-- CreateIndex
CREATE INDEX "importacoes_usuario_id_idx" ON "importacoes"("usuario_id");

-- CreateIndex
CREATE INDEX "logs_auditoria_usuario_id_idx" ON "logs_auditoria"("usuario_id");

-- CreateIndex
CREATE INDEX "alertas_nota_fiscal_id_idx" ON "alertas"("nota_fiscal_id");

-- CreateIndex
CREATE INDEX "alertas_responsavel_id_idx" ON "alertas"("responsavel_id");

-- CreateIndex
CREATE INDEX "instituicoes_sociais_instituicao_idx" ON "instituicoes_sociais"("instituicao");

-- CreateIndex
CREATE INDEX "instituicoes_sociais_cidade_idx" ON "instituicoes_sociais"("cidade");

-- CreateIndex
CREATE INDEX "instituicoes_sociais_data_inicio_idx" ON "instituicoes_sociais"("data_inicio");

-- CreateIndex
CREATE INDEX "instituicoes_sociais_status_revisao_idx" ON "instituicoes_sociais"("status_revisao");

-- CreateIndex
CREATE INDEX "instituicoes_sociais_revisor_email_idx" ON "instituicoes_sociais"("revisor_email");

-- CreateIndex
CREATE INDEX "instituicoes_sociais_data_revisao_idx" ON "instituicoes_sociais"("data_revisao");

-- CreateIndex
CREATE INDEX "responsaveis_instituicao_instituicao_id_idx" ON "responsaveis_instituicao"("instituicao_id");

-- CreateIndex
CREATE INDEX "responsaveis_tecnicos_instituicao_id_idx" ON "responsaveis_tecnicos"("instituicao_id");

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacoes_nf" ADD CONSTRAINT "classificacoes_nf_nota_fiscal_id_fkey" FOREIGN KEY ("nota_fiscal_id") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacoes_nf" ADD CONSTRAINT "classificacoes_nf_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacoes_nf" ADD CONSTRAINT "classificacoes_nf_programa_id_fkey" FOREIGN KEY ("programa_id") REFERENCES "programas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacoes_nf" ADD CONSTRAINT "classificacoes_nf_classificacao_id_fkey" FOREIGN KEY ("classificacao_id") REFERENCES "classificacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacoes_nf" ADD CONSTRAINT "classificacoes_nf_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacoes_nf" ADD CONSTRAINT "classificacoes_nf_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "d_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importacoes" ADD CONSTRAINT "importacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "d_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "d_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_nota_fiscal_id_fkey" FOREIGN KEY ("nota_fiscal_id") REFERENCES "notas_fiscais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "d_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsaveis_instituicao" ADD CONSTRAINT "responsaveis_instituicao_instituicao_id_fkey" FOREIGN KEY ("instituicao_id") REFERENCES "instituicoes_sociais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsaveis_tecnicos" ADD CONSTRAINT "responsaveis_tecnicos_instituicao_id_fkey" FOREIGN KEY ("instituicao_id") REFERENCES "instituicoes_sociais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

