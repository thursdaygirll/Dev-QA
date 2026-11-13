'use strict';

const defaultModel = require('../models/producto.model');

/** Convierte un documento de Mongo en el objeto público de la API. */
function aDto(doc) {
  if (!doc) return null;
  const { _id, createdAt, updatedAt, ...resto } = doc;
  return { id: String(_id), ...resto, createdAt, updatedAt };
}

/** Repositorio de productos respaldado por MongoDB (Mongoose). */
class MongoProductoRepository {
  constructor(model = defaultModel) {
    this.model = model;
  }

  async findAll(filtro = {}) {
    const docs = await this.model.find(filtro).sort({ createdAt: 1 }).lean();
    return docs.map(aDto);
  }

  async findById(id) {
    return aDto(await this.model.findById(id).lean());
  }

  async findByCodigo(codigo) {
    return aDto(await this.model.findOne({ codigo }).lean());
  }

  async create(datos) {
    const doc = await this.model.create(datos);
    return aDto(doc.toObject());
  }

  async update(id, datos) {
    const doc = await this.model
      .findByIdAndUpdate(id, datos, { returnDocument: 'after', runValidators: true })
      .lean();
    return aDto(doc);
  }

  async delete(id) {
    return aDto(await this.model.findByIdAndDelete(id).lean());
  }
}

module.exports = MongoProductoRepository;
module.exports.aDto = aDto;
