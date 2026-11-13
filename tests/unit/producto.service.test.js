'use strict';

const ProductoService = require('../../src/services/producto.service');
const { RecursoNoEncontradoError, DatoDuplicadoError, ValidacionError } = require('../../src/errors');

const ID = '64b7f0c2a1b2c3d4e5f60718';
const body = { codigo: 'ABC-123', nombre: 'Filtro de aceite', precio: 10, categoria: 'Refacciones' };
const guardado = { id: ID, ...body, descripcion: '', stock: 0 };

let repo;
let service;

beforeEach(() => {
  repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCodigo: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  service = new ProductoService(repo);
});

describe('listar', () => {
  it('lista todos sin filtro', async () => {
    repo.findAll.mockResolvedValue([guardado]);
    await expect(service.listar()).resolves.toEqual([guardado]);
    expect(repo.findAll).toHaveBeenCalledWith({});
  });

  it('filtra por categoría', async () => {
    repo.findAll.mockResolvedValue([]);
    await service.listar({ categoria: 'Frenos' });
    expect(repo.findAll).toHaveBeenCalledWith({ categoria: 'Frenos' });
  });
});

describe('obtener', () => {
  it('devuelve el producto existente', async () => {
    repo.findById.mockResolvedValue(guardado);
    await expect(service.obtener(ID)).resolves.toBe(guardado);
  });

  it('lanza RecursoNoEncontradoError si no existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.obtener(ID)).rejects.toBeInstanceOf(RecursoNoEncontradoError);
  });

  it('lanza ValidacionError si el id es inválido y no consulta el repositorio', async () => {
    await expect(service.obtener('abc')).rejects.toBeInstanceOf(ValidacionError);
    expect(repo.findById).not.toHaveBeenCalled();
  });
});

describe('crear', () => {
  it('crea un producto nuevo', async () => {
    repo.findByCodigo.mockResolvedValue(null);
    repo.create.mockResolvedValue(guardado);
    await expect(service.crear(body)).resolves.toBe(guardado);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ codigo: 'ABC-123', stock: 0 }));
  });

  it('lanza DatoDuplicadoError si el código ya existe', async () => {
    repo.findByCodigo.mockResolvedValue(guardado);
    await expect(service.crear(body)).rejects.toBeInstanceOf(DatoDuplicadoError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('lanza ValidacionError con datos inválidos', async () => {
    await expect(service.crear({})).rejects.toBeInstanceOf(ValidacionError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('traduce la clave duplicada de Mongo (condición de carrera) a DatoDuplicadoError', async () => {
    repo.findByCodigo.mockResolvedValue(null);
    repo.create.mockRejectedValue({ code: 11000 });
    await expect(service.crear(body)).rejects.toBeInstanceOf(DatoDuplicadoError);
  });

  it('propaga errores inesperados del repositorio', async () => {
    repo.findByCodigo.mockResolvedValue(null);
    const fallo = new Error('db caída');
    repo.create.mockRejectedValue(fallo);
    await expect(service.crear(body)).rejects.toBe(fallo);
  });
});

describe('actualizar', () => {
  it('actualiza sin revisar duplicados si el código no cambia', async () => {
    repo.findById.mockResolvedValue(guardado);
    repo.update.mockResolvedValue({ ...guardado, nombre: 'Nuevo nombre' });
    const r = await service.actualizar(ID, { ...body, nombre: 'Nuevo nombre' });
    expect(r.nombre).toBe('Nuevo nombre');
    expect(repo.findByCodigo).not.toHaveBeenCalled();
  });

  it('lanza DatoDuplicadoError si el nuevo código pertenece a otro producto', async () => {
    repo.findById.mockResolvedValue(guardado);
    repo.findByCodigo.mockResolvedValue({ id: 'otro' });
    await expect(service.actualizar(ID, { ...body, codigo: 'XYZ-999' })).rejects.toBeInstanceOf(DatoDuplicadoError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('permite cambiar a un código libre', async () => {
    repo.findById.mockResolvedValue(guardado);
    repo.findByCodigo.mockResolvedValue(null);
    repo.update.mockResolvedValue({ ...guardado, codigo: 'XYZ-999' });
    await expect(service.actualizar(ID, { ...body, codigo: 'XYZ-999' })).resolves.toMatchObject({ codigo: 'XYZ-999' });
  });

  it('lanza RecursoNoEncontradoError si no existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.actualizar(ID, body)).rejects.toBeInstanceOf(RecursoNoEncontradoError);
  });

  it('valida id y cuerpo', async () => {
    await expect(service.actualizar('x', body)).rejects.toBeInstanceOf(ValidacionError);
    await expect(service.actualizar(ID, {})).rejects.toBeInstanceOf(ValidacionError);
  });

  it('traduce clave duplicada de Mongo y propaga otros errores', async () => {
    repo.findById.mockResolvedValue(guardado);
    repo.update.mockRejectedValueOnce({ code: 11000 });
    await expect(service.actualizar(ID, body)).rejects.toBeInstanceOf(DatoDuplicadoError);
    const fallo = new Error('boom');
    repo.update.mockRejectedValueOnce(fallo);
    await expect(service.actualizar(ID, body)).rejects.toBe(fallo);
  });
});

describe('eliminar', () => {
  it('elimina un producto existente', async () => {
    repo.delete.mockResolvedValue(guardado);
    await expect(service.eliminar(ID)).resolves.toBeUndefined();
  });

  it('lanza RecursoNoEncontradoError si no existe', async () => {
    repo.delete.mockResolvedValue(null);
    await expect(service.eliminar(ID)).rejects.toBeInstanceOf(RecursoNoEncontradoError);
  });

  it('lanza ValidacionError con id inválido', async () => {
    await expect(service.eliminar('1')).rejects.toBeInstanceOf(ValidacionError);
  });
});
