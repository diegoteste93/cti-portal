# CTI Portal - Cyber Threat Intelligence Platform

Portal centralizado de Threat Intelligence para desenvolvedores, arquitetos, gestores e time de segurança.

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Next.js     │────▶│  NestJS API  │────▶│  PostgreSQL  │
│  (Frontend)  │     │  (Backend)   │     │  (tsvector)  │
│  :3000       │     │  :4000       │     │  :5432       │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────▼───────┐     ┌──────────────┐
                    │  Worker      │────▶│  Redis       │
                    │  (BullMQ)    │     │  (Queue)     │
                    │              │     │  :6379       │
                    └──────────────┘     └──────────────┘
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router) + TailwindCSS |
| Backend API | NestJS + TypeORM + PostgreSQL |
| Worker | BullMQ + Redis |
| Busca | PostgreSQL Full-Text Search (tsvector) |
| Auth | Google OIDC (2 domínios) |
| Infra | Docker Compose |

## Estrutura do Monorepo

```
cti-portal/
├── apps/
│   ├── api/            # NestJS backend (REST API)
│   ├── web/            # Next.js frontend
│   └── worker/         # BullMQ job processor (ingestão)
├── packages/
│   └── shared/         # Types, constants, tech dictionary
├── docker-compose.yml
├── .env.example
└── package.json
```

## Setup local

### Pré-requisitos

- Node.js >= 20
- Docker e Docker Compose
- Conta Google Cloud (para OIDC)

### 1. Clonar e configurar

```bash
git clone <repo-url> cti-portal
cd cti-portal
cp .env.example .env
# Edite .env com suas credenciais Google e domínios
```

### 2. Subir infraestrutura

```bash
# Subir PostgreSQL e Redis
docker compose up -d postgres redis

# Instalar dependências
npm install

# Build do pacote shared
npm run build:shared
```

### 3. Executar migrações e seed

```bash
npm run db:migrate
npm run db:seed
```

### 4. Iniciar os serviços

```bash
# Em terminais separados:
npm run dev:api      # API em http://localhost:4000
npm run dev:web      # Frontend em http://localhost:3000
npm run dev:worker   # Worker de ingestão
```

### Alternativa: Docker Compose completo

```bash
docker compose up --build
```


## Deploy com Docker em VPS

Se você está rodando em uma VPS com Docker, o fluxo recomendado é:

```bash
# 1) Clonar projeto e configurar variáveis
git clone <repo-url> cti-portal
cd cti-portal
cp .env.example .env

# 2) Build + subida de todos os serviços
docker compose up -d --build

# 3) Executar migrações e seed no container da API
docker compose exec api npm run migration:run:js
docker compose exec api npm run seed:js
```

Dicas:
- Garanta que `NEXT_PUBLIC_API_URL` aponte para o host público correto da API.
- Configure proxy reverso (Nginx/Traefik) com HTTPS para `web` e `api`.
- Em produção, desative o login dev e mantenha apenas OIDC.
- Arquivos enviados pela UI em `apps/web/public/uploads` agora persistem em volume Docker (`web_uploads`) após `docker compose down/up --build` (desde que não use `down -v`).

## Configuração Google OIDC

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione existente
3. APIs & Services > Credentials > Create OAuth 2.0 Client ID
4. Tipo: Web Application
5. Authorized redirect URIs: `http://localhost:3000/login`
6. Copie Client ID e Client Secret para `.env`
7. Configure `ALLOWED_DOMAINS` com seus domínios

## Guia de Fontes

### Tipos de Conectores

| Tipo | Descrição | Configuração |
|------|-----------|-------------|
| `rss` | Feed RSS/Atom | Apenas URL |
| `generic_api` | API JSON | URL + mapping (arrayPath, titleField, etc.) |
| `github_releases` | GitHub Advisories | URL + token (opcional) |
| `html_scrape` | Scraping HTML | URL + selectors (itemSelector, titleSelector, etc.) |

### Fontes Pré-configuradas (Seed inicial)

- NVD - National Vulnerability Database
- CISA Known Exploited Vulnerabilities
- GitHub Advisory Database
- The Hacker News (RSS)
- BleepingComputer (RSS)
- Krebs on Security (RSS)
- npm Security Advisories
- Maven Security Advisories

### Adicionando Nova Fonte via UI

1. Acesse Administração > Fontes
2. Clique em "+ Adicionar Fonte"
3. Preencha: nome, tipo, URL, agendamento cron, categorias
4. Para APIs com autenticação, configure headers/tokens
5. Use "Coletar Agora" para testar

### Configuração de Mapping (generic_api)

```json
{
  "arrayPath": "data.items",
  "titleField": "title",
  "summaryField": "description",
  "contentField": "body",
  "urlField": "link",
  "dateField": "published_at"
}
```

## Guia de Grupos e Personas

### Grupos Pré-configurados

| Grupo | Tags Seguidas | Categorias |
|-------|--------------|------------|
| Arquitetura | java, spring, node_js, react, docker, k8s | vulnerability, exploit, supply_chain |
| Dev React (Web) | react, javascript, typescript, npm | vulnerability, exploit, supply_chain |
| Dev React Native (Mobile) | react_native, android, ios, npm | vulnerability, exploit, supply_chain, malware |
| Dev Node.js (Backend) | node_js, npm, express, nestjs | vulnerability, exploit, supply_chain |
| Dev Java (Backend) | java, spring, spring_boot, maven, log4j | vulnerability, exploit, supply_chain |
| Gerente de Projeto (PM) | - | ransomware, data_leak, fraud, general |
| Segurança (SecOps/AppSec) | todas tecnologias | todas categorias |

### Como funciona o Feed Personalizado

1. **Preferências do usuário** (configuradas em "Meu Feed")
2. **Políticas dos grupos** aos quais pertence
3. O feed combina (OR) tags e categorias de ambas as fontes
4. Keywords de exclusão são aplicadas para filtrar ruído

### RBAC (Papéis)

| Papel | Permissões |
|------|-----------|
| Administrador | Tudo: fontes, categorias, usuários, grupos, auditoria |
| Editor de CTI | Gerenciar fontes e categorias |
| Gerente de Grupo | Gerenciar membros e políticas do grupo |
| Visualizador | Visualizar feed e itens |

### ABAC (Visibilidade)

- **PUBLIC**: visível para todos os usuários autenticados
- **GROUPS**: visível apenas para membros dos grupos especificados

## Categorias

Categorias são data-driven (gerenciadas via UI/API, sem alteração de código):

- Vulnerabilidades
- Exploits e Ataques
- Ransomware
- Fraude
- Vazamentos de Dados
- Malware
- Phishing
- Cadeia de Suprimentos
- Geral

## Enriquecimento Automático

Cada item ingerido é automaticamente enriquecido com:

- **CVE**: extração via regex `CVE-YYYY-NNNN+`
- **CWE**: extração via regex `CWE-NNN`
- **Tecnologias**: detecção via dicionário configurável (34+ tecnologias)
- **Vendors/Produtos**: heurística por palavras-chave
- **Severidade**: inferida do texto (CRITICAL/HIGH/MEDIUM/LOW)

## API Endpoints

| Método | Endpoint | Descrição |
|--------|---------|-----------|
| POST | `/api/auth/google` | Login via Google OIDC |
| GET | `/api/auth/me` | Usuário atual |
| GET | `/api/feed` | Feed personalizado |
| GET | `/api/feed/dashboard` | Stats do dashboard |
| GET | `/api/items` | Busca com filtros |
| GET | `/api/items/:id` | Detalhe do item |
| GET/POST | `/api/sources` | CRUD de fontes |
| POST | `/api/sources/:id/fetch` | Trigger ingestão |
| GET/POST | `/api/categories` | CRUD de categorias |
| GET/PATCH | `/api/users` | Gerenciar usuários |
| GET/PATCH | `/api/users/me/preferences` | Preferências pessoais |
| GET/POST/PATCH | `/api/groups` | CRUD de grupos |
| PATCH | `/api/groups/:id/policy` | Política do grupo |
| GET | `/api/audit` | Log de auditoria |
