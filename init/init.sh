#!/usr/bin/env bash
# =============================================================================
# PedidoNexus — Script de inicialização para Ubuntu
# Executa: API (Docker), Totem (porta 5173) e Restaurante (porta 5174)
# =============================================================================

set -e

# Caminho raiz do projeto (um nível acima da pasta init/)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # sem cor

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn()    { echo -e "${YELLOW}[AVISO]${NC} $1"; }
log_error()   { echo -e "${RED}[ERRO]${NC}  $1"; }

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        PedidoNexus — Iniciar         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""

# -----------------------------------------------------------------------------
# 1. Verificar dependências
# -----------------------------------------------------------------------------
log_info "Verificando dependências..."

if ! command -v docker &>/dev/null; then
  log_error "Docker não encontrado. Instale em: https://docs.docker.com/engine/install/ubuntu/"
  exit 1
fi

if ! command -v node &>/dev/null; then
  log_error "Node.js não encontrado. Instale a versão 20: https://nodejs.org/"
  exit 1
fi

if ! command -v npm &>/dev/null; then
  log_error "npm não encontrado. Instale o Node.js 20."
  exit 1
fi

log_success "Docker, Node.js e npm encontrados."

# -----------------------------------------------------------------------------
# 2. Verificar .env na raiz
# -----------------------------------------------------------------------------
log_info "Verificando arquivo .env..."

if [ ! -f "$PROJECT_DIR/.env" ]; then
  if [ -f "$PROJECT_DIR/.env.example" ]; then
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    log_warn ".env criado a partir do .env.example."
    log_warn "Edite $PROJECT_DIR/.env e defina POSTGRES_PASSWORD antes de continuar."
    echo ""
    read -r -p "Pressione Enter após editar o .env para continuar..."
  else
    log_error "Arquivo .env.example não encontrado em $PROJECT_DIR"
    exit 1
  fi
else
  log_success ".env encontrado."
fi

# Verifica se POSTGRES_PASSWORD foi definida
source "$PROJECT_DIR/.env" 2>/dev/null || true
if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "change_me_in_production" ]; then
  log_warn "POSTGRES_PASSWORD não está definida ou usa o valor padrão."
  log_warn "Edite $PROJECT_DIR/.env e defina uma senha real."
  echo ""
  read -r -p "Pressione Enter para continuar mesmo assim..."
fi

# -----------------------------------------------------------------------------
# 3. Verificar .env dos frontends
# -----------------------------------------------------------------------------
for FRONTEND in totem restaurante; do
  ENV_FILE="$PROJECT_DIR/frontend/$FRONTEND/.env"
  ENV_EXAMPLE="$PROJECT_DIR/frontend/$FRONTEND/.env.example"
  if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
      cp "$ENV_EXAMPLE" "$ENV_FILE"
      log_success ".env do $FRONTEND criado."
    else
      log_warn ".env do frontend/$FRONTEND não encontrado, pulando."
    fi
  else
    log_success ".env do $FRONTEND encontrado."
  fi
done

# -----------------------------------------------------------------------------
# 4. Instalar dependências dos frontends (se necessário)
# -----------------------------------------------------------------------------
for FRONTEND in totem restaurante; do
  FRONTEND_DIR="$PROJECT_DIR/frontend/$FRONTEND"
  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    log_info "Instalando dependências do frontend/$FRONTEND..."
    npm install --prefix "$FRONTEND_DIR" --silent
    log_success "Dependências do $FRONTEND instaladas."
  else
    log_success "Dependências do $FRONTEND já instaladas."
  fi
done

# -----------------------------------------------------------------------------
# 5. Subir API e banco com Docker Compose
# -----------------------------------------------------------------------------
log_info "Subindo API + banco de dados..."
cd "$PROJECT_DIR"

# Verifica se a imagem da API já existe
if docker image inspect pedidonexus---mvp-api &>/dev/null 2>&1; then
  log_info "Imagem da API já existe — iniciando sem rebuild."
  log_info "(Para forçar rebuild: docker compose build api)"
  docker compose up -d
else
  log_info "Imagem da API não encontrada — fazendo build pela primeira vez..."
  docker compose up --build -d
fi

log_info "Aguardando a API ficar saudável..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until curl -sf http://localhost:3000/health > /dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    log_error "API não respondeu após ${MAX_ATTEMPTS} tentativas."
    log_error "Verifique os logs: docker compose logs api"
    exit 1
  fi
  sleep 2
done
log_success "API pronta em http://localhost:3000"

# -----------------------------------------------------------------------------
# 6. Iniciar frontends em background (novos terminais gnome-terminal / xterm)
# -----------------------------------------------------------------------------
start_frontend() {
  local NAME="$1"
  local DIR="$2"
  local PORT="$3"

  log_info "Iniciando frontend/$NAME na porta $PORT..."

  if command -v gnome-terminal &>/dev/null; then
    gnome-terminal \
      --title="PedidoNexus — $NAME" \
      -- bash -c "cd '$DIR' && npm run dev; exec bash" \
      2>/dev/null &
  elif command -v xterm &>/dev/null; then
    xterm -title "PedidoNexus — $NAME" \
      -e "cd '$DIR' && npm run dev; bash" &
  else
    # Fallback: roda em background no mesmo terminal, com log em arquivo
    LOG_FILE="/tmp/pedidonexus-${NAME}.log"
    cd "$DIR" && npm run dev > "$LOG_FILE" 2>&1 &
    log_warn "$NAME rodando em background. Logs: $LOG_FILE"
    return
  fi

  log_success "$NAME iniciando — acesse http://localhost:$PORT"
}

start_frontend "totem"       "$PROJECT_DIR/frontend/totem"       5173
start_frontend "restaurante" "$PROJECT_DIR/frontend/restaurante" 5174

# Aguarda um segundo para os processos iniciarem
sleep 2

# -----------------------------------------------------------------------------
# 7. Abrir página de boas-vindas no navegador
# -----------------------------------------------------------------------------
WELCOME_PAGE="$PROJECT_DIR/init/Init.html"
if [ -f "$WELCOME_PAGE" ]; then
  log_info "Abrindo página de boas-vindas..."
  if command -v xdg-open &>/dev/null; then
    xdg-open "$WELCOME_PAGE" 2>/dev/null &
  elif command -v google-chrome &>/dev/null; then
    google-chrome "$WELCOME_PAGE" 2>/dev/null &
  elif command -v firefox &>/dev/null; then
    firefox "$WELCOME_PAGE" 2>/dev/null &
  else
    log_warn "Nenhum navegador encontrado. Abra manualmente: $WELCOME_PAGE"
  fi
fi

# -----------------------------------------------------------------------------
# 7. Resumo
# -----------------------------------------------------------------------------
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        PedidoNexus — Projeto no ar!          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🍔  Totem (clientes)       →  ${BLUE}http://localhost:5173${NC}"
echo -e "  📋  Painel do restaurante  →  ${BLUE}http://localhost:5174${NC}"
echo -e "  🔌  API REST               →  ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "  Para parar a API e o banco:  ${YELLOW}docker compose down${NC}"
echo -e "  Para ver logs da API:        ${YELLOW}docker compose logs -f api${NC}"
echo ""
