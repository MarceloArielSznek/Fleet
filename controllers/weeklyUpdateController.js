const Vehicle = require('../models/vehicle');
const Maintenance = require('../models/maintenance');
const ServiceType = require('../models/serviceType');
const MaintenanceRule = require('../models/maintenanceRule');

// Función para verificar si un vehículo necesita servicios según las reglas
exports.checkVehicleForServices = async (vehicle, rules, serviceTypes, createMaintenance = false) => {
  const currentMileage = parseInt(vehicle.mileage);
  const services = [];

  // Solo verificar vehículos que no estén retirados
  if (vehicle.status === 'retired') {
    return services;
  }

  // Obtener el último mantenimiento completado para cada tipo de servicio
  const lastMaintenanceByType = await Maintenance.getLastCompletedByServiceType(vehicle.id);
  
  // Log de todos los maintenanceType completados para depuración
  console.log(`[DEBUG] Last completed maintenance for vehicle ${vehicle.id}:`, lastMaintenanceByType);

  // Filtrar reglas activas que aplican a este vehículo (globales o específicas)
  const applicableRules = rules.filter(rule => {
    if (!rule.active) return false;
    if (!rule.vehicleIds || rule.vehicleIds.length === 0) return true; // global
    return rule.vehicleIds.includes(vehicle.id); // específica
  });

  console.log(`[${new Date().toISOString()}] Verificando servicios para vehículo ${vehicle.id} (${vehicle.name || 'Sin nombre'})`);
  console.log(`Kilometraje actual: ${currentMileage}, Estado: ${vehicle.status}`);
  console.log(`Reglas aplicables: ${applicableRules.length}`);

  // Verificar cada regla aplicable
  for (const rule of applicableRules) {
    const serviceType = serviceTypes.find(s => s.id === rule.serviceTypeId);
    const serviceName = serviceType ? serviceType.name : rule.serviceTypeId;
    
    // Buscar el último mantenimiento COMPLETED para este tipo de servicio
    const ruleKey = rule.serviceTypeId.trim().toLowerCase();
    const lastMaintenance = lastMaintenanceByType[ruleKey] || null;
    
    let needsMileage = false;
    let mileageThreshold = rule.mileageInterval;
    let lastMaintenanceMileage = lastMaintenance ? parseInt(lastMaintenance.mileage) : 0;
    let nextServiceDueMileage = mileageThreshold ? lastMaintenanceMileage + mileageThreshold : null;
    
    if (mileageThreshold && nextServiceDueMileage !== null && currentMileage >= nextServiceDueMileage) {
      needsMileage = true;
    }

    let needsTime = false;
    let timeThreshold = rule.timeIntervalDays;
    let lastMaintenanceDate = lastMaintenance ? new Date(lastMaintenance.completionDate) : null;
    let now = new Date();
    
    if (timeThreshold && lastMaintenanceDate) {
      let daysSince = Math.floor((now - lastMaintenanceDate) / (1000 * 60 * 60 * 24));
      if (daysSince >= timeThreshold) {
        needsTime = true;
      }
    } else if (timeThreshold && !lastMaintenanceDate) {
      // Si nunca se hizo, considerar que necesita mantenimiento
      needsTime = true;
    }

    // --- Lógica combinada ---
    let needsService = false;
    if (rule.mileageInterval && rule.timeIntervalDays) {
      needsService = needsMileage || needsTime;
    } else if (rule.mileageInterval) {
      needsService = needsMileage;
    } else if (rule.timeIntervalDays) {
      needsService = needsTime;
    }

    // LOG de depuración
    console.log(`[RULE CHECK] Vehículo: ${vehicle.id}, Servicio: ${rule.serviceTypeId}`);
    console.log(`  currentMileage: ${currentMileage}`);
    console.log(`  lastMaintenanceMileage: ${lastMaintenanceMileage}`);
    console.log(`  nextServiceDueMileage: ${nextServiceDueMileage}`);
    console.log(`  needsMileage: ${needsMileage}`);
    console.log(`  needsTime: ${needsTime}`);
    console.log(`  needsService: ${needsService}`);

    if (needsService) {
      console.log(`[RULE ALERT] Se notificará servicio para ${serviceName} (motivo: ${needsMileage ? 'mileage' : ''}${needsMileage && needsTime ? ' y ' : ''}${needsTime ? 'time' : ''})`);
      services.push({
        ruleId: rule.id,
        ruleName: rule.name,
        serviceType: rule.serviceTypeId,
        serviceName: serviceName,
        mileageThreshold: mileageThreshold,
        timeThreshold: timeThreshold,
        currentMileage: currentMileage,
        lastMaintenanceMileage: lastMaintenanceMileage,
        nextServiceDueMileage: nextServiceDueMileage,
        status: 'needed',
        priority: rule.priority
      });
    }
  }

  return services;
};

// Controlador para la vista principal
exports.getWeeklyUpdateView = async (req, res, next) => {
  try {
    // Obtener todos los vehículos, reglas y tipos de servicio
    const vehicles = await Vehicle.getAll();
    const maintenanceRules = await MaintenanceRule.getAllActive();
    const serviceTypes = await ServiceType.getAllActive();
    
    // Filtrar solo vehículos que no estén retirados
    const activeVehicles = vehicles.filter(v => v.status !== 'retired');
    
    // Verificar servicios necesarios para cada vehículo
    const vehiclesWithServices = [];
    for (const vehicle of activeVehicles) {
      const services = await exports.checkVehicleForServices(vehicle, maintenanceRules, serviceTypes, false);
      vehiclesWithServices.push({
        ...vehicle,
        services
      });
    }
    
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
exports.updateVehicleMileage = async (req, res, next) => {
  try {
    const vehicleId = req.params.id;
    const newMileage = parseInt(req.body.mileage);
    
    if (isNaN(newMileage) || newMileage < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'El kilometraje debe ser un número positivo.'
      });
    }
    
    const vehicle = await Vehicle.findById(vehicleId);
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
    const updated = await Vehicle.findByIdAndUpdate(vehicleId, vehicle);
    
    if (!updated) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el kilometraje.'
      });
    }
    
    // Obtener las reglas y tipos de servicio para verificar si se necesitan servicios
    const maintenanceRules = await MaintenanceRule.getAllActive();
    const serviceTypes = await ServiceType.getAllActive();
    
    // Verificar si se necesitan servicios con el nuevo kilometraje
    const services = await exports.checkVehicleForServices(updated, maintenanceRules, serviceTypes, true);
    
    console.log(`[${new Date().toISOString()}] Kilometraje ACTUALIZADO - ID: ${vehicleId}, Nuevo: ${newMileage}, Servicios necesarios: ${services.length}`);
    
    res.json({ 
      success: true, 
      message: 'Kilometraje actualizado correctamente.',
      vehicle: updated,
      services
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al actualizar kilometraje:`, error);
    next(error);
  }
};

// Controlador para actualizar múltiples vehículos
exports.updateMultipleVehicles = async (req, res, next) => {
  try {
    const updates = req.body;
    const results = {
      updated: [],
      failed: []
    };
    
    const maintenanceRules = await MaintenanceRule.getAllActive();
    const serviceTypes = await ServiceType.getAllActive();
    
    for (const update of updates) {
      try {
        const vehicleId = update.vehicleId;
        const newMileage = parseInt(update.mileage);
        
        if (isNaN(newMileage) || newMileage < 0) {
          results.failed.push({
            vehicleId,
            error: 'El kilometraje debe ser un número positivo.'
          });
          continue;
        }
        
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
          results.failed.push({
            vehicleId,
            error: 'Vehículo no encontrado.'
          });
          continue;
        }
        
        // Verificar que el nuevo kilometraje sea mayor que el actual
        const currentMileage = parseInt(vehicle.mileage);
        if (newMileage < currentMileage) {
          results.failed.push({
            vehicleId,
            error: 'El nuevo kilometraje no puede ser menor que el actual.'
          });
          continue;
        }
        
        // Actualizar el kilometraje del vehículo
        vehicle.mileage = newMileage.toString();
        const updated = await Vehicle.findByIdAndUpdate(vehicleId, vehicle);
        
        if (updated) {
          const services = await exports.checkVehicleForServices(updated, maintenanceRules, serviceTypes, true);
          
          results.updated.push({
            vehicleId,
            oldMileage: currentMileage,
            newMileage: newMileage,
            services
          });
          
          console.log(`[${new Date().toISOString()}] Kilometraje actualizado - Vehículo ID: ${vehicleId}, Valor anterior: ${currentMileage}, Nuevo valor: ${newMileage}`);
        } else {
          results.failed.push({
            vehicleId,
            error: 'Error al actualizar el kilometraje.'
          });
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR al actualizar vehículo ${update.vehicleId}:`, error);
        results.failed.push({
          vehicleId: update.vehicleId,
          error: 'Error interno del servidor.'
        });
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al actualizar múltiples vehículos:`, error);
    next(error);
  }
}; 