'use strict';

const mongoose = require('mongoose');
const createApp = require('./app');
const MongoProductoRepository = require('./repositories/mongo-producto.repository');
const MemoryProductoRepository = require('./repositories/memory-producto.repository');

const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/productosdb';

async function main() {
  let repository;
  if (process.env.REPOSITORY === 'memory') {
    console.log('Modo demostración: repositorio en memoria (sin MongoDB)');
    repository = new MemoryProductoRepository();
  } else {
    await mongoose.connect(MONGO_URI);
    console.log(`Conectado a MongoDB: ${MONGO_URI}`);
    repository = new MongoProductoRepository();
  }
  createApp(repository).listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}  (Swagger: /api-docs)`);
  });
}

main().catch((err) => {
  console.error('No se pudo iniciar la aplicación:', err.message);
  process.exit(1);
});
