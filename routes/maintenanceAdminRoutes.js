const express = require('express');
const router = express.Router();
const maintenanceAdminController = require('../controllers/maintenanceAdminController');

// Dashboard principal de administración
router.get('/', maintenanceAdminController.getAdminDashboard);

// ========== Rutas para servicios personalizados ==========
// Mostrar formulario para crear nuevo servicio
router.get('/services/create', maintenanceAdminController.getCreateServiceForm);
// Procesar creación de servicio
router.post('/services/create', maintenanceAdminController.createCustomService);
// Mostrar formulario para editar servicio
router.get('/services/:id/edit', maintenanceAdminController.getEditServiceForm);
// Procesar actualización de servicio
router.post('/services/:id/edit', maintenanceAdminController.updateServiceType);
// Eliminar servicio
router.post('/services/:id/delete', maintenanceAdminController.deleteServiceType);

// ========== Rutas para reglas de mantenimiento ==========
// Mostrar formulario para crear nueva regla
router.get('/rules/create', maintenanceAdminController.getCreateRuleForm);
// Procesar creación de regla
router.post('/rules/create', maintenanceAdminController.createMaintenanceRule);
// Mostrar formulario para editar regla
router.get('/rules/:id/edit', maintenanceAdminController.getEditRuleForm);
// Procesar actualización de regla
router.post('/rules/:id/edit', maintenanceAdminController.updateMaintenanceRule);
// Cambiar estado de regla (activar/desactivar)
router.post('/rules/:id/toggle', maintenanceAdminController.toggleRuleStatus);
// Eliminar regla
router.post('/rules/:id/delete', maintenanceAdminController.deleteMaintenanceRule);

module.exports = router; 