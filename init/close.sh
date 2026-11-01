#!/usr/bin/env bash
# =============================================================================
# PedidoNexus — Script de encerramento para Ubuntu
# Para: Totem (5173), Restaurante (5174) e API + banco (Docker)
# =============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn()    { echo -e "${YELLOW}[AVISO]${NC} $1"; }

echo ""
echo -e "${RED}╔══════════════════════════════════════╗${NC}"
echo -e "${RED}║        PedidoNexus — Encerrar        ║${NC}"
echo -e "${RED}╚══════════════════════════════════════╝${NC}"
echo ""

# -----------------------------------------------------------------------------
# 1. Parar processos Vite (frontends) nas portas 5173 e 5174
# -----------------------------------------------------------------------------
for PORT in 5173 5174; do
  PIDS=$(lsof -ti tcp:"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    log_info "Encerrando processo na porta $PORT (PID: $PIDS)..."
    echo "$PIDS" | xargs kill -TERM 2>/dev/null || true
    sleep 1
    # Força encerramento se ainda estiver rodando
    REMAINING=$(lsof -ti tcp:"$PORT" 2>/dev/null || true)
    if [ -n "$REMAINING" ]; then
      echo "$REMAINING" | xargs kill -9 2>/dev/null || true
    fi
    log_success "Porta $PORT liberada."
  else
    log_warn "Nenhum processo encontrado na porta $PORT."
  fi
done

# -----------------------------------------------------------------------------
# 2. Parar containers Docker (API + banco)
# -----------------------------------------------------------------------------
if command -v docker &>/dev/null; then
  log_info "Parando containers Docker..."
  cd "$PROJECT_DIR"
  if docker compose ps --quiet 2>/dev/null | grep -q .; then
    docker compose down
    log_success "Containers encerrados."
  else
    log_warn "Nenhum container do PedidoNexus estava rodando."
  fi
else
  log_warn "Docker não encontrado, pulando encerramento dos containers."
fi

# -----------------------------------------------------------------------------
# 3. Fechar terminais abertos pelo init.sh (gnome-terminal com título PedidoNexus)
# -----------------------------------------------------------------------------
TERM_PIDS=$(pgrep -f "PedidoNexus" 2>/dev/null || true)
if [ -n "$TERM_PIDS" ]; then
  log_info "Fechando terminais do PedidoNexus..."
  echo "$TERM_PIDS" | xargs kill -TERM 2>/dev/null || true
  log_success "Terminais fechados."
fi

# -----------------------------------------------------------------------------
# 4. Resumo
# -----------------------------------------------------------------------------
echo ""
echo -e "${RED}╔══════════════════════════════════════════════╗${NC}"
echo -e "${RED}║      PedidoNexus — Tudo encerrado!           ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Para iniciar novamente:  ${YELLOW}bash init/init.sh${NC}"
echo ""
