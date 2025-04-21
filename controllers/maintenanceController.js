const Maintenance = require('../models/maintenance');
const Vehicle = require('../models/vehicle');

// Lista todos los registros de mantenimiento
exports.getAllMaintenanceRecords = (req, res, next) => {
  try {
    const maintenanceRecords = Maintenance.getAllWithVehicles();
    console.log(`[${new Date().toISOString()}] Consultando lista de mantenimientos - Total: ${maintenanceRecords.length}`);
    res.render('maintenance/index', { maintenanceRecords });
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
    console.log(`[${new Date().toISOString()}] Cargando formulario de mantenimiento - Vehículos disponibles: ${vehicles.length}`);
    
    // Verificar si se ha proporcionado un vehicleId en la URL
    const preselectedVehicleId = req.query.vehicleId;
    let preselectedVehicle = null;
    
    if (preselectedVehicleId) {
      preselectedVehicle = Vehicle.findById(preselectedVehicleId);
      console.log(`[${new Date().toISOString()}] Vehículo preseleccionado: ${preselectedVehicle ? preselectedVehicle.brand + ' ' + preselectedVehicle.model : 'No encontrado'}`);
    }
    
    res.render('maintenance/create', { 
      vehicles,
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
    
    console.log(`[${new Date().toISOString()}] Consultando detalles de mantenimiento - ID: ${maintenance.id}`);
    res.render('maintenance/details', { maintenance });
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
    
    console.log(`[${new Date().toISOString()}] Abriendo formulario de edición de mantenimiento - ID: ${maintenance.id}`);
    res.render('maintenance/edit', { maintenance, vehicles, vehicle });
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
    
    console.log(`[${new Date().toISOString()}] Consultando mantenimientos de vehículo - ID: ${vehicleId}, Total: ${maintenanceRecords.length}`);
    res.render('maintenance/vehicle', { vehicle, maintenanceRecords });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al obtener registros de mantenimiento por vehículo:`, error);
    next(error);
  }
}; 