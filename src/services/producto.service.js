'use strict';

const { RecursoNoEncontradoError, DatoDuplicadoError } = require('../errors');
const { validarProducto, validarId } = require('../validators/producto.validator');

const RECURSO = 'Producto';
const MONGO_DUPLICATE_KEY = 11000;

/** Lógica de negocio de productos; independiente del tipo de almacenamiento. */
class ProductoService {
  constructor(repository) {
    this.repository = repository;
  }

  async listar({ categoria } = {}) {
    const filtro = categoria ? { categoria } : {};
    return this.repository.findAll(filtro);
  }

  async obtener(id) {
    const idValido = validarId(id);
    const producto = await this.repository.findById(idValido);
    if (!producto) throw new RecursoNoEncontradoError(RECURSO, idValido);
    return producto;
  }

  async crear(body) {
    const datos = validarProducto(body);
    await this.#asegurarCodigoLibre(datos.codigo);
    try {
      return await this.repository.create(datos);
    } catch (err) {
      throw this.#traducirDuplicado(err, datos.codigo);
    }
  }

  async actualizar(id, body) {
    const idValido = validarId(id);
    const datos = validarProducto(body);
    const actual = await this.repository.findById(idValido);
    if (!actual) throw new RecursoNoEncontradoError(RECURSO, idValido);
    if (actual.codigo !== datos.codigo) await this.#asegurarCodigoLibre(datos.codigo);
    try {
      return await this.repository.update(idValido, datos);
    } catch (err) {
      throw this.#traducirDuplicado(err, datos.codigo);
    }
  }

  async eliminar(id) {
    const idValido = validarId(id);
    const eliminado = await this.repository.delete(idValido);
    if (!eliminado) throw new RecursoNoEncontradoError(RECURSO, idValido);
  }

  async #asegurarCodigoLibre(codigo) {
    if (await this.repository.findByCodigo(codigo)) {
      throw new DatoDuplicadoError('codigo', codigo);
    }
  }

  #traducirDuplicado(err, codigo) {
    return err && err.code === MONGO_DUPLICATE_KEY ? new DatoDuplicadoError('codigo', codigo) : err;
  }
}

module.exports = ProductoService;
