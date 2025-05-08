const Vehicle = require('../models/vehicle');
const Maintenance = require('../models/maintenance');
const ServiceType = require('../models/serviceType');
const MaintenanceRule = require('../models/maintenanceRule');

// Dashboard de administración de mantenimiento
exports.getAdminDashboard = async (req, res, next) => {
  try {
    // Obtener tipos de servicios y reglas de mantenimiento
    const serviceTypes = await ServiceType.getAll();
    const maintenanceRules = await MaintenanceRule.getAllWithVehicles();
    const vehicles = await Vehicle.getAll();
    
    // Identificar los servicios personalizados (los que no son estándar)
    const customServices = serviceTypes.filter(service => !service.isStandard);
    
    // Mapear los servicios para la vista
    const allServices = serviceTypes.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description || '',
      category: service.category || 'routine',
      isStandard: service.isStandard || false,
      active: service.active
    }));
    
    console.log(`[${new Date().toISOString()}] Cargando dashboard de administración de mantenimiento - Servicios: ${allServices.length}, Reglas: ${maintenanceRules.length}`);
    
    res.render('maintenance/admin', { 
      allServices,
      customServices,
      maintenanceRules,
      vehicles
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cargar dashboard de administración:`, error);
    next(error);
  }
};

// ---------------------- Servicios personalizados ----------------------

// Mostrar formulario para crear un nuevo tipo de servicio
exports.getCreateServiceForm = (req, res, next) => {
  try {
    console.log(`[${new Date().toISOString()}] Cargando formulario para crear nuevo tipo de servicio`);
    res.render('maintenance/admin-service-create');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cargar formulario de creación de servicio:`, error);
    next(error);
  }
};

// Crear un nuevo tipo de servicio personalizado
exports.createCustomService = async (req, res, next) => {
  try {
    const { name, description, vehicleTypes, category } = req.body;
    
    // Validate required fields
    if (!name || !vehicleTypes) {
      return res.status(400).render('error', {
        error: null,
        message: 'Name and vehicle types are required'
      });
    }
    
    // Create new service type
    const newServiceType = new ServiceType({
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description: description || '',
      category: category || 'routine',
      vehicleTypes: Array.isArray(vehicleTypes) ? vehicleTypes : [vehicleTypes],
      isStandard: false,
      active: true
    });
    
    // Save to database
    await newServiceType.save();
    
    // Get all active vehicles
    const vehicles = await Vehicle.getAll();
    const activeVehicles = vehicles.filter(v => v.status === 'active');
    const currentDate = new Date().toISOString();
    
    // Create initial maintenance records for all active vehicles
    for (const vehicle of activeVehicles) {
      const maintenanceRecord = new Maintenance({
        vehicleId: vehicle.id,
        maintenanceType: newServiceType.id,
        mileage: vehicle.mileage || "0",
        scheduleDate: currentDate,
        status: "completed",
        notes: `Initial ${newServiceType.name} record`
      });
      
      await maintenanceRecord.save();
    }
    
    console.log(`[${new Date().toISOString()}] Tipo de servicio CREADO - ID: ${newServiceType.id}, Nombre: ${newServiceType.name}`);
    console.table({
      Operación: 'CREAR SERVICIO',
      ID: newServiceType.id,
      Nombre: newServiceType.name,
      'Tipos de vehículo': newServiceType.vehicleTypes.join(', '),
      Fecha: new Date().toLocaleString()
    });
    
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al crear tipo de servicio:`, error);
    next(error);
  }
};

// Mostrar formulario de edición de servicio
exports.getEditServiceForm = async (req, res, next) => {
  try {
    const serviceId = req.params.id;
    const serviceType = await ServiceType.findById(serviceId);
    
    if (!serviceType) {
      console.warn(`[${new Date().toISOString()}] Intento de editar servicio no existente - ID: ${serviceId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Service type not found'
      });
    }
    
    console.log(`[${new Date().toISOString()}] Cargando formulario de edición de servicio - ID: ${serviceId}`);
    res.render('maintenance/admin-service-edit', { serviceType });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cargar formulario de edición de servicio:`, error);
    next(error);
  }
};

// Actualizar un tipo de servicio
exports.updateServiceType = async (req, res, next) => {
  try {
    const serviceId = req.params.id;
    const { name, description, vehicleTypes, category, active } = req.body;
    
    // Validate required fields
    if (!name || !vehicleTypes) {
      return res.status(400).render('error', {
        error: null,
        message: 'Name and vehicle types are required'
      });
    }
    
    // Update service type
    const serviceType = await ServiceType.findById(serviceId);
    if (!serviceType) {
      console.warn(`[${new Date().toISOString()}] Intento de actualizar servicio no existente - ID: ${serviceId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Service type not found'
      });
    }
    
    // Update fields
    serviceType.name = name;
    serviceType.description = description;
    serviceType.vehicleTypes = Array.isArray(vehicleTypes) ? vehicleTypes : [vehicleTypes];
    serviceType.category = category;
    serviceType.active = active === 'true' || active === true;
    
    // Save to database
    await ServiceType.findByIdAndUpdate(serviceId, serviceType);
    
    console.log(`[${new Date().toISOString()}] Tipo de servicio ACTUALIZADO - ID: ${serviceId}`);
    console.table({
      Operación: 'ACTUALIZAR SERVICIO',
      ID: serviceId,
      Nombre: name,
      'Tipos de vehículo': Array.isArray(vehicleTypes) ? vehicleTypes.join(', ') : vehicleTypes,
      Activo: active,
      Fecha: new Date().toLocaleString()
    });
    
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al actualizar tipo de servicio:`, error);
    next(error);
  }
};

// Eliminar un tipo de servicio
exports.deleteServiceType = async (req, res, next) => {
  try {
    const serviceId = req.params.id;
    
    // Find and delete service type
    const serviceType = await ServiceType.findByIdAndDelete(serviceId);
    
    if (!serviceType) {
      console.warn(`[${new Date().toISOString()}] Intento de eliminar servicio no existente - ID: ${serviceId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Service type not found'
      });
    }
    
    console.log(`[${new Date().toISOString()}] Tipo de servicio ELIMINADO - ID: ${serviceId}`);
    console.table({
      Operación: 'ELIMINAR SERVICIO',
      ID: serviceId,
      Nombre: serviceType.name,
      Fecha: new Date().toLocaleString()
    });
    
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al eliminar tipo de servicio:`, error);
    next(error);
  }
};

// ---------------------- Reglas de mantenimiento ----------------------

// Mostrar formulario para crear una nueva regla
exports.getCreateRuleForm = async (req, res, next) => {
  try {
    const serviceTypes = await ServiceType.getAll();
    const vehicles = await Vehicle.getAll();
    
    // Identificar los servicios personalizados (los que no son estándar)
    const customServices = serviceTypes.filter(service => !service.isStandard);
    
    // Mapear todos los servicios para la vista
    const allServices = serviceTypes.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description || '',
      category: service.category || 'routine',
      isStandard: service.isStandard || false,
      active: service.active
    }));
    
    console.log(`[${new Date().toISOString()}] Cargando formulario para crear nueva regla de mantenimiento`);
    res.render('maintenance/admin-rule-create', { 
      allServices,
      customServices,
      vehicles
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cargar formulario de creación de regla:`, error);
    next(error);
  }
};

// Crear una nueva regla de mantenimiento
exports.createMaintenanceRule = async (req, res, next) => {
  try {
    const maintenanceRules = await MaintenanceRule.getAll();
    
    // Determinar los valores según el tipo de condición
    let mileageInterval = null;
    let timeIntervalDays = null;
    if (req.body.conditionType === 'mileage') {
      mileageInterval = req.body.mileageThreshold ? parseInt(req.body.mileageThreshold) : null;
    } else if (req.body.conditionType === 'time') {
      timeIntervalDays = req.body.timeThreshold ? parseInt(req.body.timeThreshold) : null;
    } else if (req.body.conditionType === 'combined') {
      mileageInterval = req.body.mileageThreshold ? parseInt(req.body.mileageThreshold) : null;
      timeIntervalDays = req.body.timeThreshold ? parseInt(req.body.timeThreshold) : null;
    }
    // Crear nueva regla
    const newRule = new MaintenanceRule({
      name: req.body.name,
      description: req.body.description,
      serviceTypeId: req.body.serviceType,
      mileageInterval,
      timeIntervalDays,
      priority: req.body.priority || 'normal',
      active: true
    });
    
    // Save to database
    const saved = await newRule.save();
    
    if (saved) {
      // Guardar relación con vehículos seleccionados
      let vehicleIds = req.body.vehicleIds;
      if (typeof vehicleIds === 'string') vehicleIds = [vehicleIds];
      if (vehicleIds && vehicleIds.length > 0) {
        await MaintenanceRule.addVehiclesToRule(newRule.id, vehicleIds);
      }
    }
    
    if (!saved) {
      console.error(`[${new Date().toISOString()}] Error al guardar la regla de mantenimiento`);
      return res.status(400).render('error', {
        error: null,
        message: 'Error al crear la regla de mantenimiento. Verifique que todos los campos requeridos estén completos.'
      });
    }
    
    console.log(`[${new Date().toISOString()}] Regla de mantenimiento CREADA - ID: ${newRule.id}`);
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al crear regla de mantenimiento:`, error);
    next(error);
  }
};

// Mostrar formulario de edición de regla
exports.getEditRuleForm = async (req, res, next) => {
  try {
    const ruleId = req.params.id;
    const maintenanceRules = await MaintenanceRule.getAllWithVehicles();
    const serviceTypes = await ServiceType.getAll();
    const vehicles = await Vehicle.getAll();
    // Mapear todos los servicios para la vista
    const allServices = serviceTypes.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description || '',
      category: service.category || 'routine',
      isStandard: service.isStandard || false,
      active: service.active
    }));
    // Buscar la regla por ID
    const rule = maintenanceRules.find(r => r.id === ruleId);
    if (!rule) {
      return res.status(404).render('error', {
        error: null,
        message: 'Regla no encontrada'
      });
    }
    res.render('maintenance/admin-rule-edit', { 
      rule,
      allServices,
      vehicles
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cargar formulario de edición de regla:`, error);
    next(error);
  }
};

// Actualizar una regla de mantenimiento
exports.updateMaintenanceRule = async (req, res, next) => {
  try {
    const ruleId = req.params.id;
    // Determinar los valores según el tipo de condición
    let mileageInterval = null;
    let timeIntervalDays = null;
    if (req.body.conditionType === 'mileage') {
      mileageInterval = req.body.mileageThreshold ? parseInt(req.body.mileageThreshold) : null;
    } else if (req.body.conditionType === 'time') {
      timeIntervalDays = req.body.timeThreshold ? parseInt(req.body.timeThreshold) : null;
    } else if (req.body.conditionType === 'combined') {
      mileageInterval = req.body.mileageThreshold ? parseInt(req.body.mileageThreshold) : null;
      timeIntervalDays = req.body.timeThreshold ? parseInt(req.body.timeThreshold) : null;
    }
    // Actualizar la regla
    const updatedRule = new MaintenanceRule({
      id: ruleId,
      name: req.body.name,
      description: req.body.description,
      serviceTypeId: req.body.serviceType,
      mileageInterval,
      timeIntervalDays,
      priority: req.body.priority || 'normal',
      active: req.body.isActive === 'on' || req.body.isActive === true
    });
    await updatedRule.save();
    // Actualizar vehículos asociados
    await MaintenanceRule.removeVehiclesFromRule(ruleId);
    let vehicleIds = req.body.vehicleIds;
    if (typeof vehicleIds === 'string') vehicleIds = [vehicleIds];
    if (vehicleIds && vehicleIds.length > 0) {
      await MaintenanceRule.addVehiclesToRule(ruleId, vehicleIds);
    }
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al actualizar regla de mantenimiento:`, error);
    next(error);
  }
};

// Cambiar el estado de una regla (activar/desactivar)
exports.toggleRuleStatus = async (req, res, next) => {
  try {
    const ruleId = req.params.id;
    const maintenanceRules = await MaintenanceRule.getAll();
    
    // Buscar el índice de la regla
    const ruleIndex = maintenanceRules.findIndex(r => r.id === ruleId);
    
    if (ruleIndex === -1) {
      console.warn(`[${new Date().toISOString()}] Intento de cambiar estado de regla no existente - ID: ${ruleId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Regla no encontrada'
      });
    }
    
    // Cambiar el estado
    maintenanceRules[ruleIndex].isActive = !maintenanceRules[ruleIndex].isActive;
    maintenanceRules[ruleIndex].updatedAt = new Date().toISOString();
    
    // Save to database
    await MaintenanceRule.findByIdAndUpdate(ruleId, maintenanceRules[ruleIndex]);
    
    console.log(`[${new Date().toISOString()}] Estado de regla CAMBIADO - ID: ${ruleId}, Nuevo estado: ${maintenanceRules[ruleIndex].isActive ? 'activo' : 'inactivo'}`);
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cambiar estado de regla:`, error);
    next(error);
  }
};

// Eliminar una regla de mantenimiento
exports.deleteMaintenanceRule = async (req, res, next) => {
  try {
    const ruleId = req.params.id;
    // Eliminar asociaciones de vehículos
    await MaintenanceRule.removeVehiclesFromRule(ruleId);
    // Eliminar la regla
    await MaintenanceRule.delete(ruleId);
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al eliminar regla de mantenimiento:`, error);
    next(error);
  }
}; 