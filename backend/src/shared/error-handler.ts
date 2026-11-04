import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from './errors.js';
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
 if (error instanceof ZodError) { res.status(400).json({ error: { codigo: 'ENTRADA_INVALIDA', mensaje: 'Revisa los parámetros enviados.', message: 'Revisa los parámetros enviados.', detalles: error.issues } }); return; }
 if (error instanceof AppError) { res.status(error.status).json({ error: { codigo: error.code, mensaje: error.message, message: error.message, detalles: error.details } }); return; }
 if (error instanceof SyntaxError && 'body' in error) { res.status(400).json({ error: { codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo debe ser JSON válido.', message: 'El cuerpo debe ser JSON válido.' } }); return; }
 if (error instanceof Prisma.PrismaClientInitializationError || (error instanceof Prisma.PrismaClientKnownRequestError && ['P1001','P1002','P2024','P2034'].includes(error.code))) {
  res.status(503).json({ error: { codigo: 'BD_NO_DISPONIBLE', mensaje: 'La base de datos no está disponible o la transacción no se pudo completar.', message: 'La base de datos no está disponible o la transacción no se pudo completar.' } }); return;
 }
 if (error instanceof Error && 'status' in error && error.status === 413) { res.status(413).json({ error: { codigo: 'CUERPO_DEMASIADO_GRANDE', mensaje: 'El cuerpo supera el tamaño permitido.', message: 'El cuerpo supera el tamaño permitido.' } }); return; }
 console.error('Error interno de la API:', error instanceof Error ? error.name : 'Error desconocido');
 res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'No se pudo completar la operación.', message: 'No se pudo completar la operación.' } });
};
