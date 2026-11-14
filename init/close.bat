@echo off
:: =============================================================================
:: PedidoNexus — Script de encerramento para Windows
:: Para: Totem (5173), Restaurante (5174) e API + banco (Docker)
:: =============================================================================

setlocal EnableDelayedExpansion

:: Caminho raiz do projeto (um nível acima da pasta init\)
set "PROJECT_DIR=%~dp0.."
for %%F in ("%PROJECT_DIR%") do set "PROJECT_DIR=%%~fF"

echo.
echo [91m╔══════════════════════════════════════╗[0m
echo [91m║        PedidoNexus — Encerrar        ║[0m
echo [91m╚══════════════════════════════════════╝[0m
echo.

:: -----------------------------------------------------------------------------
:: 1. Parar processos Vite (frontends) nas portas 5173 e 5174
:: -----------------------------------------------------------------------------
for %%P in (5173 5174) do (
    echo [94m[INFO][0m  Verificando porta %%P...

    :: Busca o PID que está usando a porta
    set "FOUND_PID="
    for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        set "FOUND_PID=%%A"
    )

    if defined FOUND_PID (
        echo [94m[INFO][0m  Encerrando processo na porta %%P (PID: !FOUND_PID!)...
        taskkill /PID !FOUND_PID! /F >nul 2>&1
        if !errorlevel! equ 0 (
            echo [92m[OK][0m    Porta %%P liberada.
        ) else (
            echo [93m[AVISO][0m Nao foi possivel encerrar o processo na porta %%P.
        )
    ) else (
        echo [93m[AVISO][0m Nenhum processo encontrado na porta %%P.
    )
)

:: -----------------------------------------------------------------------------
:: 2. Parar containers Docker (API + banco)
:: -----------------------------------------------------------------------------
where docker >nul 2>&1
if %errorlevel% equ 0 (
    echo [94m[INFO][0m  Parando containers Docker...
    cd /d "%PROJECT_DIR%"

    :: Verifica se há containers rodando
    for /f %%C in ('docker compose ps --quiet 2^>nul') do (
        set "CONTAINERS_RUNNING=1"
    )

    if defined CONTAINERS_RUNNING (
        docker compose down
        echo [92m[OK][0m    Containers encerrados.
    ) else (
        echo [93m[AVISO][0m Nenhum container do PedidoNexus estava rodando.
    )
) else (
    echo [93m[AVISO][0m Docker nao encontrado, pulando encerramento dos containers.
)

:: -----------------------------------------------------------------------------
:: 3. Fechar janelas cmd abertas pelo init.bat (título PedidoNexus)
:: -----------------------------------------------------------------------------
echo [94m[INFO][0m  Fechando janelas do PedidoNexus...

:: Encerra janelas cmd cujo título contém "PedidoNexus"
taskkill /FI "WINDOWTITLE eq PedidoNexus*" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo [92m[OK][0m    Janelas do PedidoNexus fechadas.
) else (
    echo [93m[AVISO][0m Nenhuma janela do PedidoNexus encontrada.
)

:: -----------------------------------------------------------------------------
:: 4. Resumo
:: -----------------------------------------------------------------------------
echo.
echo [91m╔══════════════════════════════════════════════╗[0m
echo [91m║      PedidoNexus — Tudo encerrado!           ║[0m
echo [91m╚══════════════════════════════════════════════╝[0m
echo.
echo   Para iniciar novamente:  init\init.bat
echo.
pause
