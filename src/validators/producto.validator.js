'use strict';

const { ValidacionError } = require('../errors');

const CODIGO_REGEX = /^[A-Z]{3}-\d{3}$/;
const ID_REGEX = /^[0-9a-fA-F]{24}$/;

const esTexto = (v) => typeof v === 'string';

function validarCodigo(body, errores) {
  if (!esTexto(body.codigo) || body.codigo.trim() === '') {
    errores.push({ campo: 'codigo', mensaje: 'El código es obligatorio' });
  } else if (!CODIGO_REGEX.test(body.codigo.trim())) {
    errores.push({
      campo: 'codigo',
      mensaje: 'El código debe tener el formato AAA-123 (3 letras mayúsculas, guion y 3 dígitos)',
    });
  }
}

function validarNombre(body, errores) {
  if (!esTexto(body.nombre) || body.nombre.trim() === '') {
    errores.push({ campo: 'nombre', mensaje: 'El nombre es obligatorio' });
  } else if (body.nombre.trim().length < 3 || body.nombre.trim().length > 100) {
    errores.push({ campo: 'nombre', mensaje: 'El nombre debe tener entre 3 y 100 caracteres' });
  }
}

function validarDescripcion(body, errores) {
  if (body.descripcion === undefined) return;
  if (!esTexto(body.descripcion) || body.descripcion.length > 255) {
    errores.push({
      campo: 'descripcion',
      mensaje: 'La descripción debe ser texto de máximo 255 caracteres',
    });
  }
}

function validarPrecio(body, errores) {
  if (body.precio === undefined || body.precio === null) {
    errores.push({ campo: 'precio', mensaje: 'El precio es obligatorio' });
  } else if (typeof body.precio !== 'number' || !Number.isFinite(body.precio) || body.precio <= 0) {
    errores.push({ campo: 'precio', mensaje: 'El precio debe ser un número mayor a 0' });
  }
}

function validarStock(body, errores) {
  if (body.stock === undefined) return;
  if (!Number.isInteger(body.stock) || body.stock < 0) {
    errores.push({ campo: 'stock', mensaje: 'El stock debe ser un entero mayor o igual a 0' });
  }
}

function validarCategoria(body, errores) {
  if (!esTexto(body.categoria) || body.categoria.trim() === '') {
    errores.push({ campo: 'categoria', mensaje: 'La categoría es obligatoria' });
  } else if (body.categoria.trim().length < 2 || body.categoria.trim().length > 50) {
    errores.push({ campo: 'categoria', mensaje: 'La categoría debe tener entre 2 y 50 caracteres' });
  }
}

/**
 * Valida el cuerpo de un producto (alta o reemplazo completo).
 * Devuelve el objeto limpio (sin campos desconocidos y con strings recortados)
 * o lanza ValidacionError con el detalle de cada campo inválido.
 */
function validarProducto(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidacionError([{ campo: 'body', mensaje: 'El cuerpo debe ser un objeto JSON' }]);
  }
  const errores = [];
  validarCodigo(body, errores);
  validarNombre(body, errores);
  validarDescripcion(body, errores);
  validarPrecio(body, errores);
  validarStock(body, errores);
  validarCategoria(body, errores);
  if (errores.length > 0) throw new ValidacionError(errores);

  return {
    codigo: body.codigo.trim(),
    nombre: body.nombre.trim(),
    descripcion: body.descripcion === undefined ? '' : body.descripcion.trim(),
    precio: body.precio,
    stock: body.stock === undefined ? 0 : body.stock,
    categoria: body.categoria.trim(),
  };
}

/** Valida que el id tenga formato de ObjectId de MongoDB (24 hex). */
function validarId(id) {
  if (!ID_REGEX.test(String(id))) {
    throw new ValidacionError([{ campo: 'id', mensaje: 'El id debe ser un identificador de 24 caracteres hexadecimales' }], 'Identificador inválido');
  }
  return String(id);
}

module.exports = { validarProducto, validarId };
