'use strict';

/** Error base de la aplicación: lleva el código HTTP asociado. */
class AppError extends Error {
  constructor(message, status = 500, details = []) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
  }
}

/** 404 - El recurso solicitado no existe. */
class RecursoNoEncontradoError extends AppError {
  constructor(recurso, id) {
    super(`${recurso} con id '${id}' no fue encontrado`, 404);
  }
}

/** 409 - Ya existe un recurso con el mismo dato único. */
class DatoDuplicadoError extends AppError {
  constructor(campo, valor) {
    super(`Ya existe un registro con ${campo} '${valor}'`, 409);
  }
}

/** 400 - Los datos de entrada no cumplen las reglas de validación. */
class ValidacionError extends AppError {
  constructor(details, message = 'Los datos enviados no son válidos') {
    super(message, 400, details);
  }
}

module.exports = {
  AppError,
  RecursoNoEncontradoError,
  DatoDuplicadoError,
  ValidacionError,
};
