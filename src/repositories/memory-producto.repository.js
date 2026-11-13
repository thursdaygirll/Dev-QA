'use strict';

const { randomBytes } = require('node:crypto');

/**
 * Repositorio en memoria con el mismo contrato que MongoProductoRepository.
 * Se usa para pruebas de integración HTTP rápidas y para demostraciones sin base de datos.
 */
class MemoryProductoRepository {
  constructor() {
    this.items = new Map();
  }

  async findAll(filtro = {}) {
    return [...this.items.values()]
      .filter((p) => Object.entries(filtro).every(([k, v]) => p[k] === v))
      .map((p) => ({ ...p }));
  }

  async findById(id) {
    const p = this.items.get(id);
    return p ? { ...p } : null;
  }

  async findByCodigo(codigo) {
    const p = [...this.items.values()].find((x) => x.codigo === codigo);
    return p ? { ...p } : null;
  }

  async create(datos) {
    const ahora = new Date();
    const p = { id: randomBytes(12).toString('hex'), ...datos, createdAt: ahora, updatedAt: ahora };
    this.items.set(p.id, p);
    return { ...p };
  }

  async update(id, datos) {
    const actual = this.items.get(id);
    if (!actual) return null;
    const p = { ...actual, ...datos, id, updatedAt: new Date() };
    this.items.set(id, p);
    return { ...p };
  }

  async delete(id) {
    const p = this.items.get(id);
    if (!p) return null;
    this.items.delete(id);
    return { ...p };
  }
}

module.exports = MemoryProductoRepository;
