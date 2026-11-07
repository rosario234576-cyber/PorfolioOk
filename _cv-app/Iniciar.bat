@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias por primera vez...
  call npm install
)
if not exist .env (
  echo.
  echo  Falta el archivo .env con tu ANTHROPIC_API_KEY. Copia .env.example como .env y pega tu clave.
  echo.
)
start "" http://localhost:3000
npm start
pause
