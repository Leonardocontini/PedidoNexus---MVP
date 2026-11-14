# PedidoNexus — MVP

Sistema de pedidos para restaurantes e lanchonetes. Desenvolvido como MVP com totem de autoatendimento para clientes e painel operacional para a equipe do restaurante.

---

## Iniciar o projeto

**Linux / macOS**

```bash
bash init.sh
```

**Windows**

```bat
init.bat
```

Esses scripts sobem o banco de dados e a API via Docker Compose e instalam as dependências dos frontends caso ainda não estejam instaladas.

---

## Encerrar o projeto

**Linux / macOS**

```bash
bash close.sh
```

**Windows**

```bat
close.bat
```

Esses scripts param todos os containers Docker e encerram os servidores de desenvolvimento dos frontends.

---


## Visão geral

O PedidoNexus é composto por três partes independentes que se comunicam:

| Parte | Tecnologia | Porta |
|---|---|---|
| API REST | Node.js 20 + Express | 3000 |
| Totem (clientes) | React + Vite | 5173 |
| Painel do restaurante | React + Vite | 5174 |
| Banco de dados | PostgreSQL 16 | 5432 |

---

## Estrutura do repositório

```
PedidoNexus---MVP/
├── api/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # Pool de conexões com o PostgreSQL
│   │   ├── controllers/
│   │   │   ├── productsController.js # Leitura do cardápio
│   │   │   └── ordersController.js   # Criação e atualização de pedidos
│   │   ├── routes/
│   │   │   ├── productsRoutes.js
│   │   │   └── ordersRoutes.js
│   │   └── app.js                   # Entrada da API, middlewares e CORS
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── database/
│   └── init.sql                     # DDL das tabelas e produtos iniciais
├── frontend/
│   ├── totem/                       # Interface de autoatendimento
│   │   └── src/
│   │       ├── components/
│   │       │   ├── Header.jsx
│   │       │   ├── ProductCard.jsx
│   │       │   ├── ProductGrid.jsx
│   │       │   ├── Cart.jsx
│   │       │   └── OrderConfirmation.jsx
│   │       ├── services/
│   │       │   └── api.js
│   │       ├── App.jsx
│   │       ├── main.jsx
│   │       └── index.css
│   └── restaurante/                 # Painel operacional
│       └── src/
│           ├── components/
│           │   ├── Header.jsx
│           │   ├── OrderCard.jsx
│           │   ├── OrderColumn.jsx
│           │   └── OrderDetails.jsx
│           ├── services/
│           │   └── api.js
│           ├── App.jsx
│           ├── main.jsx
│           └── index.css
├── docker-compose.yml
├── .env.example
└── .gitignore
```

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- [Node.js 20](https://nodejs.org/)

---

## Configuração inicial

### 1. Clone o repositório e acesse a pasta

```bash
git clone <url-do-repositorio>
cd PedidoNexus---MVP
```

### 2. Crie o arquivo `.env` na raiz

```bash
cp .env.example .env
```

Edite o `.env` e defina uma senha para o banco:

```env
API_PORT=3000
NODE_ENV=development
POSTGRES_DB=pedidoNexus
POSTGRES_USER=pedido_user
POSTGRES_PASSWORD=suaSenhaAqui
```

### 3. Instale as dependências dos frontends

```bash
cd frontend/totem && npm install && cd ../..
cd frontend/restaurante && npm install && cd ../..
```

### 4. Crie os `.env` dos frontends

```bash
cp frontend/totem/.env.example frontend/totem/.env
cp frontend/restaurante/.env.example frontend/restaurante/.env
```

O valor padrão (`http://localhost:3000`) já funciona para desenvolvimento local. Altere apenas se a API estiver em outro endereço.

---

## Executando o projeto

Abra **três terminais** na pasta raiz do projeto:

**Terminal 1 — API e banco de dados**

```bash
docker compose up
```

Aguarde as mensagens:
- `pedidoNexus_db` pronto (healthcheck passa)
- `PedidoNexus API running on port 3000`

**Terminal 2 — Totem**

```bash
cd frontend/totem
npm run dev
```

**Terminal 3 — Painel do restaurante**

```bash
cd frontend/restaurante
npm run dev
```

### URLs de acesso

| Interface | URL |
|---|---|
| Totem (autoatendimento) | http://localhost:5173 |
| Painel do restaurante | http://localhost:5174 |
| API | http://localhost:3000 |

---

## Acesso pela rede local (celular, tablet, outro computador)

Descubra o IP da sua máquina:

```bash
ip route get 1 | awk '{print $7; exit}'
```

Ajuste os `.env` dos frontends com esse IP:

```env
# frontend/totem/.env e frontend/restaurante/.env
VITE_API_URL=http://192.168.1.100:3000
```

Suba os servidores Vite expostos na rede:

```bash
# Terminal 2
cd frontend/totem && npm run dev -- --host

# Terminal 3
cd frontend/restaurante && npm run dev -- --host
```

Acesse de qualquer dispositivo na mesma rede Wi-Fi:

| Interface | URL |
|---|---|
| Totem | http://192.168.1.100:5173 |
| Painel do restaurante | http://192.168.1.100:5174 |

> Se necessário, libere as portas no firewall:
> ```bash
> sudo ufw allow 5173 && sudo ufw allow 5174 && sudo ufw allow 3000
> ```

---

## Endpoints da API

### Health check

```
GET /health
```

### Produtos

```
GET  /api/products        # Lista os produtos disponíveis
GET  /api/products/:id    # Consulta um produto específico
```

### Pedidos

```
POST  /api/orders             # Cria um pedido
GET   /api/orders             # Lista todos os pedidos
GET   /api/orders/:id         # Consulta um pedido específico
PATCH /api/orders/:id/status  # Atualiza o status de um pedido
```

#### Exemplo — criar pedido

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Maria",
    "items": [
      { "product_id": 1, "quantity": 2 },
      { "product_id": 4, "quantity": 1 }
    ]
  }'
```

#### Exemplo — atualizar status

```bash
curl -X PATCH http://localhost:3000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "preparing" }'
```

Status permitidos: `pending` → `preparing` → `ready` → `delivered` | `cancelled`

---

## Fluxo completo de uso

1. Abra o **totem** (5173) e adicione produtos ao carrinho
2. Informe um nome (opcional) e confirme o pedido
3. O sistema exibe o número do pedido gerado
4. Abra o **painel do restaurante** (5174)
5. O pedido aparece na coluna **Pendentes** em até 5 segundos
6. Clique em **Iniciar Preparo** → pedido vai para **Preparando**
7. Clique em **Marcar como Pronto** → pedido vai para **Prontos**
8. Clique em **Confirmar Entrega** → pedido vai para o histórico
9. Todas as alterações são persistidas no PostgreSQL em tempo real

---

## Banco de dados

O script `database/init.sql` é executado automaticamente pelo PostgreSQL na primeira inicialização do container. Ele cria as tabelas e insere 8 produtos de exemplo no cardápio.

### Tabelas

| Tabela | Descrição |
|---|---|
| `products` | Produtos do cardápio com nome, descrição, preço, imagem e disponibilidade |
| `orders` | Pedidos com nome do cliente, status, total e data de criação |
| `order_items` | Itens de cada pedido com quantidade e preço unitário registrado no momento da compra |

> O total do pedido é sempre calculado no backend com os preços do banco. O frontend nunca envia valores monetários como dados confiáveis.

### Acessar o banco diretamente

```bash
docker exec -it pedidoNexus_db psql -U pedido_user -d pedidoNexus
```

---

## Solução de problemas

**Banco não inicia — senha não definida**

O arquivo `.env` não existe ou `POSTGRES_PASSWORD` está vazio. Crie o `.env` e reinicie:

```bash
docker compose down -v
docker compose up
```

> O `-v` remove o volume com estado inválido. Use apenas neste caso.

**API não conecta ao banco**

Verifique se o healthcheck do banco passou:

```bash
docker compose ps
```

O status do serviço `db` deve ser `healthy`. Se necessário, reinicie apenas a API:

```bash
docker compose restart api
```

**Frontend não recebe dados (CORS)**

Se a API foi iniciada antes da correção de CORS, reinicie o container:

```bash
docker compose restart api
```

**Porta já em uso**

Altere `API_PORT` no `.env` e ajuste a porta no `docker-compose.yml`.

---

## O que foi implementado

### API REST (`api/`)

- Estrutura com separação entre rotas, controllers e configuração de banco
- Pool de conexões com PostgreSQL via `pg`
- CORS configurado via middleware nativo do Express (sem dependência extra)
- Endpoint de health check com verificação real da conexão com o banco
- Listagem e consulta de produtos do cardápio
- Criação de pedidos em transação única: valida produtos, calcula total no backend, insere pedido e itens atomicamente
- Listagem e consulta de pedidos com itens agregados
- Atualização de status com validação dos valores permitidos
- Tratamento centralizado de erros sem expor detalhes internos
- Consultas SQL parametrizadas em todos os endpoints
- Dockerfile baseado em `node:20-alpine`
- Docker Compose com healthcheck do PostgreSQL, volume persistente e rede isolada

### Totem (`frontend/totem/`)

- Cardápio carregado da API com estados de loading, erro e lista vazia
- Cards de produto com imagem, descrição, preço formatado em BRL e fallback de imagem
- Grade responsiva com CSS Grid
- Carrinho lateral com controle de quantidade, subtotal por item e total geral
- Finalização de pedido com campo de nome opcional
- Resumo antes da confirmação e envio para a API
- Tela de sucesso com número do pedido retornado pelo backend
- Tela de erro com opção de tentar novamente
- Carrinho zerado apenas após confirmação de sucesso do backend
- Identidade visual escura com laranja como cor principal

### Painel do restaurante (`frontend/restaurante/`)

- Kanban com três colunas: Pendentes, Preparando e Prontos
- Polling automático a cada 5 segundos sem chamadas simultâneas
- Atualização imediata da interface após mudança de status (sem esperar o próximo poll)
- Cards de pedido com id, horário, cliente, itens, total e botão de avanço contextual
- Modal de detalhes com todas as informações e botão de ação
- Histórico de pedidos entregues e cancelados na parte inferior
- Contadores por status no header
- Indicador visual de sincronização
- Banner de erro com botão para tentar novamente
- Toast de notificação para operações concluídas ou com falha
- Tela de carregamento inicial com spinner
- Layout responsivo para desktop, notebook e tablet
