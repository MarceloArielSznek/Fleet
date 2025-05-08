const Vehicle = require('../models/vehicle');
const Maintenance = require('../models/maintenance');
const ServiceType = require('../models/serviceType');
const MaintenanceRule = require('../models/maintenanceRule');
const fs = require('fs');
const path = require('path');

// Mostrar todos los registros de mantenimiento
exports.getAllMaintenanceRecords = async (req, res, next) => {
    try {
        const maintenanceRecords = await Maintenance.getAllWithVehicles();
        const serviceTypes = await ServiceType.getAllActive();
        
        console.log(`[${new Date().toISOString()}] Consultando todos los registros de mantenimiento - Total: ${maintenanceRecords.length}`);
        res.render('maintenance/index', { maintenanceRecords, serviceTypes });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR al obtener registros de mantenimiento:`, error);
        next(error);
    }
};

// Mostrar el formulario para crear un nuevo registro de mantenimiento
exports.getCreateForm = async (req, res, next) => {
    try {
        // Obtener todos los vehículos y ordenarlos por nombre
        const vehicles = await Vehicle.getAll();
        vehicles.sort((a, b) => {
            const nameA = a.name || `${a.brand} ${a.model}`;
            const nameB = b.name || `${b.brand} ${b.model}`;
            return nameA.localeCompare(nameB);
        });
        
        // Crear un objeto con los kilometrajes de cada vehículo
        const vehicleMileages = {};
        vehicles.forEach(vehicle => {
            vehicleMileages[vehicle.id] = vehicle.mileage;
        });
        
        const preselectedVehicleId = req.query.vehicleId;
        let serviceTypes = [];
        
        if (preselectedVehicleId) {
            const vehicle = await Vehicle.findById(preselectedVehicleId);
            if (vehicle) {
                serviceTypes = await ServiceType.getByVehicleType(vehicle.type);
            }
        } else {
            serviceTypes = await ServiceType.getAllActive();
        }
        
        const preselectedServiceType = req.query.serviceType;
        const preselectedMileage = req.query.mileage;
        
        console.log('Preselected Vehicle ID:', preselectedVehicleId || 'No especificado');
        console.log('Preselected Service Type:', preselectedServiceType || 'No especificado');
        console.log('Preselected Mileage:', preselectedMileage || 'No especificado');
        console.log('Vehicle Mileages:', vehicleMileages);

        res.render('maintenance/create', { 
            title: 'Schedule Maintenance',
            vehicles,
            vehicleMileages,
            serviceTypes,
            preselectedVehicleId,
            preselectedServiceType,
            preselectedMileage
        });
    } catch (error) {
        console.error('Error al mostrar el formulario de creación de mantenimiento:', error);
        res.status(500).render('error', { 
            message: 'Error al cargar el formulario de mantenimiento', 
            error 
        });
    }
};

// Crear un nuevo registro de mantenimiento
exports.createMaintenanceRecord = async (req, res, next) => {
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

        // Formatear las fechas
        if (maintenanceData.scheduleDate) {
            maintenanceData.scheduleDate = new Date(maintenanceData.scheduleDate).toISOString();
        }
        if (maintenanceData.completionDate) {
            maintenanceData.completionDate = new Date(maintenanceData.completionDate).toISOString();
        }
        
        const newMaintenance = new Maintenance(maintenanceData);
        await newMaintenance.save();
        
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
        
        // Redireccionar a la página de detalles del mantenimiento recién creado
        res.redirect(`/maintenance/${newMaintenance.id}`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR al crear registro de mantenimiento:`, error);
        next(error);
    }
};

// Mostrar detalles de un registro de mantenimiento
exports.getMaintenanceDetails = async (req, res, next) => {
    try {
        const maintenance = await Maintenance.findByIdWithVehicle(req.params.id);
        if (!maintenance) {
            console.warn(`[${new Date().toISOString()}] Intento de acceder a mantenimiento no existente - ID: ${req.params.id}`);
            return res.status(404).render('error', {
                error: null,
                message: 'Registro de mantenimiento no encontrado'
            });
        }
        
        const serviceTypes = await ServiceType.getAllActive();
        const serviceType = serviceTypes.find(s => s.id === maintenance.maintenanceType);
        
        console.log(`[${new Date().toISOString()}] Consultando detalles de mantenimiento - ID: ${maintenance.id}`);
        res.render('maintenance/details', { maintenance, serviceType, serviceTypes });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR al obtener detalles del mantenimiento:`, error);
        next(error);
    }
};

// Mostrar formulario de edición
exports.getEditForm = async (req, res, next) => {
    try {
        const maintenance = await Maintenance.findById(req.params.id);
        if (!maintenance) {
            console.warn(`[${new Date().toISOString()}] Intento de editar mantenimiento no existente - ID: ${req.params.id}`);
            return res.status(404).render('error', {
                error: null,
                message: 'Registro de mantenimiento no encontrado'
            });
        }
        
        // Obtener todos los vehículos para el selector
        const vehicles = await Vehicle.getAll();
        const vehicle = await Vehicle.findById(maintenance.vehicleId);
        
        // Obtener los tipos de servicio
        const serviceTypes = vehicle ? 
            await ServiceType.getByVehicleType(vehicle.type) : 
            await ServiceType.getAllActive();
        
        console.log(`[${new Date().toISOString()}] Abriendo formulario de edición de mantenimiento - ID: ${maintenance.id}`);
        res.render('maintenance/edit', { maintenance, vehicles, vehicle, serviceTypes });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR al obtener formulario de edición de mantenimiento:`, error);
        next(error);
    }
};

// Actualizar un registro de mantenimiento
exports.updateMaintenanceRecord = async (req, res, next) => {
    try {
        const maintenanceId = req.params.id;
        const oldMaintenance = await Maintenance.findById(maintenanceId);
        
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
        
        // Si el estado es completed, actualizar el kilometraje del vehículo si es mayor al actual
        if (maintenanceData.mileage) {
            const vehicle = await Vehicle.findById(maintenanceData.vehicleId);
            if (vehicle && parseInt(maintenanceData.mileage) > parseInt(vehicle.mileage)) {
                vehicle.mileage = maintenanceData.mileage;
                await Vehicle.findByIdAndUpdate(vehicle.id, vehicle);
            } else if (vehicle && parseInt(maintenanceData.mileage) < parseInt(vehicle.mileage)) {
                return res.status(400).render('error', {
                    error: null,
                    message: 'El kilometraje no puede ser menor que el kilometraje actual del vehículo'
                });
            }
        }
        
        const updatedMaintenance = await Maintenance.findByIdAndUpdate(maintenanceId, maintenanceData);
        
        if (!updatedMaintenance) {
            return res.status(500).render('error', {
                error: null,
                message: 'Error al actualizar el registro de mantenimiento'
            });
        }
        
        console.log(`[${new Date().toISOString()}] Mantenimiento ACTUALIZADO - ID: ${maintenanceId}`);
        console.table({
            Operación: 'ACTUALIZAR',
            ID: maintenanceId,
            'Nuevo Estado': maintenanceData.status,
            'Nuevo Kilometraje': maintenanceData.mileage,
            Fecha: new Date().toLocaleString()
        });
        
        res.redirect(`/maintenance/${maintenanceId}`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR al actualizar registro de mantenimiento:`, error);
        next(error);
    }
};

// Eliminar un registro de mantenimiento
exports.deleteMaintenanceRecord = async (req, res, next) => {
    try {
        const maintenanceId = req.params.id;
        await Maintenance.findByIdAndDelete(maintenanceId);
        res.redirect('/maintenance');
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR al eliminar registro de mantenimiento:`, error);
        next(error);
    }
};

// Obtener registros de mantenimiento para un vehículo específico
exports.getMaintenanceRecordsByVehicle = async (req, res, next) => {
    try {
        const vehicleId = req.params.vehicleId;
        const vehicle = await Vehicle.findById(vehicleId);
        
        if (!vehicle) {
            console.warn(`[${new Date().toISOString()}] Intento de obtener mantenimientos para vehículo no existente - ID: ${vehicleId}`);
            return res.status(404).render('error', {
                error: null,
                message: 'Vehículo no encontrado'
            });
        }
        
        const maintenanceRecords = await Maintenance.findByVehicleId(vehicleId);
        const serviceTypes = await ServiceType.getAllActive();
        const pendingMaintenance = await MaintenanceRule.checkPendingMaintenance(vehicle);
        
        console.log(`[${new Date().toISOString()}] Consultando mantenimientos de vehículo - ID: ${vehicleId}, Total: ${maintenanceRecords.length}`);
        res.render('maintenance/vehicle', { 
            vehicle, 
            maintenanceRecords, 
            serviceTypes,
            pendingMaintenance
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR al obtener registros de mantenimiento por vehículo:`, error);
        next(error);
    }
};

// Mostrar el formulario para subir un documento
exports.getUploadDocumentForm = async (req, res, next) => {
  try {
    const maintenance = await Maintenance.findByIdWithVehicle(req.params.id);
    if (!maintenance) {
      console.warn(`[${new Date().toISOString()}] Intento de subir documento a mantenimiento no existente - ID: ${req.params.id}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Registro de mantenimiento no encontrado'
      });
    }
    
    // Obtener los tipos de servicio de la base de datos
    const serviceTypes = await ServiceType.getAllActive();
    
    console.log(`[${new Date().toISOString()}] Cargando formulario de subida de documento para mantenimiento - ID: ${maintenance.id}`);
    res.render('maintenance/upload', { maintenance, serviceTypes });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cargar formulario de subida de documento:`, error);
    next(error);
  }
};

// Subir un nuevo documento
exports.uploadDocument = async (req, res, next) => {
  try {
    const maintenanceId = req.params.id;
    const maintenance = await Maintenance.findById(maintenanceId);
    
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
    const documents = maintenance.documents || [];
    documents.push(documentData);
    
    // Actualizar el registro de mantenimiento con el nuevo documento
    maintenance.documents = documents;
    await Maintenance.findByIdAndUpdate(maintenanceId, { documents });
    
    console.log(`[${new Date().toISOString()}] Documento SUBIDO - Mantenimiento: ${maintenanceId}`);
    console.table({
      Operación: 'SUBIR DOCUMENTO',
      'ID Mantenimiento': maintenanceId,
      Nombre: documentData.name,
      Tipo: documentData.type,
      URL: documentData.url,
      Fecha: new Date().toLocaleString()
    });
    
    res.redirect(`/maintenance/${maintenanceId}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al subir documento:`, error);
    next(error);
  }
};

// Eliminar un documento
exports.deleteDocument = async (req, res, next) => {
  try {
    const maintenanceId = req.params.id;
    const documentId = req.params.docId;
    
    // Verificar que el registro de mantenimiento existe
    const maintenance = await Maintenance.findById(maintenanceId);
    if (!maintenance) {
      console.warn(`[${new Date().toISOString()}] Intento de eliminar documento de mantenimiento no existente - ID: ${maintenanceId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Registro de mantenimiento no encontrado'
      });
    }
    
    // Encontrar y eliminar el documento del array
    const documents = maintenance.documents || [];
    const documentIndex = documents.findIndex(doc => doc.id === documentId);
    
    if (documentIndex === -1) {
      console.warn(`[${new Date().toISOString()}] Intento de eliminar documento no existente - ID: ${documentId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Documento no encontrado'
      });
    }
    
    const document = documents[documentIndex];
    documents.splice(documentIndex, 1);
    
    // Actualizar el registro de mantenimiento sin el documento
    await Maintenance.findByIdAndUpdate(maintenanceId, { documents });
    
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