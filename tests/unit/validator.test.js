'use strict';

const { validarProducto, validarId } = require('../../src/validators/producto.validator');
const { ValidacionError } = require('../../src/errors');

const valido = { codigo: 'ABC-123', nombre: 'Filtro de aceite', precio: 99.5, categoria: 'Refacciones' };

const campos = (fn) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ValidacionError);
    expect(e.status).toBe(400);
    return e.details.map((d) => d.campo);
  }
  throw new Error('Se esperaba ValidacionError');
};

describe('validarProducto', () => {
  it('acepta un producto válido y aplica valores por defecto', () => {
    expect(validarProducto({ ...valido, extra: 'x' })).toEqual({
      codigo: 'ABC-123', nombre: 'Filtro de aceite', descripcion: '', precio: 99.5, stock: 0, categoria: 'Refacciones',
    });
  });

  it('recorta espacios y conserva descripción y stock', () => {
    const r = validarProducto({ ...valido, nombre: '  Filtro  ', descripcion: ' desc ', stock: 5 });
    expect(r).toMatchObject({ nombre: 'Filtro', descripcion: 'desc', stock: 5 });
  });

  it.each([null, undefined, 'texto', 5, []])('rechaza cuerpo no-objeto: %p', (body) => {
    expect(campos(() => validarProducto(body))).toEqual(['body']);
  });

  it('reporta todos los campos obligatorios faltantes', () => {
    expect(campos(() => validarProducto({}))).toEqual(['codigo', 'nombre', 'precio', 'categoria']);
  });

  it.each(['abc-123', 'AB-123', 'ABC123', 'ABC-12', 'ABCD-123'])('rechaza código con formato inválido %s', (codigo) => {
    expect(campos(() => validarProducto({ ...valido, codigo }))).toEqual(['codigo']);
  });

  it.each(['ab', 'x'.repeat(101), '   '])('rechaza nombre inválido', (nombre) => {
    expect(campos(() => validarProducto({ ...valido, nombre }))).toEqual(['nombre']);
  });

  it('rechaza descripción demasiado larga o no textual', () => {
    expect(campos(() => validarProducto({ ...valido, descripcion: 'x'.repeat(256) }))).toEqual(['descripcion']);
    expect(campos(() => validarProducto({ ...valido, descripcion: 7 }))).toEqual(['descripcion']);
  });

  it.each([0, -1, '10', NaN, Infinity, null])('rechaza precio inválido %p', (precio) => {
    expect(campos(() => validarProducto({ ...valido, precio }))).toEqual(['precio']);
  });

  it.each([-1, 1.5, '3'])('rechaza stock inválido %p', (stock) => {
    expect(campos(() => validarProducto({ ...valido, stock }))).toEqual(['stock']);
  });

  it.each(['a', 'x'.repeat(51), '', 5])('rechaza categoría inválida %p', (categoria) => {
    expect(campos(() => validarProducto({ ...valido, categoria }))).toEqual(['categoria']);
  });
});

describe('validarId', () => {
  it('acepta 24 caracteres hexadecimales', () => {
    expect(validarId('64b7f0c2a1b2c3d4e5f60718')).toBe('64b7f0c2a1b2c3d4e5f60718');
  });

  it.each(['123', 'zzzzzzzzzzzzzzzzzzzzzzzz', '', undefined])('rechaza id inválido %p', (id) => {
    expect(campos(() => validarId(id))).toEqual(['id']);
  });
});
