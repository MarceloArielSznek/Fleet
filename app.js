require('dotenv').config();
const express = require('express');
const path = require('path');

// Importar rutas
const vehicleRoutes = require('./routes/vehicleRoutes');

// Importar controladores
const vehicleController = require('./controllers/vehicleController');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rutas
app.use('/vehicles', vehicleRoutes);

// Ruta principal - Página de inicio
app.get('/', vehicleController.getHomePage);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    error: err,
    message: 'Ocurrió un error en el servidor' 
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).render('error', { 
    error: null,
    message: 'Página no encontrada' 
  });
}); 