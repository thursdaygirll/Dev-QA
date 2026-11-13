'use strict';

/**
 * Integración contra MongoDB REAL (mongodb-memory-server descarga un mongod local,
 * o usa MONGO_TEST_URI si se define). Se activa con: npm run test:mongo
 */
const mongoose = require('mongoose');
const request = require('supertest');
const createApp = require('../../src/app');
const MongoProductoRepository = require('../../src/repositories/mongo-producto.repository');

const habilitado = process.env.RUN_MONGO_IT === 'true';
const suite = habilitado ? describe : describe.skip;

suite('API + MongoDB real', () => {
  let mongod;
  let app;

  beforeAll(async () => {
    let uri = process.env.MONGO_TEST_URI;
    if (!uri) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
    }
    await mongoose.connect(uri);
    await require('../../src/models/producto.model').init();
    app = createApp(new MongoProductoRepository());
  }, 120000);

  afterEach(async () => {
    await mongoose.connection.db.collection('productos').deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  const body = { codigo: 'ABC-123', nombre: 'Filtro de aceite', precio: 10, categoria: 'Refacciones' };

  it('CRUD completo persistido en Mongo', async () => {
    const creado = await request(app).post('/api/productos').send(body);
    expect(creado.status).toBe(201);
    const { id } = creado.body;
    expect((await request(app).get(`/api/productos/${id}`)).body.codigo).toBe('ABC-123');
    expect((await request(app).put(`/api/productos/${id}`).send({ ...body, precio: 20 })).body.precio).toBe(20);
    expect((await request(app).get('/api/productos')).body).toHaveLength(1);
    expect((await request(app).delete(`/api/productos/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/productos/${id}`)).status).toBe(404);
  });

  it('índice único de Mongo -> 409 en código repetido', async () => {
    await request(app).post('/api/productos').send(body);
    expect((await request(app).post('/api/productos').send(body)).status).toBe(409);
  });
});
