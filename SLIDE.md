# Sistema de Classificação Social

**Fortes Engenharia Ltda**

---

## Objetivo do Sistema

MVP corporativo para gestão e classificação de Notas Fiscais e reembolsos relacionados ao **custo social** da empresa.

- Importar NF e reembolsos dos sistemas **Mega** e **SOX**
- Classificar NF e relacionar com **Obras, Projetos, Programas e Classificações**
- **Digitalizar** o cadastro e revisão de **fornecedores/instituições**
- Gerar **links temporários** para fornecedores revisarem seus dados
- Exibir **dashboards gerenciais** em tempo real
- Controlar **pendências** e fluxo de **aprovação**

---

## Módulos do Sistema

| Módulo | Descrição |
|---|---|
| **Dashboard** | Métricas, gráficos e alertas em tempo real |
| **Notas Fiscais** | Importação (Mega/SOX), classificação individual e em lote |
| **Obras** | Cadastro e gestão de obras |
| **Projetos** | Cadastro e gestão de projetos |
| **Programas** | Cadastro e gestão de programas |
| **Classificações** | Cadastro de classificações fiscais |
| **Instituições** | Cadastro, revisão e aprovação de fornecedores |
| **Usuários** | Controle de acesso (ADMIN, ANALYST, MANAGER) |
| **Configurações** | Parâmetros do sistema |

---

## Fluxo de Fornecedores

```
Cadastro → Revisão → Aprovação
```

1. Fornecedor cadastra dados via **link temporário** compartilhado por email
2. Administrador/Analista **revisa** os dados
3. Sistema envia **notificação por email** (Aprovado / Rejeitado / Ajustes)
4. Se "Ajustes Solicitados", fornecedor recebe **novo link** para corrigir
5. Após aprovação, dados são consolidados

---

## Entregas Recentes (Junho 2026)

| Data | Entrega |
|---|---|
| 23/jun | Deploy frontend no **Vercel** com proxy API para Render |
| 23/jun | Timeout de API reduzido para **15s** |
| 23/jun | Geração de código local + exibição em tela |
| 23/jun | **CORS** configurado para Vercel |
| 23/jun | Timeout Prisma + fallback habilitado |
| 22/jun | **SMTP Office 365** - envio de emails corrigido |
| 22/jun | Fluxo de **esqueci senha** e redefinição |
| 22/jun | **Logout** corrigido com HashRouter |
| 22/jun | **Deploy automático** GitHub Actions |
| 22/jun | Correções de imagens em projetos |
| 19/jun | Base path **GitHub Pages** + HashRouter |
| 19/jun | CORS com múltiplas origens (Vercel + GitHub Pages) |

---

## Stack Tecnológica

### Backend
- **Runtime:** Node.js 20+
- **Linguagem:** TypeScript
- **Framework:** Express.js
- **ORM:** Prisma + PostgreSQL (Supabase)
- **Autenticação:** JWT
- **Validação:** Zod
- **Logs:** Winston
- **Email:** Nodemailer (SMTP Office 365)

### Frontend
- **Framework:** React 18 + TypeScript
- **Build:** Vite 5
- **Estilização:** Tailwind CSS + ShadCN/UI
- **Estado:** Zustand + TanStack React Query
- **Formulários:** React Hook Form + Zod
- **Gráficos:** Recharts
- **Ícones:** Lucide React

### Infraestrutura
- **Frontend:** Vercel (ou GitHub Pages)
- **Backend:** Render.com
- **Banco:** Supabase (PostgreSQL 16)
- **CI/CD:** GitHub Actions

---

## Benefícios

- **Automatização** da classificação de notas fiscais
- **Integração direta** com sistemas corporativos (Mega, SOX, FortesDW)
- **Redução de trabalho manual** e erros de digitação
- **Digitalização** do fluxo de cadastro de fornecedores
- **Links temporários** para fornecedores (sem necessidade de senha)
- **Notificações automáticas** por email
- **Dashboards em tempo real** para tomada de decisão
- **Dark mode** e interface **responsiva** (mobile/tablet/desktop)
- **Arquitetura** moderna e extensível

---

## Links do Projeto

| Ambiente | URL |
|---|---|
| Frontend (Vercel) | https://classificacaosocial-fortes.vercel.app |
| Backend (Render) | https://classificacao-social-backend.onrender.com |
| Repositório | GitHub: Fortes-Engenharia-Ltda/Classifica-o-Social-Sistema |

---

**Desenvolvido por:** equipe de desenvolvimento Fortes Engenharia Ltda
