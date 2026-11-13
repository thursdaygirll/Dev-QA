'use strict';

const { errorHandler, notFoundHandler } = require('../../src/middleware/error-handler');
const { DatoDuplicadoError, ValidacionError, RecursoNoEncontradoError, AppError } = require('../../src/errors');

function ejecutar(err) {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  errorHandler(err, { originalUrl: '/api/productos' }, res, jest.fn());
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
}

describe('errorHandler', () => {
  it('mapea excepciones de negocio con su código HTTP', () => {
    expect(ejecutar(new DatoDuplicadoError('codigo', 'ABC-123')).status).toBe(409);
    expect(ejecutar(new RecursoNoEncontradoError('Producto', '1')).status).toBe(404);
    const { status, body } = ejecutar(new ValidacionError([{ campo: 'precio', mensaje: 'mal' }]));
    expect(status).toBe(400);
    expect(body).toMatchObject({ status: 400, error: 'Bad Request', path: '/api/productos' });
    expect(body.details).toEqual([{ campo: 'precio', mensaje: 'mal' }]);
    expect(typeof body.timestamp).toBe('string');
  });

  it('usa "Error" como razón para códigos no catalogados', () => {
    expect(ejecutar(new AppError('teapot', 418)).body.error).toBe('Error');
  });

  it('JSON malformado -> 400', () => {
    expect(ejecutar({ type: 'entity.parse.failed' })).toMatchObject({ status: 400 });
  });

  it('cuerpo demasiado grande -> 413', () => {
    expect(ejecutar({ type: 'entity.too.large' }).status).toBe(413);
  });

  it('ValidationError de Mongoose -> 400 con detalles', () => {
    const { status, body } = ejecutar({ name: 'ValidationError', errors: { precio: { path: 'precio', message: 'mal' } } });
    expect(status).toBe(400);
    expect(body.details).toEqual([{ campo: 'precio', mensaje: 'mal' }]);
  });

  it('clave duplicada de Mongo -> 409', () => {
    expect(ejecutar({ code: 11000 }).status).toBe(409);
  });

  it('error inesperado -> 500 sin filtrar detalles internos', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { status, body } = ejecutar(new Error('secreto interno'));
    expect(status).toBe(500);
    expect(body.message).toBe('Error interno del servidor');
    expect(JSON.stringify(body)).not.toContain('secreto');
    spy.mockRestore();
  });

  it('también maneja un error nulo', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(ejecutar(null).status).toBe(500);
    spy.mockRestore();
  });
});

describe('notFoundHandler', () => {
  it('genera un RecursoNoEncontradoError para rutas desconocidas', () => {
    const next = jest.fn();
    notFoundHandler({ method: 'GET', originalUrl: '/x' }, {}, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(RecursoNoEncontradoError);
  });
});
