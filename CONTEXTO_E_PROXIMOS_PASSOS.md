# Portal Classificação Social (Fortificar)

Documento de contexto do projeto e próximos passos. Leia antes de mexer no código.

## 1. O que é

Aplicação criada pelo time de Inovação da Fortes (via vibe coding) para uso da **Ivana**. Ela classifica as
notas fiscais lançadas nas contas do **Fortificar** (programa social da Fortes): para cada nota informa
Orçado/Não Orçado, Programa, Instituição, Projeto e Classificação ATT. A partir disso o sistema gera
dashboards e relatórios.

Além das notas, o sistema tem cadastros de Programas, Projetos, Instituições (OSC), Obras, Usuários e envio
de e-mails (SMTP Office 365).

## 2. Histórico da migração

| Antes | Agora |
|---|---|
| A Ivana exportava uma planilha do Mega e fazia upload (`Importar Excel`) | Botão **Sincronizar com DW**, que lê direto a view do staging |
| Repositório próprio `Classifica-o-Social-Sistema` | Esta pasta dentro do monorepo `99Fortes` |
| Backend no Render, frontend no Vercel/GitHub Pages, Postgres próprio | **Railway** (backend + frontend) e **Supabase** da Fortes (Postgres) |

- **Dados antigos:** não há migração. Segundo o Thiago Ramos, as notas que existiam no Postgres antigo
  vieram do Mega e já estão no DW, então a sincronização traz tudo de novo.
- **Tabela de origem:** foi indicada pelo Vitor Bertelli. É a view `dbo.vw_notas_fiscais` no banco
  **`FortesStaging`** (servidor `srvfortes01.database.windows.net`).

## 3. Arquitetura

```
frontend/  React 18 + Vite + Tailwind + React Query  → Railway (serve -s dist)
backend/   Node + Express + TypeScript + Prisma        → Railway
           ├─ PostgreSQL (Supabase)   → dados do app (notas, classificações, cadastros)
           └─ SQL Server (Azure)      → leitura apenas
                ├─ FortesDW.dbo.dProjetos           → sincroniza Obras
                └─ FortesStaging.dbo.vw_notas_fiscais → sincroniza Notas Fiscais
```

### Fluxo da sincronização de notas

1. `POST /api/notas-fiscais/sincronizar-dw` (perfis ADMIN e ANALYST). No frontend é o botão da tela Notas Fiscais.
2. [SqlServerNotasFiscaisService.ts](backend/src/services/SqlServerNotasFiscaisService.ts) lê a view inteira,
   com timeout de 10 minutos porque a view é pesada.
3. `NotaFiscalService.sincronizarDW()` em [NotaFiscalService.ts](backend/src/services/NotaFiscalService.ts):
   - Monta uma chave por linha: `DW|idLancamento|idFilial|obra_id|ref|numero_nf|tipoDocumento#n`. O `#n`
     diferencia linhas de rateio idênticas.
   - A chave fica em `camposOpcionais.indiceImportacao`, dentro do JSON salvo em `notas_fiscais.observacao`.
   - Linhas cuja chave já existe são ignoradas. Por isso a sincronização pode rodar várias vezes e **não
     sobrescreve classificações**.
   - Liga a nota à Obra cujo `codigoObra`, `idCentroCusto` ou `projeto` bate com `obra_id` (o
     `pro_st_apelido` no Mega). Se não achar, usa a obra padrão.
   - As notas entram com `origemImportacao = 'DW'` e `status = 'PENDENTE'`.

### A view `vw_notas_fiscais`

A definição é mantida pelo Vitor. Ela junta três blocos do Mega (contas a pagar, contas a receber e retenções).

- **Filtro já embutido:** contas `2200101001` e `2200101002`, que são as do Fortificar, e emissão a partir
  de `2026-01-01`.
- **Colunas:** `idLancamento, idFilial, obra_id, idPlanoContas, ref, idFornecedor, fornecedor, cnpj,
  numero_nf, tipoDocumento, tipoDocumentoBaixa, data_emissao, data_pagamento, valor`.

## 4. Variáveis de ambiente (backend)

Veja [backend/.env.example](backend/.env.example). O `.env` real **não vai para o git**: copie o arquivo do
repositório antigo ou peça as credenciais.

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Supabase, pooler transaction (porta 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase, conexão direta/session (porta 5432) |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Autenticação |
| `FRONTEND_URL` | URL do frontend (links de e-mail) |
| `SQLSERVER_HOST`, `SQLSERVER_PORT`, `SQLSERVER_USER`, `SQLSERVER_PASSWORD` | Azure SQL |
| `SQLSERVER_DATABASE` | `FortesDW` (dProjetos) |
| `SQLSERVER_STAGING_DATABASE` | `FortesStaging` (vw_notas_fiscais) |
| `SMTP_*` | E-mails (Office 365) |

No frontend, a variável é `VITE_API_URL`, com a URL do backend terminando em `/api`.

## 5. Rodar localmente

```powershell
# backend
cd backend
npm install
npx prisma generate
npx prisma db push          # só na 1ª vez num banco vazio
npx ts-node src/database/seed.ts   # usuário inicial (ver credenciais no seed.ts)
npm run dev                 # http://localhost:3001/health

# frontend (outro terminal)
cd frontend
npm install
$env:VITE_API_URL="http://localhost:3001/api"
npm run dev
```

Diagnóstico da view: `cd backend; node scripts/inspect-dw.js` lista os bancos e mostra as colunas e uma
amostra da view.

> **Atenção:** as migrations em `backend/prisma/migrations` começam alterando tabelas que já existem e não
> há migration inicial. Num banco novo, use `prisma db push`, nunca `migrate deploy`.

## 6. Próximos passos

### 6.1 Validar localmente
- [ ] Copiar o `backend/.env` para esta pasta e preencher `DATABASE_URL`/`DIRECT_URL` com o Supabase da Fortes.
- [ ] Conferir se o `datasource` no [schema.prisma](backend/prisma/schema.prisma) tem `directUrl = env("DIRECT_URL")`.
- [ ] Rodar `prisma db push` e o seed, e subir backend e frontend.
- [ ] Em **Obras**, sincronizar com o dProjetos. Depois, em **Notas Fiscais**, clicar em **Sincronizar com DW**.
- [ ] Sincronizar de novo: deve aparecer "novas: 0". Classificar uma nota e sincronizar outra vez: a classificação precisa continuar.

### 6.2 Deploy no Railway
Como o repositório agora é um monorepo, os caminhos mudaram.
- [ ] Serviço **backend**: Root Directory `portal_classificacao_social/backend` (usa o [railway.json](backend/railway.json)). Configurar as variáveis da seção 4, `NODE_ENV=production` e gerar o domínio.
- [ ] Serviço **frontend**: Root Directory `portal_classificacao_social/frontend` (usa o [railway.json](frontend/railway.json)). Configurar `VITE_API_URL` e gerar o domínio.
- [ ] Voltar ao backend, definir `FRONTEND_URL` e fazer o redeploy.
- [ ] Configurar **Watch Paths** (`portal_classificacao_social/backend/**` e `.../frontend/**`) para não fazer deploy a cada commit de outro portal.

### 6.3 Acesso ao Azure SQL
- [ ] Liberar o firewall do `srvfortes01` para o Railway. O ideal é usar Static Outbound IP (Railway Pro).
- [ ] Criar um **usuário somente leitura** no `FortesStaging` e no `FortesDW` e parar de usar o `ftadministrator`.

### 6.4 Lacunas da view (alinhar com o Vitor e a Ivana)
- [ ] **Código de ação** (`acao_in_codigo`): na planilha, ele preenchia o Orçado/Não Orçado automaticamente
      via `classificacao_contas`. Sem ele, toda nota entra como pendente. Quando for incluído na view,
      mapear para `actionCode` em `sincronizarDW()`.
- [ ] **Histórico** e **Unidade de Negócio**: não vêm da view. Hoje a unidade recebe o `obra_id`.
- [ ] **Corte de data** `>= 2026-01-01`: confirmar se a Ivana precisa de notas anteriores.
- [ ] Validar os totais contra uma exportação do Mega do mesmo período.

### 6.5 Melhorias
- [ ] Sincronização agendada, com cron no Railway ou `node-cron`, para não depender do botão.
- [ ] Remover o código antigo de upload: `importarExcel`, `gerarTemplateExcel`, a rota `/importar-excel`, o `multer` e o `xlsx`, se a exportação não usar mais.
- [ ] Remover o fallback em JSON (`backend/data/*-fallback.json`, `prismaCircuitBreaker`) se não for mais necessário.

### 6.6 Descomissionar o ambiente antigo
- [ ] Desligar o serviço no Render e os deploys do Vercel/GitHub Pages.
- [ ] Remover `render.yaml`, `vercel.json` e os scripts `install.sh`/`start.sh`/`stop.sh`/`run-local.bat` se não forem usados.
- [ ] Arquivar o repositório `Classifica-o-Social-Sistema`.

## 7. Contatos

- **Ivana**: usuária do sistema.
- **Vitor Bertelli**: view `vw_notas_fiscais` e DW.
- **Thiago Ramos**: dados do Mega e DW.
