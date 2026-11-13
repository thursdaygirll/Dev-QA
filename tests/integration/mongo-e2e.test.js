'use strict';

/**
 * Pruebas de integración contra una instancia REAL de MongoDB.
 *
 * Se ejecutan con el runner nativo de Node (`npm run test:mongo`) y no con Jest,
 * porque el entorno aislado de Jest altera los metadatos del handshake del driver
 * de MongoDB y el servidor rechaza la conexión
 * ("Missing required sub-document 'driver' in the client metadata document").
 *
 * Requiere un mongod escuchando en MONGO_TEST_URI (por defecto, el local).
 */
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');

const createApp = require('../../src/app');
const MongoProductoRepository = require('../../src/repositories/mongo-producto.repository');
const Producto = require('../../src/models/producto.model');

const URI = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/productos_test';
const nuevo = (extra = {}) => ({
  codigo: 'ABC-123',
  nombre: 'Filtro de aceite',
  descripcion: 'Filtro para motor 2.0L',
  precio: 149.9,
  stock: 25,
  categoria: 'Refacciones',
  ...extra,
});

let app;

before(async () => {
  await mongoose.connect(URI);
  await Producto.init();
  app = createApp(new MongoProductoRepository());
});

beforeEach(async () => {
  await Producto.deleteMany({});
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('POST persiste el producto en MongoDB y responde 201', async () => {
  const res = await request(app).post('/api/productos').send(nuevo());
  assert.equal(res.status, 201);
  assert.match(res.body.id, /^[0-9a-f]{24}$/);

  const enBase = await Producto.findById(res.body.id).lean();
  assert.equal(enBase.codigo, 'ABC-123');
  assert.equal(enBase.precio, 149.9);
});

test('GET devuelve el producto leído de MongoDB', async () => {
  const { body: creado } = await request(app).post('/api/productos').send(nuevo());
  const res = await request(app).get(`/api/productos/${creado.id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.codigo, 'ABC-123');
});

test('PUT actualiza el documento persistido', async () => {
  const { body: creado } = await request(app).post('/api/productos').send(nuevo());
  const res = await request(app).put(`/api/productos/${creado.id}`).send(nuevo({ precio: 199 }));
  assert.equal(res.status, 200);
  assert.equal((await Producto.findById(creado.id).lean()).precio, 199);
});

test('DELETE elimina el documento de la colección', async () => {
  const { body: creado } = await request(app).post('/api/productos').send(nuevo());
  assert.equal((await request(app).delete(`/api/productos/${creado.id}`)).status, 204);
  assert.equal(await Producto.findById(creado.id), null);
  assert.equal((await request(app).get(`/api/productos/${creado.id}`)).status, 404);
});

test('el índice único de MongoDB impide códigos repetidos (409)', async () => {
  await request(app).post('/api/productos').send(nuevo());
  const res = await request(app).post('/api/productos').send(nuevo({ nombre: 'Otro filtro' }));
  assert.equal(res.status, 409);
  assert.equal(res.body.error, 'Conflict');
  assert.equal(await Producto.countDocuments({ codigo: 'ABC-123' }), 1);
});

test('las validaciones del modelo rechazan datos inválidos (400)', async () => {
  const res = await request(app).post('/api/productos').send(nuevo({ precio: -1 }));
  assert.equal(res.status, 400);
  assert.equal(res.body.details[0].campo, 'precio');
  assert.equal(await Producto.countDocuments({}), 0);
});
