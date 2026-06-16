@echo off
setlocal

echo ==============================================
echo   Classificacao Social - Start Local (Windows)
echo ==============================================
echo.

if not exist "backend\node_modules" (
  echo [AVISO] Backend sem dependencias instaladas.
  echo Execute primeiro: cd backend ^&^& npm install
  echo.
)

if not exist "frontend\node_modules" (
  echo [AVISO] Frontend sem dependencias instaladas.
  echo Execute primeiro: cd frontend ^&^& npm install
  echo.
)

start "Classificacao Social API" cmd /k "cd /d ""%~dp0backend"" && npm run dev"
start "Classificacao Social Web" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo API:     http://localhost:3001/health
echo Frontend: http://localhost:3000
echo.
echo Se alguma janela fechar, verifique os logs exibidos nela.
pause