# Classificação Social - Sistema de Gestão de Notas Fiscais

MVP corporativo para gestão e classificação de Notas Fiscais e reembolsos relacionados ao custo social da empresa.

## 🎯 Objetivo do Sistema

- Importar NF e reembolsos dos sistemas Mega e SOX
- Armazenar dados em banco de dados relacional (PostgreSQL)
- Permitir classificação das NF
- Relacionar NF com Obras, Projetos, Programas e Classificações
- Controlar pendências
- Exibir dashboards gerenciais
- Operar totalmente via web
- Integrar com banco de dados corporativo existente

## 🛠️ Stack Tecnológica

### Backend
- **Runtime**: Node.js 20+
- **Linguagem**: TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Autenticação**: JWT
- **Validação**: Zod
- **Logs**: Winston
- **Arquitetura**: Modular com Controllers, Services, Repositories

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS
- **Componentes**: ShadCN/UI + Lucide Icons
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Formulários**: React Hook Form
- **Gráficos**: Recharts
- **HTTP Client**: Axios

### Banco de Dados
- **Sistema**: PostgreSQL 16
- **Migrations**: Prisma Migrations
- **ORM**: Prisma Client

### Infraestrutura
- **Containerização**: Docker
- **Orquestração**: Docker Compose
- **Variáveis de Ambiente**: .env files

## 📁 Estrutura do Projeto

```
classificacao-social/
├── backend/
│   ├── src/
│   │   ├── config/          # Configurações (database, logger, JWT)
│   │   ├── controllers/      # Controllers (requisições HTTP)
│   │   ├── services/         # Services (lógica de negócio)
│   │   ├── repositories/     # Repositories (acesso a dados)
│   │   ├── middlewares/      # Middlewares (autenticação, logging, erros)
│   │   ├── routes/           # Rotas da API
│   │   ├── dtos/             # Data Transfer Objects
│   │   ├── utils/            # Funções utilitárias
│   │   ├── database/         # Seeds e inicialização
│   │   └── index.ts          # Entrada da aplicação
│   ├── prisma/
│   │   └── schema.prisma     # Schema do banco de dados
│   ├── .env                  # Variáveis de ambiente
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React reutilizáveis
│   │   ├── pages/            # Páginas (Login, Dashboard, etc)
│   │   ├── services/         # Serviços de API (Axios)
│   │   ├── hooks/            # Custom hooks (React Query)
│   │   ├── store/            # Estado global (Zustand)
│   │   ├── types/            # TypeScript types/interfaces
│   │   ├── styles/           # CSS global
│   │   ├── ui/               # Componentes UI reutilizáveis
│   │   ├── App.tsx           # Componente principal
│   │   └── main.tsx          # Entrada da aplicação
│   ├── .env                  # Variáveis de ambiente
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── database/
│   └── init.sql              # Script de inicialização do BD
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
│
└── README.md

```

## 🚀 Como Começar

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose

### Instalação com Docker (Supabase Only)

1. **Clone ou copie o projeto para seu local:**
```bash
cd classificacao-social
```

2. **No Supabase, copie a URI exata da Session pooler (Connect > Session pooler, porta 5432).**

3. **Configure as variáveis no backend/.env usando exatamente a URI copiada:**
```bash
DATABASE_URL="COLE_AQUI_A_URI_DA_SESSION_POOLER"
DIRECT_URL="COLE_AQUI_A_URI_DA_SESSION_POOLER"
DB_FALLBACK_ENABLED=false
```

4. **Execute o script inicial de tabelas no Supabase (SQL Editor):**
```bash
database/supabase_init.sql
```

5. **Execute o seed de dados iniciais no Supabase (SQL Editor):**
```bash
database/supabase_seed.sql
```

6. **Suba aplicação com Docker Compose (sem PostgreSQL local):**
```bash
docker-compose up -d --build
```

7. **Valide as rotas com dados do Supabase:**
```bash
# 1) Login
POST /api/usuarios/login
{
	"email": "admin@classificacao.com",
	"senha": "admin123"
}

# 2) Use o token retornado para testar dados
GET /api/usuarios/profile
GET /api/dashboard/metricas
GET /api/notas-fiscais
```

6. **Acesse o sistema:**
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

### Instalação Local (Supabase Only)

#### Backend

1. **Instale as dependências:**
```bash
cd backend
npm install
```

2. **Confirme DATABASE_URL e DIRECT_URL no backend/.env** com a URI exata da Session pooler do Supabase.

3. **Aplique migrations no Supabase:**
```bash
npx prisma migrate deploy
```

4. **(Opcional) Rode seed inicial:**
```bash
npm run seed
```

5. **Inicie o backend:**
```bash
npm run dev
```

Backend disponível em: http://localhost:3001

#### Frontend

1. **Instale as dependências:**
```bash
cd frontend
npm install
```

2. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

Frontend disponível em: http://localhost:3000

## 📚 Funcionalidades Principais

### Autenticação
- ✅ Login com JWT
- ✅ Persistência de sessão
- ✅ Controle de permissões (ADMIN, ANALYST, MANAGER)
- ✅ Middleware de autenticação

### CRUD Completo
- ✅ Usuários
- ✅ Obras
- ✅ Projetos
- ✅ Programas
- ✅ Classificações
- ✅ Notas Fiscais

### Classificação de NF
- ✅ Classificação individual
- ✅ Classificação em lote
- ✅ Histórico de alterações
- ✅ Auditoria completa

### Dashboard
- ✅ Métricas principais (Total de NF, Pendentes, Classificadas, Valor)
- ✅ Gráficos
- ✅ Alertas
- ✅ Status em tempo real

### Interface
- ✅ Responsiva (mobile, tablet, desktop)
- ✅ Dark mode
- ✅ Componentes modernos e intuitivos
- ✅ Tabelas com paginação e filtros
- ✅ Formulários validados

## 🔑 Credenciais de Demonstração

| Perfil | Email | Senha |
|--------|-------|-------|
| Administrador | admin@classificacao.com | admin123 |
| Analista | analista@classificacao.com | analista123 |
| Gestor | gestor@classificacao.com | gestor123 |

## 📊 API Endpoints

### Autenticação
- `POST /api/usuarios/login` - Fazer login
- `POST /api/usuarios` - Criar novo usuário
- `GET /api/usuarios/profile` - Obter perfil do usuário autenticado

### Usuários
- `GET /api/usuarios` - Listar usuários (paginado)
- `GET /api/usuarios/:id` - Obter usuário por ID
- `PUT /api/usuarios/:id` - Atualizar usuário
- `DELETE /api/usuarios/:id` - Deletar usuário

### Obras
- `GET /api/obras` - Listar obras
- `POST /api/obras` - Criar obra
- `GET /api/obras/:id` - Obter obra
- `PUT /api/obras/:id` - Atualizar obra
- `DELETE /api/obras/:id` - Deletar obra

### Projetos
- `GET /api/projetos` - Listar projetos
- `POST /api/projetos` - Criar projeto
- `GET /api/projetos/:id` - Obter projeto
- `PUT /api/projetos/:id` - Atualizar projeto
- `DELETE /api/projetos/:id` - Deletar projeto

### Programas
- `GET /api/programas` - Listar programas
- `POST /api/programas` - Criar programa
- `GET /api/programas/:id` - Obter programa
- `PUT /api/programas/:id` - Atualizar programa
- `DELETE /api/programas/:id` - Deletar programa

### Classificações
- `GET /api/classificacoes` - Listar classificações
- `POST /api/classificacoes` - Criar classificação
- `GET /api/classificacoes/:id` - Obter classificação
- `PUT /api/classificacoes/:id` - Atualizar classificação
- `DELETE /api/classificacoes/:id` - Deletar classificação

### Notas Fiscais
- `GET /api/notas-fiscais` - Listar NF (com filtros)
- `POST /api/notas-fiscais` - Criar NF
- `GET /api/notas-fiscais/:id` - Obter NF
- `PUT /api/notas-fiscais/:id` - Atualizar NF
- `DELETE /api/notas-fiscais/:id` - Deletar NF
- `POST /api/notas-fiscais/:id/classificar` - Classificar NF individual
- `POST /api/notas-fiscais/lote/classificar` - Classificar NF em lote

### Dashboard
- `GET /api/dashboard/metricas` - Obter métricas
- `GET /api/dashboard/alertas` - Obter alertas

## 🔒 Segurança

- ✅ Autenticação JWT
- ✅ Validação de entrada com Zod
- ✅ Helmet para headers de segurança
- ✅ CORS configurado
- ✅ Hash de senhas com bcryptjs
- ✅ Logs de auditoria
- ✅ TypeScript strict mode

## 📋 Scripts Disponíveis

### Backend
```bash
npm run dev           # Iniciar em desenvolvimento
npm run build         # Compilar TypeScript
npm run start:prod    # Iniciar em produção
npm run seed          # Popular banco com dados iniciais
npm run prisma:generate  # Gerar Prisma client
npm run prisma:migrate   # Executar migrations
npm run lint          # Executar ESLint
npm run lint:fix      # Corrigir erros do ESLint
npm run format        # Formatar código com Prettier
```

### Frontend
```bash
npm run dev           # Iniciar servidor de desenvolvimento
npm run build         # Compilar para produção
npm run preview       # Pré-visualizar build
npm run lint          # Executar ESLint
npm run lint:fix      # Corrigir erros do ESLint
npm run format        # Formatar código com Prettier
npm run type-check    # Verificar tipos TypeScript
```

## 🗄️ Banco de Dados

### Tabelas
- `usuarios` - Usuários do sistema
- `obras` - Obras
- `projetos` - Projetos
- `programas` - Programas
- `classificacoes` - Classificações
- `notas_fiscais` - Notas Fiscais
- `classificacoes_nf` - Relacionamento entre NF e Classificações
- `importacoes` - Registro de importações
- `logs_auditoria` - Logs de auditoria
- `alertas` - Alertas do sistema

## 🚀 Deployment

### Docker Compose (Recomendado)
```bash
docker-compose up -d
```

### Variáveis de Ambiente Importantes

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@db:5432/classificacao_social
JWT_SECRET=seu-segredo-super-secreto
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://seu-dominio.com
```

**Frontend (.env)**
```
VITE_API_URL=https://sua-api.com/api
VITE_COMPANY_NAME=Classificação Social
VITE_COMPANY_LOGO_URL=/logo.png
VITE_COMPANY_LOGO_ALT=Logo da sua empresa
```

Se `VITE_COMPANY_LOGO_URL` estiver configurado, o topo do sistema e a tela de login exibem a imagem. Se não estiver, a interface usa uma marca tipográfica com as iniciais do nome da empresa.

## 📝 Desenvolvimento

### Padrões de Código
- ✅ Arquitetura em camadas (Controllers → Services → Repositories)
- ✅ TypeScript strict mode
- ✅ Componentes React funcionais com hooks
- ✅ Validação com Zod e React Hook Form
- ✅ Logs estruturados com Winston
- ✅ DTOs para segurança de dados

### Commit Conventions
```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração de código
test: testes
chore: alterações de build ou dependências
```

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
2. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
3. Push para a branch (`git push origin feature/AmazingFeature`)
4. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade de Fortes Engenharia Ltda.

## 📞 Suporte

Para suporte ou dúvidas, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ usando Node.js, React, TypeScript e PostgreSQL**
