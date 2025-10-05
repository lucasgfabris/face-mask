# Face Mask Auth

Sistema de autenticação facial seguro e escalável usando reconhecimento facial com face-api.js.

## Tecnologias

**Frontend:**
- React 18 + TypeScript
- Vite
- TailwindCSS
- face-api.js
- Axios

**Backend:**
- NestJS
- TypeORM
- MySQL
- bcrypt

## Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL >= 8.0

## Instalação Rápida

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd face-mask
```

### 2. Instale as dependências

```bash
npm run install:all
```

Este comando irá:
- Instalar dependências do projeto raiz
- Instalar dependências do frontend
- Instalar dependências do backend
- Baixar automaticamente os modelos de IA necessários

### 3. Configure o banco de dados

#### 3.1. Crie o banco de dados

Execute o script SQL no MySQL:

```bash
mysql -u root -p < database/install-manual.sql
```

Ou copie e cole o conteúdo de `database/install-manual.sql` no MySQL Workbench/phpMyAdmin.

#### 3.2. Configure as variáveis de ambiente

Crie o arquivo `backend/.env` baseado no `backend/env.example`:

```bash
cp backend/env.example backend/.env
```

Edite `backend/.env` com suas credenciais:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=sua_senha
DB_DATABASE=face_mask_auth
DB_SYNCHRONIZE=false
DB_LOGGING=true
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
FACE_MATCH_THRESHOLD=0.6
```

### 4. Inicie o projeto

```bash
npm run dev
```

Isso iniciará:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Scripts Disponíveis

### Projeto Raiz

```bash
npm run dev              # Inicia frontend e backend simultaneamente
npm run install:all      # Instala todas as dependências
npm run download:models  # Baixa os modelos de IA
npm run build           # Build de produção (frontend + backend)
npm run lint            # Verifica erros de lint
npm run format          # Formata o código
```

### Frontend

```bash
cd frontend
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
npm run lint     # ESLint
npm run format   # Prettier
```

### Backend

```bash
cd backend
npm run start:dev   # Inicia em modo desenvolvimento
npm run build       # Build de produção
npm run start:prod  # Inicia versão de produção
npm run lint        # ESLint
npm run format      # Prettier
```

## Estrutura do Projeto

```
face-mask/
├── frontend/               # Aplicação React
│   ├── public/models/     # Modelos de IA do face-api.js
│   └── src/
│       ├── components/    # Componentes React
│       └── services/      # Serviços (API, detecção facial)
├── backend/               # API NestJS
│   └── src/
│       ├── auth/         # Módulo de autenticação
│       └── database/     # Configuração e entidades
├── database/             # Scripts SQL
└── scripts/              # Scripts auxiliares
```

## Funcionalidades

### Registro de Usuário
1. Digite nome e e-mail
2. Posicione-se na frente da câmera
3. Siga as instruções em tempo real:
   - "Aproxime-se mais da câmera"
   - "Mova-se para a direita/esquerda"
   - "Olhe diretamente para a câmera"
   - "Melhore a iluminação"
4. Captura automática quando a posição estiver perfeita

### Login Facial
1. Digite seu nome de usuário
2. Posicione-se na frente da câmera
3. Sistema compara seu rosto com o cadastrado
4. Login automático se houver match

## Características Técnicas

### Detecção Facial
- Análise de qualidade em tempo real
- Verificação de distância da câmera
- Verificação de centralização (horizontal/vertical)
- Verificação de orientação do rosto
- Verificação de iluminação
- Threshold de similaridade configurável (padrão: 0.6)

### Segurança
- Descriptors faciais armazenados de forma segura
- Logs de autenticação (sucesso/falha)
- Validação de dados no backend
- CORS configurável
- Proteção contra SQL injection (TypeORM)

### Performance
- Modelos de IA carregados uma única vez (singleton)
- Detecção contínua otimizada (500ms de intervalo)
- Código centralizado e reutilizável
- Build otimizado para produção

## Banco de Dados

### Tabela: users
- `id`: ID único do usuário
- `user_name`: Nome de usuário (único)
- `email`: E-mail (único)
- `face_descriptor`: Descriptor facial (128 dimensões)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Tabela: auth_logs
- `id`: ID do log
- `user_name`: Nome do usuário
- `auth_type`: Tipo (login/register)
- `success`: Sucesso (true/false)
- `ip_address`: IP do cliente
- `user_agent`: User agent
- `created_at`: Data do evento

## Solução de Problemas

### Modelos não encontrados
```bash
npm run download:models
```

### Erro de conexão com banco de dados
- Verifique se o MySQL está rodando
- Confirme as credenciais no `backend/.env`
- Verifique se o banco `face_mask_auth` foi criado

### Câmera não funciona
- Permita acesso à câmera no navegador
- Use HTTPS em produção (requisito do navegador)
- Verifique se outra aplicação não está usando a câmera

### Erro de CORS
- Ajuste `CORS_ORIGIN` no `backend/.env`
- Certifique-se de que a URL do frontend está correta

## Produção

### Build

```bash
npm run build
```

### Frontend
O build estará em `frontend/dist/`. Sirva com qualquer servidor estático (Nginx, Apache, Vercel, Netlify).

### Backend
O build estará em `backend/dist/`. Execute com:

```bash
cd backend
npm run start:prod
```

### Variáveis de Ambiente em Produção

```env
NODE_ENV=production
CORS_ORIGIN=https://seu-dominio.com
DB_SYNCHRONIZE=false
DB_LOGGING=false
```

## Licença

MIT

## Suporte

Para problemas ou dúvidas, abra uma issue no repositório.
