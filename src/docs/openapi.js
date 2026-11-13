'use strict';

const productoInput = {
  type: 'object',
  required: ['codigo', 'nombre', 'precio', 'categoria'],
  properties: {
    codigo: { type: 'string', example: 'ABC-123', description: 'Formato AAA-123 (único)' },
    nombre: { type: 'string', example: 'Filtro de aceite', minLength: 3, maxLength: 100 },
    descripcion: { type: 'string', example: 'Filtro para motor 2.0L', maxLength: 255 },
    precio: { type: 'number', example: 149.9, exclusiveMinimum: 0 },
    stock: { type: 'integer', example: 25, minimum: 0 },
    categoria: { type: 'string', example: 'Refacciones', minLength: 2, maxLength: 50 },
  },
};

const errorRef = { content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } };
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string', example: '64b7f0c2a1b2c3d4e5f60718' } };
const body = { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductoInput' } } } };
const prodResp = (description) => ({ description, content: { 'application/json': { schema: { $ref: '#/components/schemas/Producto' } } } });

module.exports = {
  openapi: '3.0.3',
  info: { title: 'API de Productos (CRUD + MongoDB)', version: '1.0.0', description: 'Práctica 2 Dev-QA - Microservicio CRUD con manejo de errores, pruebas y calidad de código.' },
  paths: {
    '/api/productos': {
      get: {
        summary: 'Listar productos',
        parameters: [{ name: 'categoria', in: 'query', schema: { type: 'string' } }],
        responses: { 200: { description: 'Lista de productos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Producto' } } } } } },
      },
      post: {
        summary: 'Crear producto',
        requestBody: body,
        responses: { 201: prodResp('Producto creado'), 400: { description: 'Datos inválidos', ...errorRef }, 409: { description: 'Código duplicado', ...errorRef } },
      },
    },
    '/api/productos/{id}': {
      get: { summary: 'Obtener producto por id', parameters: [idParam], responses: { 200: prodResp('Producto'), 400: { description: 'Id inválido', ...errorRef }, 404: { description: 'No encontrado', ...errorRef } } },
      put: { summary: 'Actualizar producto (reemplazo completo)', parameters: [idParam], requestBody: body, responses: { 200: prodResp('Producto actualizado'), 400: { description: 'Datos inválidos', ...errorRef }, 404: { description: 'No encontrado', ...errorRef }, 409: { description: 'Código duplicado', ...errorRef } } },
      delete: { summary: 'Eliminar producto', parameters: [idParam], responses: { 204: { description: 'Eliminado' }, 400: { description: 'Id inválido', ...errorRef }, 404: { description: 'No encontrado', ...errorRef } } },
    },
  },
  components: {
    schemas: {
      ProductoInput: productoInput,
      Producto: { allOf: [{ type: 'object', properties: { id: { type: 'string' } } }, productoInput, { type: 'object', properties: { createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } }] },
      Error: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          status: { type: 'integer', example: 404 },
          error: { type: 'string', example: 'Not Found' },
          message: { type: 'string' },
          path: { type: 'string' },
          details: { type: 'array', items: { type: 'object', properties: { campo: { type: 'string' }, mensaje: { type: 'string' } } } },
        },
      },
    },
  },
};
