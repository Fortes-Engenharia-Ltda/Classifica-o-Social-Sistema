#!/bin/bash

# Script para iniciar o projeto em desenvolvimento

echo "Iniciando Classificação Social em modo desenvolvimento..."

# Verificar se o backend já está rodando
if ! nc -z localhost 3001 2>/dev/null; then
    echo "Iniciando backend na porta 3001..."
    cd backend
    npm run dev &
    cd ..
else
    echo "Backend já está rodando na porta 3001"
fi

# Verificar se o frontend já está rodando
if ! nc -z localhost 3000 2>/dev/null; then
    echo "Iniciando frontend na porta 3000..."
    cd frontend
    npm run dev &
    cd ..
else
    echo "Frontend já está rodando na porta 3000"
fi

echo "✓ Aplicação iniciada!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "Pressione Ctrl+C para parar"

wait
