#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Instalando Classificação Social ===${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js não está instalado!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js encontrado: $(node --version)${NC}"

# Instalar backend
echo -e "${YELLOW}Instalando backend...${NC}"
cd backend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro ao instalar dependências do backend${NC}"
    exit 1
fi
cp .env.example .env
echo -e "${GREEN}✓ Backend instalado${NC}"

# Instalar frontend
echo -e "${YELLOW}Instalando frontend...${NC}"
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro ao instalar dependências do frontend${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend instalado${NC}"

echo -e "${GREEN}=== Instalação concluída com sucesso! ===${NC}"
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Configure as variáveis de ambiente em backend/.env"
echo "2. Execute as migrations: cd backend && npx prisma migrate dev"
echo "3. Execute o seed: cd backend && npm run seed"
echo "4. Inicie o backend: npm run dev"
echo "5. Em outra aba, inicie o frontend: cd frontend && npm run dev"
