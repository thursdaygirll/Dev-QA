'use strict';

const MongoProductoRepository = require('../../src/repositories/mongo-producto.repository');
const MemoryProductoRepository = require('../../src/repositories/memory-producto.repository');

const { aDto } = MongoProductoRepository;
const fecha = new Date('2026-01-01');
const doc = { _id: { toString: () => 'abc' }, codigo: 'ABC-123', createdAt: fecha, updatedAt: fecha };
const lean = (valor) => ({ lean: jest.fn().mockResolvedValue(valor) });

describe('MongoProductoRepository (modelo simulado)', () => {
  let model;
  let repo;

  beforeEach(() => {
    model = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    repo = new MongoProductoRepository(model);
  });

  it('aDto convierte _id en id y devuelve null si no hay documento', () => {
    expect(aDto(doc)).toEqual({ id: 'abc', codigo: 'ABC-123', createdAt: fecha, updatedAt: fecha });
    expect(aDto(null)).toBeNull();
  });

  it('findAll ordena y mapea', async () => {
    model.find.mockReturnValue({ sort: jest.fn().mockReturnValue(lean([doc])) });
    await expect(repo.findAll({ categoria: 'x' })).resolves.toEqual([aDto(doc)]);
    expect(model.find).toHaveBeenCalledWith({ categoria: 'x' });
  });

  it('findAll usa filtro vacío por defecto', async () => {
    model.find.mockReturnValue({ sort: jest.fn().mockReturnValue(lean([])) });
    await repo.findAll();
    expect(model.find).toHaveBeenCalledWith({});
  });

  it('findById y findByCodigo', async () => {
    model.findById.mockReturnValue(lean(doc));
    model.findOne.mockReturnValue(lean(null));
    await expect(repo.findById('abc')).resolves.toEqual(aDto(doc));
    await expect(repo.findByCodigo('ZZZ-999')).resolves.toBeNull();
    expect(model.findOne).toHaveBeenCalledWith({ codigo: 'ZZZ-999' });
  });

  it('create persiste y devuelve el DTO', async () => {
    model.create.mockResolvedValue({ toObject: () => doc });
    await expect(repo.create({ codigo: 'ABC-123' })).resolves.toEqual(aDto(doc));
  });

  it('update usa new + runValidators', async () => {
    model.findByIdAndUpdate.mockReturnValue(lean(doc));
    await repo.update('abc', { nombre: 'n' });
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith('abc', { nombre: 'n' }, { returnDocument: 'after', runValidators: true });
  });

  it('delete devuelve el eliminado o null', async () => {
    model.findByIdAndDelete.mockReturnValueOnce(lean(doc)).mockReturnValueOnce(lean(null));
    await expect(repo.delete('abc')).resolves.toEqual(aDto(doc));
    await expect(repo.delete('abc')).resolves.toBeNull();
  });

  it('usa el modelo real de Mongoose por defecto', () => {
    expect(new MongoProductoRepository().model.modelName).toBe('Producto');
  });
});

describe('MemoryProductoRepository', () => {
  let repo;
  beforeEach(() => {
    repo = new MemoryProductoRepository();
  });

  it('realiza el ciclo CRUD completo', async () => {
    const creado = await repo.create({ codigo: 'ABC-123', categoria: 'A' });
    expect(creado.id).toMatch(/^[0-9a-f]{24}$/);
    await expect(repo.findById(creado.id)).resolves.toMatchObject({ codigo: 'ABC-123' });
    await expect(repo.findByCodigo('ABC-123')).resolves.toMatchObject({ id: creado.id });
    await expect(repo.findAll({ categoria: 'A' })).resolves.toHaveLength(1);
    await expect(repo.findAll({ categoria: 'B' })).resolves.toHaveLength(0);
    await expect(repo.findAll()).resolves.toHaveLength(1);
    await expect(repo.update(creado.id, { categoria: 'B' })).resolves.toMatchObject({ categoria: 'B', id: creado.id });
    await expect(repo.delete(creado.id)).resolves.toMatchObject({ id: creado.id });
    await expect(repo.findById(creado.id)).resolves.toBeNull();
  });

  it('devuelve null para ids o códigos inexistentes', async () => {
    await expect(repo.findByCodigo('NOP-000')).resolves.toBeNull();
    await expect(repo.update('x', {})).resolves.toBeNull();
    await expect(repo.delete('x')).resolves.toBeNull();
  });
});
