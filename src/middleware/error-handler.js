'use strict';

const { AppError, RecursoNoEncontradoError } = require('../errors');

const REASON = {
  400: 'Bad Request',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  500: 'Internal Server Error',
};

/** Rutas inexistentes -> 404 con el mismo formato JSON. */
function notFoundHandler(req, res, next) {
  next(new RecursoNoEncontradoError('Ruta', `${req.method} ${req.originalUrl}`));
}

/**
 * Manejador global de errores (equivalente a @RestControllerAdvice).
 * Intercepta excepciones de negocio, errores de validación y fallos inesperados.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = 500;
  let message = 'Error interno del servidor';
  let details = [];

  if (err instanceof AppError) {
    ({ status, message, details } = err);
  } else if (err && err.type === 'entity.parse.failed') {
    status = 400;
    message = 'El cuerpo de la petición no es un JSON válido';
  } else if (err && err.type === 'entity.too.large') {
    status = 413;
    message = 'El cuerpo de la petición excede el tamaño permitido';
  } else if (err && err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = 'Los datos enviados no son válidos';
    details = Object.values(err.errors).map((e) => ({ campo: e.path, mensaje: e.message }));
  } else if (err && err.code === 11000) {
    status = 409;
    message = 'Ya existe un registro con un valor único repetido';
  } else {
    console.error(err);
  }

  res.status(status).json({
    timestamp: new Date().toISOString(),
    status,
    error: REASON[status] || 'Error',
    message,
    path: req.originalUrl,
    details,
  });
}

module.exports = { errorHandler, notFoundHandler };
