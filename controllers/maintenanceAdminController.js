const fs = require('fs');
const path = require('path');

// Ubicación de los archivos de datos (aún no tenemos modelos)
const maintenanceRulesDataPath = path.join(__dirname, '../data/maintenance-rules.json');
const vehiclesDataPath = path.join(__dirname, '../data/vehicles.json');
const serviceTypesDataPath = path.join(__dirname, '../data/serviceTypes.json');

// Función auxiliar para leer datos JSON
const readJsonFile = (filePath, defaultValue = []) => {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error al leer archivo ${filePath}:`, error);
    return defaultValue;
  }
};

// Función auxiliar para escribir datos JSON
const writeJsonFile = (filePath, data) => {
  try {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error al escribir archivo ${filePath}:`, error);
    return false;
  }
};

// Array de servicios estándar predefinidos
const standardServices = [
  {
    id: 'oil_change',
    name: 'Oil Change',
    description: 'Regular engine oil and filter replacement',
    category: 'routine',
    vehicleTypes: ['car', 'truck', 'van'],
    isStandard: true
  },
  {
    id: 'tire_rotation',
    name: 'Tire Rotation',
    description: 'Rotating tires to ensure even wear and extend tire life',
    category: 'routine',
    vehicleTypes: ['car', 'truck', 'van'],
    isStandard: true
  },
  {
    id: 'brake_service',
    name: 'Brake Service',
    description: 'Inspection and maintenance of brake system components',
    category: 'routine',
    vehicleTypes: ['car', 'truck', 'van', 'motorcycle'],
    isStandard: true
  },
  {
    id: 'engine_tuning',
    name: 'Engine Tuning',
    description: 'Adjusting engine components for optimal performance',
    category: 'major',
    vehicleTypes: ['car', 'truck', 'van', 'motorcycle'],
    isStandard: true
  },
  {
    id: 'battery_replacement',
    name: 'Battery Replacement',
    description: 'Replacing the vehicle battery',
    category: 'routine',
    vehicleTypes: ['car', 'truck', 'van', 'motorcycle'],
    isStandard: true
  },
  {
    id: 'air_filter',
    name: 'Air Filter Replacement',
    description: 'Replacing the engine air filter',
    category: 'routine',
    vehicleTypes: ['car', 'truck', 'van', 'motorcycle'],
    isStandard: true
  },
  {
    id: 'general_inspection',
    name: 'General Inspection',
    description: 'Complete vehicle inspection including all major systems',
    category: 'routine',
    vehicleTypes: ['car', 'truck', 'van', 'motorcycle'],
    isStandard: true
  }
];

// Dashboard de administración de mantenimiento
exports.getAdminDashboard = (req, res, next) => {
  try {
    // Obtener tipos de servicios y reglas de mantenimiento
    const serviceTypes = readJsonFile(serviceTypesDataPath);
    const maintenanceRules = readJsonFile(maintenanceRulesDataPath);
    const vehicles = readJsonFile(vehiclesDataPath);
    
    // Identificar los servicios personalizados (los que no son del sistema)
    const customServices = serviceTypes.filter(service => !service.isSystemDefault);
    
    // Mapear los servicios estándar si es necesario para compatibilidad
    const allServices = serviceTypes.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description || '',
      category: service.category || 'routine',
      isStandard: service.isSystemDefault || false,
      active: service.active
    }));
    
    console.log(`[${new Date().toISOString()}] Cargando dashboard de administración de mantenimiento - Servicios: ${allServices.length}, Reglas: ${maintenanceRules.length}`);
    
    res.render('maintenance/admin', { 
      allServices,
      customServices,
      maintenanceRules,
      standardServices,
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
exports.createCustomService = (req, res, next) => {
  try {
    const serviceTypes = readJsonFile(serviceTypesDataPath);
    
    // Verificar si ya existe un servicio en serviceTypes con el mismo ID
    if (serviceTypes.some(service => service.id === req.body.id)) {
      // En una implementación real, manejaríamos esto con una redirección y mensaje de error
      throw new Error(`Ya existe un servicio con el ID ${req.body.id} en serviceTypes`);
    }
    
    // Procesar los tipos de vehículos aplicables (para almacenamiento de información adicional)
    let vehicleTypes = [];
    if (req.body.vehicleTypes) {
      vehicleTypes = Array.isArray(req.body.vehicleTypes) 
        ? req.body.vehicleTypes 
        : [req.body.vehicleTypes];
    }
    
    // Crear el nuevo servicio para serviceTypes.json
    const newServiceType = {
      id: req.body.id,
      name: req.body.name,
      code: req.body.id,
      description: req.body.description || '',
      category: req.body.category || 'routine',
      vehicleTypes: vehicleTypes,
      isSystemDefault: false,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Añadir el nuevo servicio a la lista
    serviceTypes.push(newServiceType);
    
    // Guardar la lista actualizada
    writeJsonFile(serviceTypesDataPath, serviceTypes);
    
    console.log(`[${new Date().toISOString()}] Servicio personalizado CREADO - ID: ${newServiceType.id}, Nombre: ${newServiceType.name}`);
    
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al crear servicio personalizado:`, error);
    next(error);
  }
};

// Mostrar formulario para editar un tipo de servicio
exports.getEditServiceForm = (req, res, next) => {
  try {
    const serviceId = req.params.id;
    const serviceTypes = readJsonFile(serviceTypesDataPath);
    
    // Primero buscar en servicios estándar para compatibilidad con vista
    let service = standardServices.find(s => s.id === serviceId);
    let isStandardService = !!service;
    
    // Si no es un servicio estándar predefinido, buscar en serviceTypes
    if (!service) {
      service = serviceTypes.find(s => s.id === serviceId);
      isStandardService = service ? service.isSystemDefault : false;
    }
    
    if (!service) {
      console.warn(`[${new Date().toISOString()}] Intento de editar servicio no existente - ID: ${serviceId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Servicio no encontrado'
      });
    }
    
    console.log(`[${new Date().toISOString()}] Cargando formulario de edición de servicio - ID: ${service.id}, Tipo: ${isStandardService ? 'estándar' : 'personalizado'}`);
    
    // Por ahora, reutilizaremos la vista de creación con los datos precargados
    res.render('maintenance/admin-service-create', { 
      service, 
      isStandardService 
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cargar formulario de edición:`, error);
    next(error);
  }
};

// Actualizar un tipo de servicio
exports.updateCustomService = (req, res, next) => {
  try {
    const serviceId = req.params.id;
    const serviceTypes = readJsonFile(serviceTypesDataPath);
    
    // Verificar si es un servicio estándar predefinido
    const isStandardService = standardServices.some(s => s.id === serviceId);
    
    // Procesar los tipos de vehículos aplicables
    let vehicleTypes = [];
    if (req.body.vehicleTypes) {
      vehicleTypes = Array.isArray(req.body.vehicleTypes) 
        ? req.body.vehicleTypes 
        : [req.body.vehicleTypes];
    }
    
    // Buscar el servicio en serviceTypes
    const serviceTypeIndex = serviceTypes.findIndex(s => s.id === serviceId);
    
    if (serviceTypeIndex === -1) {
      // Si no existe en serviceTypes, crear uno nuevo (puede ocurrir con servicios estándar predefinidos)
      serviceTypes.push({
        id: serviceId,
        name: req.body.name,
        code: serviceId,
        description: req.body.description || '',
        category: req.body.category || 'routine',
        vehicleTypes: vehicleTypes,
        isSystemDefault: isStandardService,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Actualizar el servicio existente
      serviceTypes[serviceTypeIndex] = {
        ...serviceTypes[serviceTypeIndex],
        name: req.body.name,
        description: req.body.description || '',
        category: req.body.category || serviceTypes[serviceTypeIndex].category || 'routine',
        vehicleTypes: vehicleTypes,
        updatedAt: new Date().toISOString()
      };
    }
    
    // Guardar la lista actualizada
    writeJsonFile(serviceTypesDataPath, serviceTypes);
    
    console.log(`[${new Date().toISOString()}] Servicio ${isStandardService ? 'estándar' : 'personalizado'} ACTUALIZADO - ID: ${serviceId}`);
    
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al actualizar servicio:`, error);
    next(error);
  }
};

// Eliminar un tipo de servicio
exports.deleteCustomService = (req, res, next) => {
  try {
    const serviceId = req.params.id;
    const serviceTypes = readJsonFile(serviceTypesDataPath);
    
    // Buscar el índice del servicio
    const serviceTypeIndex = serviceTypes.findIndex(s => s.id === serviceId);
    
    if (serviceTypeIndex === -1) {
      console.warn(`[${new Date().toISOString()}] Intento de eliminar servicio no existente - ID: ${serviceId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Servicio no encontrado'
      });
    }
    
    // Verificar que no es un servicio del sistema
    if (serviceTypes[serviceTypeIndex].isSystemDefault) {
      console.warn(`[${new Date().toISOString()}] Intento de eliminar servicio del sistema - ID: ${serviceId}`);
      return res.status(403).render('error', {
        error: null,
        message: 'No se puede eliminar un servicio predefinido del sistema'
      });
    }
    
    // Eliminar el servicio
    const deletedService = serviceTypes.splice(serviceTypeIndex, 1)[0];
    
    // Guardar la lista actualizada
    writeJsonFile(serviceTypesDataPath, serviceTypes);
    
    console.log(`[${new Date().toISOString()}] Servicio personalizado ELIMINADO - ID: ${deletedService.id}, Nombre: ${deletedService.name}`);
    
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al eliminar servicio personalizado:`, error);
    next(error);
  }
};

// ---------------------- Reglas de mantenimiento ----------------------

// Mostrar formulario para crear una nueva regla
exports.getCreateRuleForm = (req, res, next) => {
  try {
    const customServices = readJsonFile(serviceTypesDataPath);
    const vehicles = readJsonFile(vehiclesDataPath);
    
    console.log(`[${new Date().toISOString()}] Cargando formulario para crear nueva regla de mantenimiento`);
    
    res.render('maintenance/admin-rule-create', { customServices, vehicles });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cargar formulario de creación de regla:`, error);
    next(error);
  }
};

// Crear una nueva regla de mantenimiento
exports.createMaintenanceRule = (req, res, next) => {
  try {
    const maintenanceRules = readJsonFile(maintenanceRulesDataPath);
    
    // Determinar el tipo de condición y sus valores
    let conditionValue;
    if (req.body.conditionType === 'mileage') {
      conditionValue = parseInt(req.body.mileageValue);
    } else if (req.body.conditionType === 'time') {
      conditionValue = parseInt(req.body.timeValue);
    } else if (req.body.conditionType === 'combined') {
      conditionValue = {
        mileage: parseInt(req.body.mileageValue),
        time: parseInt(req.body.timeValue)
      };
    }
    
    // Procesar los vehículos seleccionados
    let vehicleIds = [];
    // Si "allVehicles" está marcado, dejamos el array vacío para indicar que aplica a todos
    if (!req.body.allVehicles && req.body.vehicleIds) {
      vehicleIds = Array.isArray(req.body.vehicleIds) 
        ? req.body.vehicleIds 
        : [req.body.vehicleIds];
    }
    
    // Crear nueva regla
    const newRule = {
      id: Date.now().toString(),
      name: req.body.name,
      serviceType: req.body.serviceType,
      conditionType: req.body.conditionType,
      conditionValue: conditionValue,
      priority: req.body.priority || 'medium',
      vehicleIds: vehicleIds,
      description: req.body.description || '',
      isActive: req.body.isActive === 'on' || req.body.isActive === true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Añadir la nueva regla a la lista
    maintenanceRules.push(newRule);
    
    // Guardar la lista actualizada
    writeJsonFile(maintenanceRulesDataPath, maintenanceRules);
    
    console.log(`[${new Date().toISOString()}] Regla de mantenimiento CREADA - ID: ${newRule.id}, Nombre: ${newRule.name}`);
    
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al crear regla de mantenimiento:`, error);
    next(error);
  }
};

// Mostrar formulario para editar una regla
exports.getEditRuleForm = (req, res, next) => {
  try {
    const ruleId = req.params.id;
    const maintenanceRules = readJsonFile(maintenanceRulesDataPath);
    const customServices = readJsonFile(serviceTypesDataPath);
    const vehicles = readJsonFile(vehiclesDataPath);
    
    // Buscar la regla por ID
    const rule = maintenanceRules.find(r => r.id === ruleId);
    
    if (!rule) {
      console.warn(`[${new Date().toISOString()}] Intento de editar regla no existente - ID: ${ruleId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Regla no encontrada'
      });
    }
    
    console.log(`[${new Date().toISOString()}] Cargando formulario de edición de regla - ID: ${rule.id}`);
    
    // Reutilizaremos la vista de creación con los datos precargados
    res.render('maintenance/admin-rule-create', { rule, customServices, vehicles });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cargar formulario de edición de regla:`, error);
    next(error);
  }
};

// Actualizar una regla
exports.updateMaintenanceRule = (req, res, next) => {
  try {
    const ruleId = req.params.id;
    const maintenanceRules = readJsonFile(maintenanceRulesDataPath);
    
    // Buscar el índice de la regla
    const ruleIndex = maintenanceRules.findIndex(r => r.id === ruleId);
    
    if (ruleIndex === -1) {
      console.warn(`[${new Date().toISOString()}] Intento de actualizar regla no existente - ID: ${ruleId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Regla no encontrada'
      });
    }
    
    // Determinar el tipo de condición y sus valores
    let conditionValue;
    if (req.body.conditionType === 'mileage') {
      conditionValue = parseInt(req.body.mileageValue);
    } else if (req.body.conditionType === 'time') {
      conditionValue = parseInt(req.body.timeValue);
    } else if (req.body.conditionType === 'combined') {
      conditionValue = {
        mileage: parseInt(req.body.mileageValue),
        time: parseInt(req.body.timeValue)
      };
    }
    
    // Procesar los vehículos seleccionados
    let vehicleIds = [];
    // Si "allVehicles" está marcado, dejamos el array vacío para indicar que aplica a todos
    if (!req.body.allVehicles && req.body.vehicleIds) {
      vehicleIds = Array.isArray(req.body.vehicleIds) 
        ? req.body.vehicleIds 
        : [req.body.vehicleIds];
    }
    
    // Actualizar la regla
    maintenanceRules[ruleIndex] = {
      ...maintenanceRules[ruleIndex],
      name: req.body.name,
      serviceType: req.body.serviceType,
      conditionType: req.body.conditionType,
      conditionValue: conditionValue,
      priority: req.body.priority || 'medium',
      vehicleIds: vehicleIds,
      description: req.body.description || '',
      isActive: req.body.isActive === 'on' || req.body.isActive === true,
      updatedAt: new Date().toISOString()
    };
    
    // Guardar la lista actualizada
    writeJsonFile(maintenanceRulesDataPath, maintenanceRules);
    
    console.log(`[${new Date().toISOString()}] Regla de mantenimiento ACTUALIZADA - ID: ${ruleId}`);
    
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al actualizar regla de mantenimiento:`, error);
    next(error);
  }
};

// Cambiar el estado (activo/inactivo) de una regla
exports.toggleRuleStatus = (req, res, next) => {
  try {
    const ruleId = req.params.id;
    const maintenanceRules = readJsonFile(maintenanceRulesDataPath);
    
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
    
    // Guardar la lista actualizada
    writeJsonFile(maintenanceRulesDataPath, maintenanceRules);
    
    console.log(`[${new Date().toISOString()}] Estado de regla CAMBIADO - ID: ${ruleId}, Nuevo estado: ${maintenanceRules[ruleIndex].isActive ? 'activo' : 'inactivo'}`);
    
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cambiar estado de regla:`, error);
    next(error);
  }
};

// Eliminar una regla
exports.deleteMaintenanceRule = (req, res, next) => {
  try {
    const ruleId = req.params.id;
    const maintenanceRules = readJsonFile(maintenanceRulesDataPath);
    
    // Buscar el índice de la regla
    const ruleIndex = maintenanceRules.findIndex(r => r.id === ruleId);
    
    if (ruleIndex === -1) {
      console.warn(`[${new Date().toISOString()}] Intento de eliminar regla no existente - ID: ${ruleId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Regla no encontrada'
      });
    }
    
    // Eliminar la regla
    const deletedRule = maintenanceRules.splice(ruleIndex, 1)[0];
    
    // Guardar la lista actualizada
    writeJsonFile(maintenanceRulesDataPath, maintenanceRules);
    
    console.log(`[${new Date().toISOString()}] Regla de mantenimiento ELIMINADA - ID: ${deletedRule.id}, Nombre: ${deletedRule.name}`);
    
    res.redirect('/maintenance/admin');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al eliminar regla de mantenimiento:`, error);
    next(error);
  }
}; 