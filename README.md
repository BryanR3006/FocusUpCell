# FocusUpCell - Aplicación Móvil de Técnicas de Estudio

## 📋 Descripción General

**FocusUpCell** es una aplicación móvil desarrollada con **React Native + Expo** que implementa múltiples técnicas de estudio para mejorar la productividad y concentración del usuario. La aplicación permite a los usuarios ejecutar sesiones de Pomodoro, Mapas Mentales, Repaso Espaciado, Práctica Activa, Método Feynman, y Método Cornell, con seguimiento de progreso y análisis de desempeño.

**Stack Tecnológico:**
- Frontend: React Native 0.81.5, Expo 54.0.23
- Navegación: React Navigation 7.1.22
- State Management: Context API + AsyncStorage
- HTTP Client: Axios/Fetch API
- UI Components: Lucide React Native, React Native Vector Icons
- Styling: StyleSheet (React Native)
- Backend API: RESTful API (http://localhost:3001/api/v1)

---

## 📁 Estructura del Proyecto

```
src/
├── pages/               # Pantallas/Vistas principales
│   ├── Login.tsx                       # Autenticación
│   ├── Register.tsx                    # Registro de usuario
│   ├── Home.tsx                        # Dashboard principal
│   ├── profilpage.tsx                  # Gestión de perfil
│   ├── PomodoroExecutionView.tsx       # Ejecución de sesiones Pomodoro
│   ├── PomodoroIntroView.tsx           # Introducción a Pomodoro
│   ├── StudyMethodsLibraryPage.tsx     # Biblioteca de métodos
│   ├── Survey.tsx                      # Encuesta post-registro
│   ├── ForgotPassword.tsx              # Recuperación de contraseña
│   ├── ForgotPasswordCode.tsx          # Validación de código
│   ├── ForgotPasswordReset.tsx         # Reset de contraseña
│   └── Confirmation.tsx                # Confirmación de email
│
├── contexts/            # Estado global de la aplicación
│   └── AuthContext.tsx                 # Gestión de autenticación
│
├── clientes/            # HTTP Clients
│   └── apiClient.ts                    # Cliente API REST
│
├── types/               # TypeScript Interfaces & Types
│   ├── user.ts                         # Interfaces de usuario
│   ├── api.ts                          # Interfaces de API
│   └── navigation.ts                   # Tipos de navegación
│
├── ui/                  # Componentes reutilizables
│   ├── Sidebar.tsx                     # Menú lateral con navegación
│   ├── ProgressCircle.tsx              # Circulo de progreso
│   ├── card.tsx                        # Tarjeta genérica
│   └── timer.tsx                       # Componente temporizador
│
└── utils/               # Funciones y constantes
    ├── constants.ts                    # Endpoints y configuración API
    ├── methodStatus.ts                 # Lógica de estados de métodos
    └── methodAssets.ts                 # Mapeo de activos locales
```

---

## 🏗️ Arquitectura

### 1. **Capas de la Aplicación**

```
┌─────────────────────────────────────┐
│        UI COMPONENTS                │  Sidebar, Cards, Forms
├─────────────────────────────────────┤
│        PAGES/SCREENS                │  Login, Home, StudyMethods
├─────────────────────────────────────┤
│       STATE MANAGEMENT              │  AuthContext (Context API)
├─────────────────────────────────────┤
│       API CLIENT LAYER              │  apiClient.ts (Fetch)
├─────────────────────────────────────┤
│       BACKEND API                   │  REST Endpoints
└─────────────────────────────────────┘
```

### 2. **Flujo de Autenticación**

```
Login/Register → AuthContext.login() → AsyncStorage (token + userData)
                                    ↓
                            useAuth() Hook
                                    ↓
                        Context Provider (toda app)
                                    ↓
                            Protected Routes
```

### 3. **Flujo de Métodos de Estudio**

```
Home (Dashboard)
    ↓
StudyMethods (Seleccionar método)
    ↓
MethodIntroView (Descripción del método)
    ↓
MethodExecutionView (Ejecución con timer)
    ↓
API: POST /sesiones (Guardar progreso)
    ↓
Actualizar estado local + reanudar sesión
```

### 4. **Gestión de Estado**

**AuthContext** mantiene:
- `isAuthenticated`: boolean
- `user`: User object
- `loading`: boolean
- `login(token, userData)`: async function
- `logout()`: async function

**Storage Local (AsyncStorage):**
- `token`: JWT token
- `userData`: JSON stringificado del usuario
- Sesiones pausadas (en construcción)

---

## 📱 Funcionalidades Principales

### ✅ Implementadas

1. **Autenticación**
   - Login con email/contraseña
   - Registro de nuevos usuarios
   - Recuperación de contraseña (3 pasos)
   - Validación de email
   - JWT Token storage

2. **Dashboard Principal**
   - Visualización de métodos activos
   - Estadísticas de progreso (sesiones, métodos completados)
   - Álbumes de música para concentración
   - Tarjetas expandibles de métodos
   - Refresh pull-to-refresh

3. **Métodos de Estudio**
   - **Pomodoro**: Timer 25/5, pausar/reanudar, skip breaks
   - **Mapas Mentales**: Soporte para progreso en pasos (20%, 40%, 60%, 80%, 100%)
   - **Repaso Espaciado**: Sistema de repetición con algoritmo de espaciado
   - **Práctica Activa**: Cuestionarios de autoevaluación
   - **Método Feynman**: Explicación de conceptos en 4 pasos
   - **Método Cornell**: Sistema de notas estructurado

4. **Perfil de Usuario**
   - Edición de datos (nombre, país, género, fecha de nacimiento)
   - Cambio de contraseña
   - Selección de distracciones comunes (2 principales)
   - Selección de objetivo principal
   - Horario favorito para trabajar
   - Eliminación de cuenta

5. **Sidebar de Navegación**
   - Menú animado con transiciones
   - Submenú de "Herramientas"
   - Logout button
   - Avatar con inicial del usuario

6. **UI/UX**
   - Dark theme consistente (#171717, #232323)
   - Animaciones fluidas
   - Componentes responsive
   - Gradientes y sombras

### 🔧 En Desarrollo / Necesita Mejoras

1. **Sincronización de Sesiones**
   - ❌ No se guardan sesiones pausadas localmente
   - ❌ No hay recuperación automática de sesiones incompletas
   - ⚠️ El campo `resumeProgress` en PomodoroExecute no se utiliza

2. **API Client**
   - ⚠️ Métodos incompletos (falta PUT, DELETE, PATCH)
   - ⚠️ No hay manejo de autenticación en headers (Bearer token)
   - ⚠️ Sin interceptores de error global
   - ❌ Base URL hardcodeada (localhost:3001)

3. **Validaciones**
   - ⚠️ Validación de email débil en Login
   - ❌ No hay validación de contraseña fuerte en Register
   - ❌ No hay confirmación de email post-registro

4. **Manejo de Errores**
   - ⚠️ Mensajes de error genéricos
   - ❌ Sin retry logic para fallos de red
   - ❌ Sin timeout configuration en requests

5. **TypeScript**
   - ⚠️ Tipos genéricos (any en muchos lugares)
   - ⚠️ Falta completa tipificación en StudyMethodsLibraryPage.tsx
   - ⚠️ AuthContext necesita tipos genéricos

6. **Performance**
   - ⚠️ No hay lazy loading de componentes
   - ⚠️ Sin optimización de re-renders (useMemo, useCallback)
   - ⚠️ Imágenes sin optimización

---

## ⚠️ Problemas Conocidos y Fallos

### 1. **Autenticación**
```
❌ PROBLEMA: Login espera "contrasena" pero Register usa "password"
   - Inconsistencia en nombres de propiedades
   - Fichero: src/types/user.ts
   - SOLUCIÓN: Normalizar LoginRequest y RegisterRequest

❌ PROBLEMA: No hay validación de token expirado
   - El token no se refresca automáticamente
   - Las sesiones expiradas causan crashes
   - SOLUCIÓN: Implementar refresh token logic

❌ PROBLEMA: Logout no limpia estados locales
   - AsyncStorage se limpia pero el UI no actualiza bien
   - Navigation context puede tener referencias viejas
```

### 2. **API Client**
```
❌ PROBLEMA: Falta autenticación en headers
   - No se envía el token en requests
   - Servidor rechaza con 401
   - SOLUCIÓN: Implementar interceptor de Bearer token

❌ PROBLEMA: Los métodos POST/PUT/DELETE no existen
   - Solo GET está implementado
   - apiClient.ts falta:
     - put(endpoint, body)
     - delete(endpoint)
     - patch(endpoint, body)
   - SOLUCIÓN: Extender ApiClient con estos métodos

❌ PROBLEMA: Sin error handling global
   - Cada pantalla reinventa manejo de errores
   - No hay retry logic
```

### 3. **Pomodoro Execution**
```
⚠️ PROBLEMA: El progreso no se actualiza visualmente en tiempo real
   - Timer funciona pero UI puede no reflejar cambios
   - SessionData no se sincroniza con Backend

⚠️ PROBLEMA: Resumir sesión (resumeProgress) no implementado
   - Parámetro existe pero no se usa en lógica
   - Necesita lógica de recuperación de sesión

❌ PROBLEMA: No hay persistencia de sesión pausada
   - Si el usuario cierra la app durante Pomodoro
   - Se pierde toda la sesión
```

### 4. **Métodos de Estudio**
```
❌ PROBLEMA: StudyMethodsLibraryPage.tsx sin tipificación TypeScript
   - Archivo con tipos implícitos (any everywhere)
   - Sin componentes reutilizables

⚠️ PROBLEMA: No hay validación de progreso en backend
   - El cliente envía cualquier valor
   - Backend debe validar (20, 40, 60, 80, 100)

⚠️ PROBLEMA: methodStatus.ts muy complejo y repetitivo
   - Mismo código para 6 métodos diferentes
   - Oportunidad de refactoring
```

### 5. **Perfil de Usuario**
```
❌ PROBLEMA: ProfilePage es React Web, no React Native
   - Importa componentes de Headless UI (React)
   - No funcionará en dispositivo móvil
   - SOLUCIÓN: Reescribir con componentes React Native
   - ARCHIVO: src/pages/profilpage.tsx

❌ PROBLEMA: updateUser no actualiza toda la data en Context
   - Solo actualiza parcialmente
   - Inconsistencia entre API y UI

⚠️ PROBLEMA: Fecha de nacimiento sin validación de edad mínima
   - No hay restricción de edad
```

### 6. **Validaciones**
```
❌ PROBLEMA: Falta archivo validationUtils.ts
   - ProfilePage lo importa pero no existe
   - Funciones: validatePassword, validateDateOfBirth, checkUsernameAvailability

❌ PROBLEMA: No hay validaciones en Register
   - Contraseña sin requisitos de seguridad
   - Email sin verificación de dominio
```

### 7. **Navegación**
```
⚠️ PROBLEMA: RootStackParamList incompleta
   - Faltan rutas: MindMapsIntro, SpacedRepetitionIntro, etc.
   - Parámetros de rutas inconsistentes

⚠️ PROBLEMA: Deep linking no configurado
   - No se puede navegar por links profundos
```

---

## 🔌 Endpoints de API

**Base URL:** `http://localhost:3001/api/v1`

### Autenticación
```
POST /users/login
POST /users/register
POST /users/logout
POST /users/request-password-reset
POST /users/reset-password-with-code
```

### Usuarios
```
GET  /users
GET  /users/profile
PUT  /users/{id}
DELETE /users/{id}
```

### Métodos de Estudio
```
GET /metodos-estudio
GET /metodos-estudio/{id}
```

### Sesiones
```
POST /sesiones
PUT /sesiones/{id}
GET /sesiones
GET /sesiones/{id}
```

### Reportes
```
GET /reports
GET /reports/active-methods
GET /reports/methods
GET /reports/sessions
```

---

## 🚀 Cómo Completar el Proyecto

### Priority 1: Críticos (Bloquean funcionalidad)

#### 1.1 Reescribir ProfilePage en React Native ⭐⭐⭐⭐⭐
**Fichero:** `src/pages/profilpage.tsx`

**Problema:** Archivo está en React, no React Native

**Solución:**
```tsx
// Cambiar de:
import { Listbox } from "@headlessui/react";
import Swal from "sweetalert2";

// A:
import { View, ScrollView, TextInput, Picker } from "react-native";
import { Alert } from "react-native";
```

**Pasos:**
1. Convertir HTML a React Native components
2. Usar `Picker` de `@react-native-picker/picker` en lugar de `Listbox`
3. Reemplazar `Swal` con `Alert.alert()`
4. Adaptar estilos CSS a `StyleSheet`

**Estimado:** 2-3 horas

---

#### 1.2 Completar ApiClient con métodos HTTP ⭐⭐⭐⭐
**Fichero:** `src/clientes/apiClient.ts`

**Problema:** Falta PUT, DELETE, PATCH y autenticación

**Solución:**
```typescript
// Agregar a ApiClient class:

async put(endpoint: string, body: any) {
  return this.request(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(body) 
  });
}

async delete(endpoint: string) {
  return this.request(endpoint, { method: 'DELETE' });
}

async patch(endpoint: string, body: any) {
  return this.request(endpoint, { 
    method: 'PATCH', 
    body: JSON.stringify(body) 
  });
}

// Implementar autenticación en headers:
private async getAuthHeader() {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');
  return { 'Authorization': `Bearer ${token}` };
}
```

**Estimado:** 1-2 horas

---

#### 1.3 Crear archivo validationUtils.ts ⭐⭐⭐
**Fichero:** `src/utils/validationUtils.ts` (Falta crear)

**Funciones requeridas por profilpage.tsx:**
```typescript
export function validatePassword(password: string): string | null
export function validateDateOfBirth(date: Date): string | null
export function checkUsernameAvailability(username: string, currentUsername: string): Promise<string | null>
```

**Estimado:** 1 hora

---

### Priority 2: Altos (Afectan múltiples funciones)

#### 2.1 Implementar persistencia de sesiones pausadas ⭐⭐⭐⭐
**Ficheros:** 
- `src/pages/PomodoroExecutionView.tsx`
- `src/utils/sessionStorage.ts` (Crear)

**Lógica:**
```typescript
// Guardar sesión pausada
await saveSessionToLocalStorage({
  methodId,
  progress,
  elapsedTime,
  startTime,
  sessionId
});

// Recuperar al reiniciar
const resumedSession = await getSessionFromLocalStorage();
```

**Estimado:** 2-3 horas

---

#### 2.2 Actualizar tipos y completar RootStackParamList ⭐⭐⭐
**Fichero:** `src/types/navigation.ts`

**Agregar:**
```typescript
export type RootStackParamList = {
  // ... existentes
  MindMapsIntro: { methodId: number };
  MindMapsExecute: { methodId: number; resumeProgress?: number };
  SpacedRepetitionIntro: { methodId: number };
  SpacedRepetitionExecute: { methodId: number; resumeProgress?: number };
  // ... más métodos
};
```

**Estimado:** 1 hora

---

#### 2.3 Implementar interceptor de Bearer Token ⭐⭐⭐
**Fichero:** `src/clientes/apiClient.ts`

**Modificar method `request()`:**
```typescript
private async request(endpoint: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  // Resto del código...
}
```

**Estimado:** 30 minutos

---

### Priority 3: Medios (Mejoran UX)

#### 3.1 Refactorizar methodStatus.ts ⭐⭐
**Fichero:** `src/utils/methodStatus.ts`

**Problema:** Código repetitivo para 6 métodos

**Solución:**
```typescript
// Crear factory pattern:
export const createStatusHelper = (methodType: MethodType) => ({
  getStatusByProgress: (progress) => METHOD_CONFIG[methodType].getStatus(progress),
  getColorByProgress: (progress) => getStatusColor(METHOD_CONFIG[methodType].getStatus(progress)),
  // ...
});
```

**Estimado:** 1-2 horas

---

#### 3.2 Agregar validaciones en Register ⭐⭐
**Fichero:** `src/pages/Register.tsx`

**Validaciones a agregar:**
- Contraseña mínimo 8 caracteres, 1 mayúscula, 1 número, 1 especial
- Email válido
- Fecha de nacimiento >= 13 años
- Username único

**Estimado:** 1 hora

---

#### 3.3 Implementar retry logic para fallos de red ⭐⭐
**Fichero:** `src/clientes/apiClient.ts`

```typescript
private async requestWithRetry(endpoint: string, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await this.request(endpoint, options);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
    }
  }
}
```

**Estimado:** 1 hora

---

### Priority 4: Bajos (Mejoras de código)

#### 4.1 Agregar TypeScript strict mode ⭐
**Fichero:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Estimado:** 30 minutos

---

#### 4.2 Optimizar re-renders en Home.tsx ⭐
**Fichero:** `src/pages/Home.tsx`

```typescript
const loadUserData = useCallback(async () => { /* ... */ }, []);

const ExpandableCard = React.memo(({ /* props */ }) => { /* ... */ });
```

**Estimado:** 1 hora

---

#### 4.3 Crear archivo para constantes de validación ⭐
**Fichero:** `src/utils/validationConstants.ts`

```typescript
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUppercase: true,
  hasNumber: true,
  hasSpecial: true
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_AGE = 13;
```

**Estimado:** 30 minutos

---

## 📦 Instalación y Ejecución

### Requisitos
- Node.js 18+
- npm o yarn
- Expo CLI: `npm install -g expo-cli`
- Backend corriendo en `http://localhost:3001`

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Instalar dependencias nativas específicas
npm install @react-native-async-storage/async-storage

# 3. Iniciar servidor Expo
npm start

# 4. Ejecutar en emulador/dispositivo
npm run android    # Android Emulator
npm run ios        # iOS Simulator
npm run web        # Web Browser
```

### Variables de Entorno
```
# .env (crear)
API_BASE_URL=http://localhost:3001/api/v1
DEBUG_MODE=true
```

---

## 🧪 Testing (Recomendado)

**Frameworks sugeridos:**
- Jest
- React Native Testing Library
- Detox (E2E)

**Archivo de configuración:**
```json
// jest.config.js
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/'],
};
```

---

## 📚 Documentación de Componentes Principales

### AuthContext
```tsx
const { user, isAuthenticated, login, logout, loading } = useAuth();

// Login
await login(token, userData);

// Logout
await logout();
```

### ApiClient
```tsx
const resp = await apiClient.post('/endpoint', payload);
const data = await apiClient.get('/endpoint');
await apiClient.put('/endpoint/:id', payload);
```

### Method Status Helper
```tsx
import { getStatusColor, getStatusLabel, getMindMapsStatusByProgress } from '../utils/methodStatus';

const status = getMindMapsStatusByProgress(60); // "Casi_terminando"
const color = getStatusColor(status); // "#3B82F6"
```

---

## 🎨 Paleta de Colores

```
Primary:     #8B5CF6 (Púrpura)
Secondary:   #06B6D4 (Cyan)
Success:     #10B981 (Verde)
Warning:     #F59E0B (Ámbar)
Error:       #EF4444 (Rojo)
Dark BG:     #070812 / #171717
Card:        #0B1020 / #232323
Text Primary: #E6EDFF
Text Secondary: #9AA7C7
```

---

## 🐛 Debug Tips

### Debugging en Desarrollo

```javascript
// En cualquier archivo
console.log('DEBUG:', value);

// Ver AsyncStorage
await AsyncStorage.multiGet(['token', 'userData']).then(console.log);

// Verificar estado de contexto
const { user } = useAuth();
console.log('Current user:', user);
```

### React Native DevTools
```bash
# Abrir menu de debug
Ctrl+M (Android) o Cmd+D (iOS)

# Opciones útiles:
- Show Inspector
- Network Monitor
- Redux DevTools (si usas Redux)
```

---

## 📝 Notas Importantes

1. **La pantalla de Perfil es React, no React Native** - NECESITA reescritura urgente
2. **API Client incompleto** - Falta autenticación en headers
3. **Sin validación de entrada de usuario** - Implementar sanitización
4. **Performance** - Sin optimización de imágenes ni lazy loading
5. **Testing** - Proyecto sin tests unitarios

---

## 🤝 Contacto y Soporte

Para preguntas sobre la arquitectura o implementación:
- Revisar comentarios en el código
- Consultar los tipos en `src/types/`
- Verificar los ejemplos en cada pantalla

---

## 📄 Licencia

Proyecto privado - FocusUpCell 2025

---

**Última actualización:** 1 Diciembre 2025

**Status:** En desarrollo - MVP con funcionalidades principales completadas
