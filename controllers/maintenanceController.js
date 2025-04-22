const Maintenance = require('../models/maintenance');
const Vehicle = require('../models/vehicle');
const fs = require('fs');
const path = require('path');

// Ruta al archivo de tipos de servicio
const serviceTypesDataPath = path.join(__dirname, '../data/serviceTypes.json');

// Función auxiliar para leer datos JSON
const readJsonFile = (filePath, defaultValue = []) => {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error al leer archivo ${filePath}:`, error);
    return defaultValue;
  }
};

// Lista todos los registros de mantenimiento
exports.getAllMaintenanceRecords = (req, res, next) => {
  try {
    const maintenanceRecords = Maintenance.getAllWithVehicles();
    
    // Obtener los tipos de servicio del archivo JSON
    const serviceTypes = readJsonFile(serviceTypesDataPath, []);
    
    console.log(`[${new Date().toISOString()}] Consultando lista de mantenimientos - Total: ${maintenanceRecords.length}`);
    res.render('maintenance/index', { maintenanceRecords, serviceTypes });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al obtener registros de mantenimiento:`, error);
    next(error);
  }
};

// Mostrar el formulario para crear un nuevo registro de mantenimiento
exports.getCreateForm = async (req, res, next) => {
  try {
    // Obtener todos los vehículos para el selector
    const vehicles = Vehicle.getAll().filter(v => v.status !== 'retired');
    
    // Obtener los tipos de servicio del archivo JSON
    const serviceTypes = readJsonFile(serviceTypesDataPath, []);
    // Filtrar solo los servicios activos
    const activeServiceTypes = serviceTypes.filter(service => service.active !== false);
    
    console.log(`[${new Date().toISOString()}] Cargando formulario de mantenimiento - Vehículos disponibles: ${vehicles.length}, Servicios disponibles: ${activeServiceTypes.length}`);
    
    // Verificar si se ha proporcionado un vehicleId en la URL
    const preselectedVehicleId = req.query.vehicleId;
    let preselectedVehicle = null;
    
    if (preselectedVehicleId) {
      preselectedVehicle = Vehicle.findById(preselectedVehicleId);
      console.log(`[${new Date().toISOString()}] Vehículo preseleccionado: ${preselectedVehicle ? preselectedVehicle.brand + ' ' + preselectedVehicle.model : 'No encontrado'}`);
    }
    
    res.render('maintenance/create', { 
      vehicles,
      serviceTypes: activeServiceTypes,
      preselectedVehicleId: preselectedVehicle ? preselectedVehicle.id : null
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cargar formulario de mantenimiento:`, error);
    next(error);
  }
};

// Crear un nuevo registro de mantenimiento
exports.createMaintenanceRecord = (req, res, next) => {
  try {
    const maintenanceData = req.body;
    
    // Convertir cost a número si está presente
    if (maintenanceData.cost) {
      maintenanceData.cost = parseFloat(maintenanceData.cost);
    }
    
    // Convertir mileage a número si está presente
    if (maintenanceData.mileage) {
      maintenanceData.mileage = parseInt(maintenanceData.mileage);
    }
    
    const newMaintenance = new Maintenance(maintenanceData);
    newMaintenance.save();
    
    console.log(`[${new Date().toISOString()}] Mantenimiento CREADO - ID: ${newMaintenance.id}, Tipo: ${newMaintenance.maintenanceType}, Vehículo: ${newMaintenance.vehicleId}`);
    console.table({
      Operación: 'CREAR',
      ID: newMaintenance.id,
      Tipo: newMaintenance.maintenanceType,
      'ID Vehículo': newMaintenance.vehicleId,
      Estado: newMaintenance.status,
      'Fecha Programada': newMaintenance.scheduleDate,
      Fecha: new Date().toLocaleString()
    });
    
    res.redirect('/maintenance');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al crear registro de mantenimiento:`, error);
    next(error);
  }
};

// Mostrar detalles de un registro de mantenimiento
exports.getMaintenanceDetails = (req, res, next) => {
  try {
    const maintenance = Maintenance.findByIdWithVehicle(req.params.id);
    if (!maintenance) {
      console.warn(`[${new Date().toISOString()}] Intento de acceder a mantenimiento no existente - ID: ${req.params.id}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Registro de mantenimiento no encontrado'
      });
    }
    
    // Obtener los tipos de servicio del archivo JSON
    const serviceTypes = readJsonFile(serviceTypesDataPath, []);
    
    console.log(`[${new Date().toISOString()}] Consultando detalles de mantenimiento - ID: ${maintenance.id}`);
    res.render('maintenance/details', { maintenance, serviceTypes });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al obtener detalles del mantenimiento:`, error);
    next(error);
  }
};

// Mostrar formulario de edición
exports.getEditForm = (req, res, next) => {
  try {
    const maintenance = Maintenance.findById(req.params.id);
    if (!maintenance) {
      console.warn(`[${new Date().toISOString()}] Intento de editar mantenimiento no existente - ID: ${req.params.id}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Registro de mantenimiento no encontrado'
      });
    }
    
    // Obtener todos los vehículos para el selector
    const vehicles = Vehicle.getAll();
    const vehicle = Vehicle.findById(maintenance.vehicleId);
    
    // Obtener los tipos de servicio del archivo JSON
    const serviceTypes = readJsonFile(serviceTypesDataPath, []);
    // Para edición, mostrar todos los servicios (incluso inactivos) para mantener compatibilidad
    
    console.log(`[${new Date().toISOString()}] Abriendo formulario de edición de mantenimiento - ID: ${maintenance.id}`);
    res.render('maintenance/edit', { maintenance, vehicles, vehicle, serviceTypes });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al obtener formulario de edición de mantenimiento:`, error);
    next(error);
  }
};

// Actualizar un registro de mantenimiento
exports.updateMaintenanceRecord = (req, res, next) => {
  try {
    const maintenanceId = req.params.id;
    const oldMaintenance = Maintenance.findById(maintenanceId);
    
    if (!oldMaintenance) {
      console.warn(`[${new Date().toISOString()}] Intento de actualizar mantenimiento no existente - ID: ${maintenanceId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Registro de mantenimiento no encontrado'
      });
    }
    
    const maintenanceData = req.body;
    
    // Convertir cost a número si está presente
    if (maintenanceData.cost) {
      maintenanceData.cost = parseFloat(maintenanceData.cost);
    }
    
    // Convertir mileage a número si está presente
    if (maintenanceData.mileage) {
      maintenanceData.mileage = parseInt(maintenanceData.mileage);
    }
    
    // Si el estado es completed y no hay fecha de finalización, usar la fecha actual
    if (maintenanceData.status === 'completed' && !maintenanceData.completionDate) {
      maintenanceData.completionDate = new Date().toISOString().split('T')[0];
    }
    
    const updatedMaintenance = Maintenance.findByIdAndUpdate(maintenanceId, maintenanceData);
    
    console.log(`[${new Date().toISOString()}] Mantenimiento ACTUALIZADO - ID: ${updatedMaintenance.id}`);
    console.table({
      Operación: 'ACTUALIZAR',
      ID: updatedMaintenance.id,
      'Estado (antes)': oldMaintenance.status,
      'Estado (después)': updatedMaintenance.status,
      'Fecha Programada': updatedMaintenance.scheduleDate,
      'Fecha Finalización': updatedMaintenance.completionDate || 'N/A',
      Fecha: new Date().toLocaleString()
    });
    
    res.redirect(`/maintenance/${updatedMaintenance.id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al actualizar registro de mantenimiento:`, error);
    next(error);
  }
};

// Eliminar un registro de mantenimiento
exports.deleteMaintenanceRecord = (req, res, next) => {
  try {
    const maintenanceId = req.params.id;
    const deletedMaintenance = Maintenance.findByIdAndDelete(maintenanceId);
    
    if (!deletedMaintenance) {
      console.warn(`[${new Date().toISOString()}] Intento de eliminar mantenimiento no existente - ID: ${maintenanceId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Registro de mantenimiento no encontrado'
      });
    }
    
    console.log(`[${new Date().toISOString()}] Mantenimiento ELIMINADO - ID: ${deletedMaintenance.id}`);
    console.table({
      Operación: 'ELIMINAR',
      ID: deletedMaintenance.id,
      Tipo: deletedMaintenance.maintenanceType,
      'ID Vehículo': deletedMaintenance.vehicleId,
      Estado: deletedMaintenance.status,
      Fecha: new Date().toLocaleString()
    });
    
    res.redirect('/maintenance');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al eliminar registro de mantenimiento:`, error);
    next(error);
  }
};

// Obtener registros de mantenimiento para un vehículo específico
exports.getMaintenanceRecordsByVehicle = (req, res, next) => {
  try {
    const vehicleId = req.params.vehicleId;
    const vehicle = Vehicle.findById(vehicleId);
    
    if (!vehicle) {
      console.warn(`[${new Date().toISOString()}] Intento de obtener mantenimientos para vehículo no existente - ID: ${vehicleId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Vehículo no encontrado'
      });
    }
    
    const maintenanceRecords = Maintenance.findByVehicleId(vehicleId);
    
    // Obtener los tipos de servicio del archivo JSON
    const serviceTypes = readJsonFile(serviceTypesDataPath, []);
    
    console.log(`[${new Date().toISOString()}] Consultando mantenimientos de vehículo - ID: ${vehicleId}, Total: ${maintenanceRecords.length}`);
    res.render('maintenance/vehicle', { vehicle, maintenanceRecords, serviceTypes });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al obtener registros de mantenimiento por vehículo:`, error);
    next(error);
  }
};

// Mostrar el formulario para subir un documento
exports.getUploadDocumentForm = (req, res, next) => {
  try {
    const maintenance = Maintenance.findByIdWithVehicle(req.params.id);
    if (!maintenance) {
      console.warn(`[${new Date().toISOString()}] Intento de subir documento a mantenimiento no existente - ID: ${req.params.id}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Registro de mantenimiento no encontrado'
      });
    }
    
    // Obtener los tipos de servicio del archivo JSON
    const serviceTypes = readJsonFile(serviceTypesDataPath, []);
    
    console.log(`[${new Date().toISOString()}] Cargando formulario de subida de documento para mantenimiento - ID: ${maintenance.id}`);
    res.render('maintenance/upload', { maintenance, serviceTypes });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cargar formulario de subida de documento:`, error);
    next(error);
  }
};

// Subir un nuevo documento
exports.uploadDocument = (req, res, next) => {
  try {
    const maintenanceId = req.params.id;
    const maintenance = Maintenance.findById(maintenanceId);
    
    if (!maintenance) {
      console.warn(`[${new Date().toISOString()}] Intento de subir documento a mantenimiento no existente - ID: ${maintenanceId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Registro de mantenimiento no encontrado'
      });
    }
    
    // Verificar si se subió un archivo
    if (!req.file) {
      console.warn(`[${new Date().toISOString()}] Intento de subir documento sin archivo - ID: ${maintenanceId}`);
      return res.status(400).render('error', {
        error: null,
        message: 'No se ha proporcionado ningún archivo'
      });
    }
    
    // Asegurarse de que el directorio existe
    const uploadDir = path.join(__dirname, '../public/documents/maintenance');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Determinar el tipo de documento
    let fileType = 'other';
    const extension = path.extname(req.file.originalname).toLowerCase();
    if (['.pdf'].includes(extension)) {
      fileType = 'pdf';
    } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(extension)) {
      fileType = 'image';
    } else if (['.doc', '.docx'].includes(extension)) {
      fileType = 'document';
    }
    
    // Crear el objeto de documento
    const documentData = {
      name: req.body.documentName,
      type: req.body.documentType || 'other',
      fileType: fileType,
      url: `/documents/maintenance/${req.file.filename}`,
      description: req.body.description || ''
    };
    
    // Añadir el documento al registro de mantenimiento
    const newDocument = Maintenance.addDocument(maintenanceId, documentData);
    
    console.log(`[${new Date().toISOString()}] Documento SUBIDO - ID: ${newDocument.id}, Mantenimiento: ${maintenanceId}`);
    console.table({
      Operación: 'SUBIR DOCUMENTO',
      'ID Documento': newDocument.id,
      'ID Mantenimiento': maintenanceId,
      Nombre: newDocument.name,
      Tipo: newDocument.type,
      URL: newDocument.url,
      Fecha: new Date().toLocaleString()
    });
    
    res.redirect(`/maintenance/${maintenanceId}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al subir documento:`, error);
    next(error);
  }
};

// Eliminar un documento
exports.deleteDocument = (req, res, next) => {
  try {
    const maintenanceId = req.params.id;
    const documentId = req.params.docId;
    
    // Verificar que el registro de mantenimiento existe
    const maintenance = Maintenance.findById(maintenanceId);
    if (!maintenance) {
      console.warn(`[${new Date().toISOString()}] Intento de eliminar documento de mantenimiento no existente - ID: ${maintenanceId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Registro de mantenimiento no encontrado'
      });
    }
    
    // Eliminar el documento
    const document = Maintenance.removeDocument(maintenanceId, documentId);
    
    if (!document) {
      console.warn(`[${new Date().toISOString()}] Intento de eliminar documento no existente - ID: ${documentId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Documento no encontrado'
      });
    }
    
    console.log(`[${new Date().toISOString()}] Documento ELIMINADO - ID: ${documentId}, Mantenimiento: ${maintenanceId}`);
    console.table({
      Operación: 'ELIMINAR DOCUMENTO',
      'ID Documento': documentId,
      'ID Mantenimiento': maintenanceId,
      Nombre: document.name,
      Fecha: new Date().toLocaleString()
    });
    
    res.redirect(`/maintenance/${maintenanceId}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al eliminar documento:`, error);
    next(error);
  }
}; 