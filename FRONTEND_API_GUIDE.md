# InfraWatch API - Guia Frontend

**Usuários & Autenticação**

## 📋 Base URL

```
http://localhost:3042/api
```

---

## 🔐 Autenticação

### Headers Necessários

```javascript
// Para rotas protegidas
headers: {
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json'
}
```

---

## 👤 DTOs (Request/Response)

### CreateUserDto

```typescript
{
  name: string;           // obrigatório
  email: string;          // obrigatório
  password: string;       // obrigatório
  role?: "ADMIN" | "USER"; // opcional, default: USER
  status?: "ACTIVE" | "INACTIVE"; // opcional, default: ACTIVE
}
```

### LoginDto

```typescript
{
  email: string; // obrigatório
  password: string; // obrigatório
}
```

### ResetPasswordDto

```typescript
{
  currentPassword: string; // obrigatório
  newPassword: string; // obrigatório
}
```

### UpdateUserDto

```typescript
{
  name: string;                    // obrigatório
  email: string;                   // obrigatório
  role?: "ADMIN" | "USER";         // opcional
  isTemporaryPassword?: boolean;   // opcional
  status?: "ACTIVE" | "INACTIVE";  // opcional
}
```

### UserResponseDto

```typescript
{
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "INACTIVE";
  isTemporaryPassword?: boolean;
  temporaryPasswordExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### LoginResponse

```typescript
{
  success: boolean;
  message: string;
  user?: UserResponseDto;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }
}
```

---

## 🛠️ Rotas da API

### 🟢 Login (Público)

```http
POST /users/login
```

**Request:**

```json
{
  "email": "admin@infrawatch.com",
  "password": "admin123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@infrawatch.com",
    "role": "ADMIN",
    "status": "ACTIVE",
    "isTemporaryPassword": false,
    "createdAt": "2025-08-10T00:00:00.000Z",
    "updatedAt": "2025-08-10T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

### 🔒 Registrar Usuário (Admin apenas)

```http
POST /users/register
Authorization: Bearer <token>
```

**Request:**

```json
{
  "name": "Novo Usuario",
  "email": "novo@test.com",
  "role": "USER"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Conta criada com sucesso! Verifique seu email para a senha provisória.",
  "user": {
    "id": 32,
    "name": "Novo Usuario",
    "email": "novo@test.com",
    "role": "USER",
    "status": "ACTIVE",
    "isTemporaryPassword": true,
    "temporaryPasswordExpiry": "2025-08-11T00:15:03.453Z",
    "createdAt": "2025-08-10T00:15:03.456Z",
    "updatedAt": "2025-08-10T00:15:03.456Z"
  }
}
```

### 🔄 Refresh Token

```http
POST /users/refresh
Authorization: Bearer <token>
```

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 👤 Perfil do Usuário

```http
GET /users/profile
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@infrawatch.com",
  "role": "ADMIN",
  "status": "ACTIVE",
  "isTemporaryPassword": false,
  "createdAt": "2025-08-10T00:00:00.000Z",
  "updatedAt": "2025-08-10T00:00:00.000Z"
}
```

### 🔑 Alterar Senha

```http
PUT /users/reset-password
Authorization: Bearer <token>
```

**Request:**

```json
{
  "currentPassword": "senha_atual",
  "newPassword": "nova_senha"
}
```

### ✏️ Atualizar Usuário (Admin apenas)

```http
PUT /users/update-user
Authorization: Bearer <token>
```

**Request:**

```json
{
  "name": "Nome Atualizado",
  "email": "email@atualizado.com",
  "role": "USER",
  "status": "ACTIVE"
}
```

### 📋 Listar Todos os Usuários (Admin apenas)

```http
GET /users
Authorization: Bearer <token>
```

**Response (200):**

```json
[
  {
    "id": 1,
    "name": "Admin User",
    "email": "admin@infrawatch.com",
    "role": "ADMIN",
    "status": "ACTIVE",
    "isTemporaryPassword": false,
    "createdAt": "2025-08-10T00:00:00.000Z",
    "updatedAt": "2025-08-10T00:00:00.000Z"
  }
]
```

### 🔍 Buscar Usuário por ID (Admin apenas)

```http
GET /users/:id
Authorization: Bearer <token>
```

### 🗑️ Deletar Usuário (Admin apenas)

```http
DELETE /users/:id
Authorization: Bearer <token>
```

---

## 🚨 Códigos de Erro

| Código | Descrição                         |
| ------ | --------------------------------- |
| 400    | Dados inválidos                   |
| 401    | Token de acesso requerido         |
| 403    | Acesso negado (role insuficiente) |
| 404    | Usuário não encontrado            |
| 409    | Email já cadastrado               |
| 500    | Erro interno do servidor          |

---

## 💡 Exemplos de Uso JavaScript

### Login

```javascript
const login = async (email, password) => {
  const response = await fetch("http://localhost:3042/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem("accessToken", data.tokens.accessToken);
    localStorage.setItem("refreshToken", data.tokens.refreshToken);
    return data.user;
  }

  throw new Error(data.message);
};
```

### Requisição Autenticada

```javascript
const fetchUserProfile = async () => {
  const token = localStorage.getItem("accessToken");

  const response = await fetch("http://localhost:3042/api/users/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.json();
};
```

### Criar Usuário (Admin)

```javascript
const createUser = async (userData) => {
  const token = localStorage.getItem("accessToken");

  const response = await fetch("http://localhost:3042/api/users/register", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  return response.json();
};
```

---

## 🧪 Dados para Testes

### Usuário Admin (já existente)

```json
{
  "email": "admin@infrawatch.com",
  "password": "admin123"
}
```

### Exemplo de Novo Usuário

```json
{
  "name": "João Silva",
  "email": "joao@empresa.com",
  "role": "USER"
}
```

---

## 📝 Notas Importantes

- **Senhas provisórias**: Têm 6 caracteres (ex: `B4863J`)
- **Tokens**: AccessToken expira em 24h
- **Roles**: `ADMIN` pode gerenciar usuários, `USER` apenas visualizar
- **Status**: `ACTIVE` ou `INACTIVE`
- **Email**: É enviado automaticamente com senha provisória no registro
