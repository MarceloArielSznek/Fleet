const express = require('express');
const router = express.Router();
const weeklyUpdateController = require('../controllers/weeklyUpdateController');

// Ruta principal para la vista Weekly Update
router.get('/', weeklyUpdateController.getWeeklyUpdateView);

// Ruta para actualizar el kilometraje de un vehículo
router.post('/update-mileage/:id', weeklyUpdateController.updateVehicleMileage);

// Ruta para actualizar múltiples vehículos a la vez
router.post('/update-multiple', weeklyUpdateController.updateMultipleVehicles);

module.exports = router; 