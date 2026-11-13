'use strict';

const request = require('supertest');
const createApp = require('../../src/app');
const MemoryProductoRepository = require('../../src/repositories/memory-producto.repository');

const nuevo = (extra = {}) => ({
  codigo: 'ABC-123',
  nombre: 'Filtro de aceite',
  descripcion: 'Filtro para motor 2.0L',
  precio: 149.9,
  stock: 25,
  categoria: 'Refacciones',
  ...extra,
});
const ID_INEXISTENTE = 'aaaaaaaaaaaaaaaaaaaaaaaa';

let app;
beforeEach(() => {
  app = createApp(new MemoryProductoRepository());
});

describe('POST /api/productos', () => {
  it('crea un producto: 201, Location y JSON serializado', async () => {
    const res = await request(app).post('/api/productos').send(nuevo());
    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.headers.location).toBe(`/api/productos/${res.body.id}`);
    expect(res.body).toMatchObject(nuevo());
    expect(res.body.id).toMatch(/^[0-9a-f]{24}$/);
    expect(res.body.createdAt).toBeDefined();
  });

  it('400 con detalle por campo cuando faltan datos', async () => {
    const res = await request(app).post('/api/productos').send({});
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 400, error: 'Bad Request', path: '/api/productos' });
    expect(res.body.details.map((d) => d.campo)).toEqual(['codigo', 'nombre', 'precio', 'categoria']);
  });

  it('400 con formato de código y precio inválidos', async () => {
    const res = await request(app).post('/api/productos').send(nuevo({ codigo: 'x', precio: -5 }));
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.campo)).toEqual(['codigo', 'precio']);
  });

  it('400 con JSON malformado', async () => {
    const res = await request(app).post('/api/productos').set('Content-Type', 'application/json').send('{"codigo": ');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/JSON/);
  });

  it('413 con cuerpo demasiado grande', async () => {
    const res = await request(app).post('/api/productos').send(nuevo({ descripcion: 'x'.repeat(200000) }));
    expect(res.status).toBe(413);
  });

  it('409 al repetir el código', async () => {
    await request(app).post('/api/productos').send(nuevo());
    const res = await request(app).post('/api/productos').send(nuevo({ nombre: 'Otro nombre' }));
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ status: 409, error: 'Conflict' });
    expect(res.body.message).toMatch(/ABC-123/);
  });
});

describe('GET /api/productos', () => {
  it('lista vacía al inicio', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('lista y filtra por categoría', async () => {
    await request(app).post('/api/productos').send(nuevo());
    await request(app).post('/api/productos').send(nuevo({ codigo: 'FRE-001', categoria: 'Frenos' }));
    expect((await request(app).get('/api/productos')).body).toHaveLength(2);
    const filtrado = await request(app).get('/api/productos').query({ categoria: 'Frenos' });
    expect(filtrado.body).toHaveLength(1);
    expect(filtrado.body[0].codigo).toBe('FRE-001');
  });
});

describe('GET /api/productos/:id', () => {
  it('200 con el producto', async () => {
    const { body: creado } = await request(app).post('/api/productos').send(nuevo());
    const res = await request(app).get(`/api/productos/${creado.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(creado.id);
  });

  it('404 si no existe', async () => {
    const res = await request(app).get(`/api/productos/${ID_INEXISTENTE}`);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ status: 404, error: 'Not Found' });
    expect(res.body.message).toContain(ID_INEXISTENTE);
  });

  it('400 si el id tiene formato inválido', async () => {
    const res = await request(app).get('/api/productos/123');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Identificador inválido');
  });
});

describe('PUT /api/productos/:id', () => {
  it('200 y refleja los cambios', async () => {
    const { body: creado } = await request(app).post('/api/productos').send(nuevo());
    const res = await request(app).put(`/api/productos/${creado.id}`).send(nuevo({ nombre: 'Filtro premium', precio: 199 }));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: creado.id, nombre: 'Filtro premium', precio: 199 });
    expect((await request(app).get(`/api/productos/${creado.id}`)).body.nombre).toBe('Filtro premium');
  });

  it('404 si no existe', async () => {
    const res = await request(app).put(`/api/productos/${ID_INEXISTENTE}`).send(nuevo());
    expect(res.status).toBe(404);
  });

  it('400 con datos inválidos', async () => {
    const { body: creado } = await request(app).post('/api/productos').send(nuevo());
    const res = await request(app).put(`/api/productos/${creado.id}`).send(nuevo({ stock: -1 }));
    expect(res.status).toBe(400);
    expect(res.body.details[0].campo).toBe('stock');
  });

  it('409 si el nuevo código ya pertenece a otro producto', async () => {
    await request(app).post('/api/productos').send(nuevo());
    const { body: otro } = await request(app).post('/api/productos').send(nuevo({ codigo: 'FRE-001' }));
    const res = await request(app).put(`/api/productos/${otro.id}`).send(nuevo());
    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/productos/:id', () => {
  it('204 y luego 404 al consultarlo', async () => {
    const { body: creado } = await request(app).post('/api/productos').send(nuevo());
    const del = await request(app).delete(`/api/productos/${creado.id}`);
    expect(del.status).toBe(204);
    expect(del.text).toBe('');
    expect((await request(app).get(`/api/productos/${creado.id}`)).status).toBe(404);
  });

  it('404 si no existe y 400 si el id es inválido', async () => {
    expect((await request(app).delete(`/api/productos/${ID_INEXISTENTE}`)).status).toBe(404);
    expect((await request(app).delete('/api/productos/abc')).status).toBe(400);
  });
});

describe('Otros endpoints', () => {
  it('GET /health -> 200', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toEqual({ status: 'UP' });
  });

  it('ruta inexistente -> 404 en formato JSON', async () => {
    const res = await request(app).get('/no-existe');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ status: 404, error: 'Not Found', path: '/no-existe' });
  });

  it('error inesperado del repositorio -> 500 genérico', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const repo = new MemoryProductoRepository();
    repo.findAll = async () => {
      throw new Error('fallo de base de datos');
    };
    const res = await request(createApp(repo)).get('/api/productos');
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Error interno del servidor');
    spy.mockRestore();
  });

  it('Swagger UI disponible en /api-docs/', async () => {
    const res = await request(app).get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });
});
