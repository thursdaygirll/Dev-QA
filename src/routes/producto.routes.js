'use strict';

const express = require('express');
const crearControlador = require('../controllers/producto.controller');

/** Envuelve un handler async para enviar sus errores al manejador global. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function crearRutas(service) {
  const c = crearControlador(service);
  const router = express.Router();
  router.get('/', asyncHandler(c.listar));
  router.get('/:id', asyncHandler(c.obtener));
  router.post('/', asyncHandler(c.crear));
  router.put('/:id', asyncHandler(c.actualizar));
  router.delete('/:id', asyncHandler(c.eliminar));
  return router;
}

module.exports = crearRutas;
module.exports.asyncHandler = asyncHandler;
