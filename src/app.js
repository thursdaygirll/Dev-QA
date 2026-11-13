'use strict';

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const crearRutas = require('./routes/producto.routes');
const ProductoService = require('./services/producto.service');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
const openapi = require('./docs/openapi');

/** Construye la aplicación Express a partir de un repositorio (inyección de dependencias). */
function createApp(repository) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => res.status(200).json({ status: 'UP' }));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));
  app.use('/api/productos', crearRutas(new ProductoService(repository)));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
