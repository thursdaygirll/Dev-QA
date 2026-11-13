'use strict';

const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: [true, 'El código es obligatorio'],
      unique: true,
      trim: true,
      match: [/^[A-Z]{3}-\d{3}$/, 'Formato de código inválido'],
    },
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, minlength: 3, maxlength: 100 },
    descripcion: { type: String, default: '', trim: true, maxlength: 255 },
    precio: { type: Number, required: [true, 'El precio es obligatorio'], min: [0.01, 'El precio debe ser mayor a 0'] },
    stock: { type: Number, default: 0, min: 0, validate: { validator: Number.isInteger, message: 'El stock debe ser entero' } },
    categoria: { type: String, required: [true, 'La categoría es obligatoria'], trim: true, minlength: 2, maxlength: 50 },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.models.Producto || mongoose.model('Producto', productoSchema);
