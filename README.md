# Face Mask Auth

Sistema de autenticação facial escalável e reutilizável desenvolvido com React, TypeScript, Tailwind CSS e NestJS.

## Características

- **Autenticação Facial Segura**: Utiliza face-api.js para detecção e reconhecimento facial
- **Interface Moderna**: UI responsiva e acessível com Tailwind CSS
- **TypeScript**: Type safety completo em frontend e backend
- **Escalável**: Arquitetura modular pronta para produção
- **Reutilizável**: Fácil integração em outros projetos
- **Seguro**: Validações robustas e tratamento de erros

## Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL 5.7+ ou MariaDB 10.3+
- Webcam funcional

## Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd face-mask
```

### 2. Configure o Banco de Dados MySQL

```bash
# Execute o script SQL para criar o banco e tabelas
mysql -u root -p < database/schema.sql
```

Veja instruções detalhadas em `database/README.md`

### 3. Configure as Variáveis de Ambiente

Crie o arquivo `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=face_mask_auth
DB_SYNCHRONIZE=false
DB_LOGGING=true
```

### 4. Instale as dependências

```bash
npm run install:all
```

Este comando irá automaticamente:
- Instalar todas as dependências do projeto
- Criar a pasta `frontend/public/models/`
- Baixar os 7 modelos necessários do face-api.js

**Nota**: Os modelos são baixados automaticamente via script. Se precisar baixá-los manualmente, execute:
```bash
npm run download:models
```

## Executando o Projeto

### Modo Desenvolvimento (Frontend + Backend)

```bash
npm run dev
```

Isso iniciará:
- Frontend em: http://localhost:3000
- Backend em: http://localhost:3001

### Executar Separadamente

**Frontend:**
```bash
npm run dev:frontend
```

**Backend:**
```bash
npm run dev:backend
```

## Build para Produção

```bash
npm run build
```

## Como Usar

### 1. Registrar Novo Usuário

1. Clique na aba "Registrar"
2. Digite seu nome de usuário e e-mail
3. Clique em "Registrar com Face"
4. Permita o acesso à câmera
5. Posicione seu rosto na frente da câmera
6. Aguarde a captura e confirmação

### 2. Fazer Login

1. Clique na aba "Login"
2. Digite seu nome de usuário
3. Clique em "Iniciar Login Facial"
4. Permita o acesso à câmera
5. Posicione seu rosto na frente da câmera
6. Aguarde a autenticação

## Arquitetura

### Frontend (React + TypeScript)

```
frontend/
├── src/
│   ├── components/
│   │   ├── FaceLogin.tsx      # Componente de login facial
│   │   ├── FaceRegister.tsx   # Componente de registro facial
│   │   └── LoadingSpinner.tsx # Componente de loading
│   ├── services/
│   │   └── api.ts             # Cliente HTTP para API
│   ├── App.tsx                # Componente principal
│   ├── main.tsx               # Entry point
│   └── index.css              # Estilos globais
└── public/
    └── models/                # Modelos do face-api.js
```

### Backend (NestJS + TypeScript)

```
backend/
├── src/
│   ├── auth/
│   │   ├── dto/
│   │   │   └── auth.dto.ts              # DTOs de validação
│   │   ├── auth.controller.ts           # Rotas de autenticação
│   │   ├── auth.service.ts              # Lógica de negócio
│   │   ├── face-recognition.service.ts  # Serviço de reconhecimento facial
│   │   └── auth.module.ts               # Módulo de autenticação
│   ├── app.module.ts          # Módulo raiz
│   └── main.ts                # Entry point
```

## Segurança

- **Validação de Dados**: Todas as entradas são validadas com class-validator
- **CORS Configurado**: Apenas origens permitidas podem acessar a API
- **Threshold de Matching**: Distância euclidiana < 0.6 para reconhecimento
- **Prevenção de Duplicatas**: Verifica rostos já registrados
- **Type Safety**: TypeScript em todo o código

## Tecnologias Utilizadas

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- face-api.js
- Axios
- Vite

### Backend
- NestJS
- TypeScript
- class-validator
- class-transformer
- bcrypt

## Configuração Avançada

### Ajustar Threshold de Reconhecimento

Edite `backend/src/auth/face-recognition.service.ts`:

```typescript
private readonly MATCH_THRESHOLD = 0.6; // Diminua para ser mais restritivo
```

### Configurar CORS

Edite `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: 'http://localhost:3000', // Adicione suas origens
  credentials: true,
});
```

### Persistência de Dados

Os dados são armazenados em MySQL usando TypeORM:

- **Tabela `users`**: Armazena usuários e descritores faciais
- **Tabela `auth_logs`**: Registra todas as tentativas de login/registro

Para mais detalhes, veja `database/README.md`

## Scripts Disponíveis

```bash
npm run install:all    # Instala todas as dependências e baixa modelos automaticamente
npm run download:models # Baixa apenas os modelos do face-api.js
npm run dev            # Inicia frontend e backend
npm run dev:frontend   # Inicia apenas frontend
npm run dev:backend    # Inicia apenas backend
npm run build          # Build de produção
npm run build:frontend # Build do frontend
npm run build:backend  # Build do backend
npm run lint           # Executa linter no frontend e backend
npm run format         # Formata código com Prettier no frontend e backend
```

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT.

## Problemas Conhecidos

- **Câmera não inicia**: Verifique as permissões do navegador
- **Modelos não carregam**: Certifique-se de que os arquivos estão em `frontend/public/models/`
- **Rosto não detectado**: Melhore a iluminação e posicione-se de frente para a câmera

## Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

---

Desenvolvido usando React, TypeScript, Tailwind CSS e NestJS