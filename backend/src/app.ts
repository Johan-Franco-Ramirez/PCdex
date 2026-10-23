import express, { Application, Request, Response } from 'express';
import cors from 'cors';

const app: Application = express();

// Middlewares globales esenciales
app.use(cors());
app.use(express.json());

// Endpoint de salud (Health Check) - Vital para verificar disponibilidad y Docker
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    project: 'PCdex API',
    message: 'El backend de PCdex está operando correctamente',
    timestamp: new Date().toISOString(),
  });
});

export default app;