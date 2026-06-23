# Guia de Publicação

## 1. Backend no Render.com

O Render é uma plataforma gratuita que hospeda o backend (API).

### Passo a passo:

1. Acesse https://render.com e crie uma conta (Google ou GitHub)

2. Clique em **"New +"** → **"Web Service"**

3. Conecte seu GitHub e selecione o repositório `Classifica-o-Social-Sistema`

4. Configure:
   - **Name**: `classificacao-social-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install --legacy-peer-deps && npx prisma generate && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Plan**: **Free**

5. Em **Environment Variables**, adicione:
   - `DATABASE_URL` → a URL de conexão do Supabase (igual está no seu `.env`)
   - `DIRECT_URL` → a URL direta do Supabase
   - `JWT_SECRET` → clique em **Generate Value**
   - `FRONTEND_URL` → `https://classificacaosocial-fortes.vercel.app`
   - `NODE_ENV` → `production`

6. Clique em **"Create Web Service"**

7. Após alguns minutos, o Render vai te dar uma URL tipo: `https://classificacao-social-backend.onrender.com`

8. Anote essa URL — você vai usar no passo 2.

---

## 2. Frontend no GitHub Pages

### Passo a passo:

1. No GitHub, vá em **Settings → Pages**

2. Em **Source**, selecione **"GitHub Actions"**

3. No repositório, vá em **Settings → Secrets and variables → Actions → Variables**

4. Clique em **"New repository variable"**:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://classificacao-social-backend.onrender.com/api`
     (substitua pela URL que o Render gerou)

5. Faça um commit na branch `main`. O GitHub Actions vai automaticamente fazer o build e publicar o frontend.

6. Pronto! O sistema estará disponível em:
   `https://classificacaosocial-fortes.vercel.app`

---

## Para testar localmente (antes de publicar)

```bash
# Terminal 1 - Backend (na pasta backend)
npm install --legacy-peer-deps
npx prisma generate
npm run dev

# Terminal 2 - Frontend (na pasta frontend)
npm install --legacy-peer-deps
npm run dev
```

Acesse http://localhost:3000
