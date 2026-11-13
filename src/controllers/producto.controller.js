'use strict';

/** Controlador HTTP: traduce peticiones a llamadas al servicio. */
function crearControlador(service) {
  return {
    listar: async (req, res) => {
      res.status(200).json(await service.listar({ categoria: req.query.categoria }));
    },
    obtener: async (req, res) => {
      res.status(200).json(await service.obtener(req.params.id));
    },
    crear: async (req, res) => {
      const creado = await service.crear(req.body);
      res.status(201).location(`/api/productos/${creado.id}`).json(creado);
    },
    actualizar: async (req, res) => {
      res.status(200).json(await service.actualizar(req.params.id, req.body));
    },
    eliminar: async (req, res) => {
      await service.eliminar(req.params.id);
      res.status(204).send();
    },
  };
}

module.exports = crearControlador;
