const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');

// Rutas para la gestión de mantenimiento
router.get('/', maintenanceController.getAllMaintenanceRecords);
router.get('/create', maintenanceController.getCreateForm);
router.post('/', maintenanceController.createMaintenanceRecord);
router.get('/:id', maintenanceController.getMaintenanceDetails);
router.get('/:id/edit', maintenanceController.getEditForm);
router.post('/:id', maintenanceController.updateMaintenanceRecord);
router.post('/:id/delete', maintenanceController.deleteMaintenanceRecord);
router.get('/vehicle/:vehicleId', maintenanceController.getMaintenanceRecordsByVehicle);

module.exports = router; 