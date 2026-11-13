# Productos API — Práctica 2 Dev-QA (HU-01)

Microservicio RESTful CRUD de **productos** con **Node.js + Express + MongoDB (Mongoose)**, manejo global de errores, pruebas unitarias y de integración (Jest + Supertest), cobertura con Jest/Istanbul (equivalente a JaCoCo) y análisis estático con SonarQube.

## Requisitos
- Node.js 20 o superior
- MongoDB 7 (local o con Docker) — solo para ejecutar la API contra base real
- Docker (opcional, para MongoDB y SonarQube)

## Instalación y ejecución
```bash
npm install
docker compose up -d mongo        # MongoDB en localhost:27017
npm start                         # API en http://localhost:3000
```
Variables opcionales: `PORT` (3000) y `MONGO_URI` (`mongodb://localhost:27017/productosdb`).

Modo demostración sin MongoDB (repositorio en memoria): `npm run start:demo`.

Documentación interactiva (Swagger UI): http://localhost:3000/api-docs

## Endpoints
| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| POST | `/api/productos` | Crear | 201, 400, 409 |
| GET | `/api/productos[?categoria=X]` | Listar / filtrar | 200 |
| GET | `/api/productos/:id` | Obtener por id | 200, 400, 404 |
| PUT | `/api/productos/:id` | Reemplazo completo | 200, 400, 404, 409 |
| DELETE | `/api/productos/:id` | Eliminar | 204, 400, 404 |
| GET | `/health` | Estado | 200 |

Ejemplo:
```bash
curl -X POST localhost:3000/api/productos -H 'Content-Type: application/json' \
  -d '{"codigo":"ABC-123","nombre":"Filtro de aceite","precio":149.9,"stock":25,"categoria":"Refacciones"}'
```

### Reglas de validación
`codigo` obligatorio con formato `AAA-123` y único · `nombre` 3–100 caracteres · `descripcion` ≤ 255 · `precio` número > 0 · `stock` entero ≥ 0 (default 0) · `categoria` 2–50 caracteres.

### Errores (JSON)
Excepciones personalizadas (`RecursoNoEncontradoError` → 404, `DatoDuplicadoError` → 409, `ValidacionError` → 400) interceptadas por un manejador global (`src/middleware/error-handler.js`, equivalente a `@RestControllerAdvice`). También cubre JSON malformado (400), cuerpo excesivo (413), rutas inexistentes (404) y fallos inesperados (500 sin filtrar detalles internos).
```json
{ "timestamp": "...", "status": 409, "error": "Conflict",
  "message": "Ya existe un registro con codigo 'ABC-123'", "path": "/api/productos", "details": [] }
```

## Arquitectura
```
src/
  app.js                 Fábrica de Express (inyección del repositorio)
  server.js              Arranque y conexión a MongoDB
  routes/ controllers/   Capa HTTP
  services/              Lógica de negocio
  validators/            Validaciones de entrada
  repositories/          Mongo (Mongoose) y en memoria, mismo contrato
  models/                Esquema Mongoose (índice único en codigo)
  errors/ middleware/    Excepciones de dominio y manejador global
tests/unit | tests/integration
```

## Pruebas y cobertura
```bash
npm test                  # unitarias + integración HTTP (repositorio en memoria)
npm run test:coverage     # + reporte en coverage/lcov-report/index.html (umbral 80%)
npm run test:mongo        # además, integración contra MongoDB real (mongodb-memory-server o MONGO_TEST_URI)
npm run lint              # ESLint
```
- **Unitarias:** servicio con repositorio simulado (`jest.fn`, equivalente a Mockito), validador, manejador de errores, repositorios.
- **Integración:** flujo completo de cada endpoint con Supertest (serialización JSON, códigos HTTP, cabecera `Location`).
- **Integración con Mongo real:** `tests/integration/mongo.integration.test.js` (se omite por defecto; actívala con `npm run test:mongo`).
- Umbral global de 80 % (líneas, ramas, funciones, sentencias) forzado en `jest.config.js`: la build falla si no se cumple.

## SonarQube
```bash
docker compose up -d sonarqube        # http://localhost:9000  (admin / admin, cambiar al ingresar)
npm run test:coverage                 # genera coverage/lcov.info
# Crear un token en SonarQube (My Account > Security) y ejecutar:
npx sonar-scanner -Dsonar.token=<TOKEN>
```
La configuración está en `sonar-project.properties` (fuentes, pruebas y reporte LCOV).
