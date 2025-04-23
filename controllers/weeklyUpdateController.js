const Vehicle = require('../models/vehicle');
const fs = require('fs');
const path = require('path');

// Rutas a los archivos de datos
const maintenanceRulesDataPath = path.join(__dirname, '../data/maintenance-rules.json');
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

// Función para verificar si un vehículo necesita servicios según las reglas
const checkVehicleForServices = (vehicle, rules, serviceTypes) => {
  const currentMileage = parseInt(vehicle.mileage);
  const services = [];

  // Solo verificar vehículos activos
  if (vehicle.status !== 'active') {
    return services;
  }

  // Filtrar reglas activas que aplican a este vehículo
  const applicableRules = rules.filter(rule => 
    rule.isActive && 
    (rule.vehicleIds.length === 0 || rule.vehicleIds.includes(vehicle.id))
  );

  // Verificar cada regla aplicable
  for (const rule of applicableRules) {
    // Solo procesar reglas basadas en kilometraje o combinadas
    if (rule.conditionType !== 'mileage' && rule.conditionType !== 'combined') {
      continue;
    }

    // Obtener el umbral de kilometraje de la regla
    const mileageThreshold = rule.conditionType === 'combined' 
      ? rule.conditionValue.mileage 
      : rule.conditionValue;

    // Verificar si el kilometraje actual excede o está cerca del umbral para mantenimiento
    const lastMaintenanceMileage = 0; // Esto se podría obtener del último mantenimiento
    const mileageSinceLastService = currentMileage - lastMaintenanceMileage;
    
    // Buscamos el servicio para mostrar el nombre
    const serviceType = serviceTypes.find(s => s.id === rule.serviceType);
    const serviceName = serviceType ? serviceType.name : rule.serviceType;

    // Si el kilometraje actual supera el umbral o está a menos del 10% del umbral
    if (mileageSinceLastService >= mileageThreshold) {
      services.push({
        ruleId: rule.id,
        ruleName: rule.name,
        serviceType: rule.serviceType,
        serviceName: serviceName,
        mileageThreshold: mileageThreshold,
        currentMileage: currentMileage,
        mileageSinceLastService: mileageSinceLastService,
        status: 'needed',
        priority: rule.priority
      });
    } else if (mileageSinceLastService >= mileageThreshold * 0.9) {
      services.push({
        ruleId: rule.id,
        ruleName: rule.name,
        serviceType: rule.serviceType,
        serviceName: serviceName,
        mileageThreshold: mileageThreshold,
        currentMileage: currentMileage,
        mileageSinceLastService: mileageSinceLastService,
        status: 'upcoming',
        priority: rule.priority
      });
    }
  }

  return services;
};

// Controlador para la vista principal
exports.getWeeklyUpdateView = (req, res, next) => {
  try {
    // Obtener todos los vehículos, reglas y tipos de servicio
    const vehicles = Vehicle.getAll();
    const maintenanceRules = readJsonFile(maintenanceRulesDataPath, []);
    const serviceTypes = readJsonFile(serviceTypesDataPath, []);
    
    // Filtrar solo vehículos activos
    const activeVehicles = vehicles.filter(v => v.status !== 'retired');
    
    // Verificar servicios necesarios para cada vehículo
    const vehiclesWithServices = activeVehicles.map(vehicle => {
      const services = checkVehicleForServices(vehicle, maintenanceRules, serviceTypes);
      return {
        ...vehicle,
        services
      };
    });
    
    console.log(`[${new Date().toISOString()}] Cargando vista de actualización semanal - Vehículos: ${vehicles.length}, Reglas: ${maintenanceRules.length}`);
    
    res.render('weekly-update/index', { 
      vehicles: vehiclesWithServices,
      serviceTypes
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cargar vista de actualización semanal:`, error);
    next(error);
  }
};

// Controlador para actualizar el kilometraje de un vehículo
exports.updateVehicleMileage = (req, res, next) => {
  try {
    const vehicleId = req.params.id;
    const newMileage = parseInt(req.body.mileage);
    
    if (isNaN(newMileage) || newMileage < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'El kilometraje debe ser un número positivo.'
      });
    }
    
    const vehicle = Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vehículo no encontrado.'
      });
    }
    
    // Verificar que el nuevo kilometraje sea mayor que el actual
    const currentMileage = parseInt(vehicle.mileage);
    if (newMileage < currentMileage) {
      return res.status(400).json({ 
        success: false, 
        message: 'El nuevo kilometraje no puede ser menor que el actual.'
      });
    }
    
    // Actualizar el kilometraje del vehículo
    vehicle.mileage = newMileage.toString();
    const updated = Vehicle.findByIdAndUpdate(vehicleId, vehicle);
    
    if (updated) {
      // Obtener las reglas y servicios para responder con servicios recomendados
      const maintenanceRules = readJsonFile(maintenanceRulesDataPath, []);
      const serviceTypes = readJsonFile(serviceTypesDataPath, []);
      const services = checkVehicleForServices(updated, maintenanceRules, serviceTypes);
      
      console.log(`[${new Date().toISOString()}] Kilometraje actualizado - Vehículo ID: ${vehicleId}, Valor anterior: ${currentMileage}, Nuevo valor: ${newMileage}`);
      
      res.json({ 
        success: true, 
        message: 'Kilometraje actualizado correctamente.',
        vehicle: updated,
        services
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el kilometraje.'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al actualizar kilometraje:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor.'
    });
  }
};

// Controlador para actualizar múltiples vehículos a la vez
exports.updateMultipleVehicles = (req, res, next) => {
  try {
    const updates = req.body.updates || [];
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se proporcionaron actualizaciones válidas.'
      });
    }
    
    const results = {
      success: true,
      updated: [],
      failed: [],
      message: 'Vehículos actualizados correctamente.'
    };
    
    const maintenanceRules = readJsonFile(maintenanceRulesDataPath, []);
    const serviceTypes = readJsonFile(serviceTypesDataPath, []);
    
    updates.forEach(update => {
      try {
        const vehicleId = update.id;
        const newMileage = parseInt(update.mileage);
        
        if (isNaN(newMileage) || newMileage < 0) {
          results.failed.push({
            id: vehicleId,
            message: 'El kilometraje debe ser un número positivo.'
          });
          return;
        }
        
        const vehicle = Vehicle.findById(vehicleId);
        if (!vehicle) {
          results.failed.push({
            id: vehicleId,
            message: 'Vehículo no encontrado.'
          });
          return;
        }
        
        // Verificar que el nuevo kilometraje sea mayor que el actual
        const currentMileage = parseInt(vehicle.mileage);
        if (newMileage < currentMileage) {
          results.failed.push({
            id: vehicleId,
            message: 'El nuevo kilometraje no puede ser menor que el actual.'
          });
          return;
        }
        
        // Actualizar el kilometraje del vehículo
        vehicle.mileage = newMileage.toString();
        const updated = Vehicle.findByIdAndUpdate(vehicleId, vehicle);
        
        if (updated) {
          const services = checkVehicleForServices(updated, maintenanceRules, serviceTypes);
          
          results.updated.push({
            id: vehicleId,
            oldMileage: currentMileage,
            newMileage: newMileage,
            vehicle: updated,
            services
          });
          
          console.log(`[${new Date().toISOString()}] Kilometraje actualizado - Vehículo ID: ${vehicleId}, Valor anterior: ${currentMileage}, Nuevo valor: ${newMileage}`);
        } else {
          results.failed.push({
            id: vehicleId,
            message: 'Error al actualizar el kilometraje.'
          });
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR en actualización masiva - Vehículo ID: ${update.id}:`, error);
        results.failed.push({
          id: update.id,
          message: 'Error interno.'
        });
      }
    });
    
    if (results.failed.length > 0 && results.updated.length === 0) {
      results.success = false;
      results.message = 'Error al actualizar los vehículos.';
    } else if (results.failed.length > 0) {
      results.message = 'Algunos vehículos fueron actualizados con errores.';
    }
    
    res.json(results);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR en actualización masiva:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor.'
    });
  }
}; 