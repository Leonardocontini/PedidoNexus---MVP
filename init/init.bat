@echo off
:: =============================================================================
:: PedidoNexus — Script de inicialização para Windows
:: Executa: API (Docker), Totem (porta 5173) e Restaurante (porta 5174)
:: =============================================================================

setlocal EnableDelayedExpansion

:: Caminho raiz do projeto (um nível acima da pasta init\)
set "PROJECT_DIR=%~dp0.."
:: Normaliza o caminho (remove barra dupla, etc.)
for %%F in ("%PROJECT_DIR%") do set "PROJECT_DIR=%%~fF"

echo.
echo [92m╔══════════════════════════════════════╗[0m
echo [92m║        PedidoNexus — Iniciar         ║[0m
echo [92m╚══════════════════════════════════════╝[0m
echo.

:: -----------------------------------------------------------------------------
:: 1. Verificar dependências
:: -----------------------------------------------------------------------------
echo [94m[INFO][0m  Verificando dependencias...

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [91m[ERRO][0m  Docker nao encontrado. Instale em: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [91m[ERRO][0m  Node.js nao encontrado. Instale a versao 20: https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [91m[ERRO][0m  npm nao encontrado. Instale o Node.js 20.
    pause
    exit /b 1
)

echo [92m[OK][0m    Docker, Node.js e npm encontrados.

:: -----------------------------------------------------------------------------
:: 2. Verificar .env na raiz
:: -----------------------------------------------------------------------------
echo [94m[INFO][0m  Verificando arquivo .env...

if not exist "%PROJECT_DIR%\.env" (
    if exist "%PROJECT_DIR%\.env.example" (
        copy "%PROJECT_DIR%\.env.example" "%PROJECT_DIR%\.env" >nul
        echo [93m[AVISO][0m .env criado a partir do .env.example.
        echo [93m[AVISO][0m Edite %PROJECT_DIR%\.env e defina POSTGRES_PASSWORD antes de continuar.
        echo.
        pause
    ) else (
        echo [91m[ERRO][0m  Arquivo .env.example nao encontrado em %PROJECT_DIR%
        pause
        exit /b 1
    )
) else (
    echo [92m[OK][0m    .env encontrado.
)

:: Verifica se POSTGRES_PASSWORD foi definida
set "POSTGRES_PASSWORD="
for /f "usebackq tokens=1,* delims==" %%A in ("%PROJECT_DIR%\.env") do (
    if /i "%%A"=="POSTGRES_PASSWORD" set "POSTGRES_PASSWORD=%%B"
)

if "%POSTGRES_PASSWORD%"=="" (
    echo [93m[AVISO][0m POSTGRES_PASSWORD nao esta definida.
    echo [93m[AVISO][0m Edite %PROJECT_DIR%\.env e defina uma senha real.
    echo.
    pause
) else if "%POSTGRES_PASSWORD%"=="change_me_in_production" (
    echo [93m[AVISO][0m POSTGRES_PASSWORD usa o valor padrao.
    echo [93m[AVISO][0m Edite %PROJECT_DIR%\.env e defina uma senha real.
    echo.
    pause
)

:: -----------------------------------------------------------------------------
:: 3. Verificar .env dos frontends
:: -----------------------------------------------------------------------------
for %%F in (totem restaurante) do (
    if not exist "%PROJECT_DIR%\frontend\%%F\.env" (
        if exist "%PROJECT_DIR%\frontend\%%F\.env.example" (
            copy "%PROJECT_DIR%\frontend\%%F\.env.example" "%PROJECT_DIR%\frontend\%%F\.env" >nul
            echo [92m[OK][0m    .env do %%F criado.
        ) else (
            echo [93m[AVISO][0m .env do frontend\%%F nao encontrado, pulando.
        )
    ) else (
        echo [92m[OK][0m    .env do %%F encontrado.
    )
)

:: -----------------------------------------------------------------------------
:: 4. Instalar dependências dos frontends (se necessário)
:: -----------------------------------------------------------------------------
for %%F in (totem restaurante) do (
    if not exist "%PROJECT_DIR%\frontend\%%F\node_modules" (
        echo [94m[INFO][0m  Instalando dependencias do frontend\%%F...
        call npm install --prefix "%PROJECT_DIR%\frontend\%%F" --silent
        echo [92m[OK][0m    Dependencias do %%F instaladas.
    ) else (
        echo [92m[OK][0m    Dependencias do %%F ja instaladas.
    )
)

:: -----------------------------------------------------------------------------
:: 5. Subir API e banco com Docker Compose
:: -----------------------------------------------------------------------------
echo [94m[INFO][0m  Subindo API + banco de dados...
cd /d "%PROJECT_DIR%"

:: Verifica se a imagem da API já existe
docker image inspect pedidonexus---mvp-api >nul 2>&1
if %errorlevel% equ 0 (
    echo [94m[INFO][0m  Imagem da API ja existe — iniciando sem rebuild.
    echo [94m[INFO][0m  (Para forcar rebuild: docker compose build api)
    docker compose up -d
) else (
    echo [94m[INFO][0m  Imagem da API nao encontrada — fazendo build pela primeira vez...
    docker compose up --build -d
)

:: Aguarda a API ficar saudável
echo [94m[INFO][0m  Aguardando a API ficar saudavel...
set /a ATTEMPTS=0
set /a MAX_ATTEMPTS=30

:wait_api
set /a ATTEMPTS+=1
if %ATTEMPTS% geq %MAX_ATTEMPTS% (
    echo [91m[ERRO][0m  API nao respondeu apos %MAX_ATTEMPTS% tentativas.
    echo [91m[ERRO][0m  Verifique os logs: docker compose logs api
    pause
    exit /b 1
)
curl -sf http://localhost:3000/health >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_api
)
echo [92m[OK][0m    API pronta em http://localhost:3000

:: -----------------------------------------------------------------------------
:: 6. Iniciar frontends em novas janelas do terminal
:: -----------------------------------------------------------------------------
echo [94m[INFO][0m  Iniciando frontend\totem na porta 5173...
start "PedidoNexus — totem" cmd /k "cd /d "%PROJECT_DIR%\frontend\totem" && npm run dev"
echo [92m[OK][0m    totem iniciando — acesse http://localhost:5173

echo [94m[INFO][0m  Iniciando frontend\restaurante na porta 5174...
start "PedidoNexus — restaurante" cmd /k "cd /d "%PROJECT_DIR%\frontend\restaurante" && npm run dev"
echo [92m[OK][0m    restaurante iniciando — acesse http://localhost:5174

:: Aguarda um segundo para os processos iniciarem
timeout /t 2 /nobreak >nul

:: -----------------------------------------------------------------------------
:: 7. Abrir página de boas-vindas no navegador
:: -----------------------------------------------------------------------------
set "WELCOME_PAGE=%PROJECT_DIR%\init\Init.html"
if exist "%WELCOME_PAGE%" (
    echo [94m[INFO][0m  Abrindo pagina de boas-vindas...
    start "" "%WELCOME_PAGE%"
)

:: -----------------------------------------------------------------------------
:: 8. Resumo
:: -----------------------------------------------------------------------------
echo.
echo [92m╔══════════════════════════════════════════════╗[0m
echo [92m║        PedidoNexus — Projeto no ar!          ║[0m
echo [92m╚══════════════════════════════════════════════╝[0m
echo.
echo   🍔  Totem (clientes)       -^>  http://localhost:5173
echo   📋  Painel do restaurante  -^>  http://localhost:5174
echo   🔌  API REST               -^>  http://localhost:3000
echo.
echo   Para parar a API e o banco:  docker compose down
echo   Para ver logs da API:        docker compose logs -f api
echo.
pause
