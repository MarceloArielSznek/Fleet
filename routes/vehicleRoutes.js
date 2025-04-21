const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const vehicleController = require('../controllers/vehicleController');

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/vehicles');
  },
  filename: (req, file, cb) => {
    // Generar un nombre único para la imagen
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'vehicle-' + uniqueSuffix + ext);
  }
});

// Filtrado de archivos
const fileFilter = (req, file, cb) => {
  // Aceptar solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('El archivo debe ser una imagen válida.'), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite de 5MB
  },
  fileFilter: fileFilter
});

// Rutas para la aplicación web
router.get('/', vehicleController.getAllVehicles);
router.get('/create', vehicleController.getCreateForm);
router.post('/', upload.single('vehicleImage'), vehicleController.createVehicle);
router.get('/:id', vehicleController.getVehicleDetails);
router.get('/:id/edit', vehicleController.getEditForm);
router.post('/:id', upload.single('vehicleImage'), vehicleController.updateVehicle);
router.post('/:id/delete', vehicleController.deleteVehicle);

// Rutas para la API
router.get('/api/vehicles', vehicleController.getVehiclesAPI);

module.exports = router; 