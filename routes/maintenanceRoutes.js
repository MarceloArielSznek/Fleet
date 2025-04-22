const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const multer = require('multer');
const path = require('path');

// Importar las rutas de administración de mantenimiento
const maintenanceAdminRoutes = require('./maintenanceAdminRoutes');

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/documents/maintenance');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limitar a 5MB
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, GIF) y documentos (PDF, DOC, DOCX)'));
    }
  }
});

// Rutas para la gestión de mantenimiento
router.get('/', maintenanceController.getAllMaintenanceRecords);
router.get('/create', maintenanceController.getCreateForm);
router.post('/', maintenanceController.createMaintenanceRecord);

// Usar las rutas de administración como un sub-router (IMPORTANTE: poner antes de rutas con parámetros)
router.use('/admin', maintenanceAdminRoutes);

// Rutas que usan parámetros de ID
router.get('/vehicle/:vehicleId', maintenanceController.getMaintenanceRecordsByVehicle);
router.get('/:id', maintenanceController.getMaintenanceDetails);
router.get('/:id/edit', maintenanceController.getEditForm);
router.post('/:id', maintenanceController.updateMaintenanceRecord);
router.post('/:id/delete', maintenanceController.deleteMaintenanceRecord);

// Rutas para la gestión de documentos
router.get('/:id/upload', maintenanceController.getUploadDocumentForm);
router.post('/:id/upload', upload.single('documentFile'), maintenanceController.uploadDocument);
router.post('/:id/documents/:docId/delete', maintenanceController.deleteDocument);

module.exports = router; 