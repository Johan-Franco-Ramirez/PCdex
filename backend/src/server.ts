import app from './app.js';
import dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[PCDex Backend]: Servidor ejecutándose exitosamente en el puerto ${PORT}`);
});