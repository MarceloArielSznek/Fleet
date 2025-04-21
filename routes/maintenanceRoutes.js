const express = require('express');
const router = express.Router();
const Vehicle = require('../models/vehicle');

// Controlador temporal para mantenimiento mientras creamos el modelo y controlador real
const maintenanceController = {
  // Lista todos los registros de mantenimiento
  getAllMaintenanceRecords: (req, res) => {
    // Por ahora, solo mostramos la vista con un array vacío
    res.render('maintenance/index', { maintenanceRecords: [] });
  },

  // Muestra el formulario para crear un nuevo registro de mantenimiento
  getCreateForm: async (req, res) => {
    try {
      // Obtener todos los vehículos para el selector
      const vehicles = Vehicle.getAll();
      res.render('maintenance/create', { vehicles });
    } catch (error) {
      console.error('Error loading maintenance create form:', error);
      res.status(500).render('error', { 
        message: 'Could not load the maintenance form', 
        error: process.env.NODE_ENV === 'development' ? error : null 
      });
    }
  },

  // Procesa el formulario para crear un nuevo registro de mantenimiento
  createMaintenanceRecord: (req, res) => {
    // Aquí se procesará la creación del registro cuando implementemos el modelo
    console.log('Maintenance record creation requested:', req.body);
    // Redirigir directamente sin usar flash
    res.redirect('/maintenance');
  }
};

// Rutas
router.get('/', maintenanceController.getAllMaintenanceRecords);
router.get('/create', maintenanceController.getCreateForm);
router.post('/', maintenanceController.createMaintenanceRecord);

module.exports = router; 