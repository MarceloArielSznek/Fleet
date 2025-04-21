const Vehicle = require('../models/vehicle');
const Maintenance = require('../models/maintenance');
const fs = require('fs');
const path = require('path');

// Página de inicio con carrusel
exports.getHomePage = (req, res, next) => {
  try {
    const vehicles = Vehicle.getAll();
    console.log(`[${new Date().toISOString()}] Cargando página de inicio - Vehículos disponibles: ${vehicles.length}`);
    
    res.render('index', { vehicles });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al cargar página de inicio:`, error);
    next(error);
  }
};

// Obtener todos los vehículos
exports.getAllVehicles = (req, res, next) => {
  try {
    const vehicles = Vehicle.getAll();
    console.log(`[${new Date().toISOString()}] Consultando lista de vehículos - Total: ${vehicles.length}`);
    res.render('vehicles/index', { vehicles });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al obtener vehículos:`, error);
    next(error);
  }
};

// Mostrar el formulario para crear un vehículo
exports.getCreateForm = (req, res) => {
  res.render('vehicles/create');
};

// Crear un nuevo vehículo
exports.createVehicle = (req, res, next) => {
  try {
    const vehicleData = req.body;
    
    // Procesar imagen si existe
    if (req.file) {
      // Convertir ruta absoluta a relativa para el navegador
      vehicleData.image = `/images/vehicles/${req.file.filename}`;
    }
    
    const newVehicle = new Vehicle(vehicleData);
    newVehicle.save();
    
    console.log(`[${new Date().toISOString()}] Vehículo CREADO - ID: ${newVehicle.id}, Marca: ${newVehicle.brand}, Modelo: ${newVehicle.model}`);
    console.table({
      Operación: 'CREAR',
      ID: newVehicle.id,
      Matrícula: newVehicle.plate,
      Marca: newVehicle.brand,
      Modelo: newVehicle.model,
      Imagen: newVehicle.image || 'Sin imagen',
      Fecha: new Date().toLocaleString()
    });
    
    res.redirect('/');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al crear vehículo:`, error);
    
    // Si hay un archivo subido, eliminar en caso de error
    if (req.file) {
      const filePath = path.join(__dirname, '../public/images/vehicles', req.file.filename);
      fs.unlink(filePath, err => {
        if (err) console.error('Error al eliminar archivo:', err);
      });
    }
    
    next(error);
  }
};

// Mostrar detalles de un vehículo
exports.getVehicleDetails = (req, res, next) => {
  try {
    const vehicle = Vehicle.findById(req.params.id);
    if (!vehicle) {
      console.warn(`[${new Date().toISOString()}] Intento de acceder a vehículo no existente - ID: ${req.params.id}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Vehículo no encontrado'
      });
    }
    
    // Obtener registros de mantenimiento para este vehículo
    const maintenanceRecords = Maintenance.findByVehicleId(vehicle.id);
    
    console.log(`[${new Date().toISOString()}] Consultando detalles de vehículo - ID: ${vehicle.id}, Mantenimientos: ${maintenanceRecords.length}`);
    res.render('vehicles/details', { vehicle, maintenanceRecords });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al obtener detalles del vehículo:`, error);
    next(error);
  }
};

// Mostrar formulario de edición
exports.getEditForm = (req, res, next) => {
  try {
    const vehicle = Vehicle.findById(req.params.id);
    if (!vehicle) {
      console.warn(`[${new Date().toISOString()}] Intento de editar vehículo no existente - ID: ${req.params.id}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Vehículo no encontrado'
      });
    }
    
    console.log(`[${new Date().toISOString()}] Abriendo formulario de edición - ID: ${vehicle.id}`);
    res.render('vehicles/edit', { vehicle });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al obtener formulario de edición:`, error);
    next(error);
  }
};

// Actualizar un vehículo
exports.updateVehicle = (req, res, next) => {
  try {
    const vehicleId = req.params.id;
    const oldVehicle = Vehicle.findById(vehicleId);
    
    if (!oldVehicle) {
      console.warn(`[${new Date().toISOString()}] Intento de actualizar vehículo no existente - ID: ${vehicleId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Vehículo no encontrado'
      });
    }
    
    const vehicleData = req.body;
    
    // Manejar imagen
    if (req.file) {
      // Si hay una nueva imagen, guardar su ruta
      vehicleData.image = `/images/vehicles/${req.file.filename}`;
      
      // Si había una imagen anterior, eliminarla
      if (oldVehicle.image && !oldVehicle.image.includes('default-vehicle')) {
        const oldImagePath = path.join(__dirname, '../public', oldVehicle.image);
        fs.unlink(oldImagePath, err => {
          if (err) console.error('Error al eliminar imagen anterior:', err);
        });
      }
    } else if (req.body.deleteImage) {
      // Si se solicitó eliminar la imagen
      if (oldVehicle.image && !oldVehicle.image.includes('default-vehicle')) {
        const oldImagePath = path.join(__dirname, '../public', oldVehicle.image);
        fs.unlink(oldImagePath, err => {
          if (err) console.error('Error al eliminar imagen:', err);
        });
      }
      vehicleData.image = null;
    } else {
      // Mantener la imagen anterior
      delete vehicleData.image; // No actualizar el campo de imagen
    }
    
    // Quitar el campo deleteImage para no guardarlo en el modelo
    delete vehicleData.deleteImage;
    
    const updatedVehicle = Vehicle.findByIdAndUpdate(vehicleId, vehicleData);
    
    console.log(`[${new Date().toISOString()}] Vehículo ACTUALIZADO - ID: ${updatedVehicle.id}`);
    console.table({
      Operación: 'ACTUALIZAR',
      ID: updatedVehicle.id,
      Matrícula: updatedVehicle.plate,
      "Marca (antes)": oldVehicle?.brand || 'N/A',
      "Marca (después)": updatedVehicle.brand,
      "Modelo (antes)": oldVehicle?.model || 'N/A',
      "Modelo (después)": updatedVehicle.model,
      "Imagen": updatedVehicle.image || 'Sin imagen',
      Fecha: new Date().toLocaleString()
    });
    
    res.redirect(`/vehicles/${updatedVehicle.id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al actualizar vehículo:`, error);
    
    // Si hay un archivo subido, eliminar en caso de error
    if (req.file) {
      const filePath = path.join(__dirname, '../public/images/vehicles', req.file.filename);
      fs.unlink(filePath, err => {
        if (err) console.error('Error al eliminar archivo:', err);
      });
    }
    
    next(error);
  }
};

// Eliminar un vehículo
exports.deleteVehicle = (req, res, next) => {
  try {
    const vehicleId = req.params.id;
    const deletedVehicle = Vehicle.findByIdAndDelete(vehicleId);
    
    if (!deletedVehicle) {
      console.warn(`[${new Date().toISOString()}] Intento de eliminar vehículo no existente - ID: ${vehicleId}`);
      return res.status(404).render('error', {
        error: null,
        message: 'Vehículo no encontrado'
      });
    }
    
    // Eliminar la imagen asociada si existe
    if (deletedVehicle.image && !deletedVehicle.image.includes('default-vehicle')) {
      const imagePath = path.join(__dirname, '../public', deletedVehicle.image);
      fs.unlink(imagePath, err => {
        if (err) console.error('Error al eliminar imagen del vehículo eliminado:', err);
      });
    }
    
    console.log(`[${new Date().toISOString()}] Vehículo ELIMINADO - ID: ${deletedVehicle.id}`);
    console.table({
      Operación: 'ELIMINAR',
      ID: deletedVehicle.id,
      Matrícula: deletedVehicle.plate,
      Marca: deletedVehicle.brand,
      Modelo: deletedVehicle.model,
      Fecha: new Date().toLocaleString()
    });
    
    res.redirect('/vehicles');
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR al eliminar vehículo:`, error);
    next(error);
  }
};

// API para obtener todos los vehículos (formato JSON)
exports.getVehiclesAPI = (req, res, next) => {
  try {
    const vehicles = Vehicle.getAll();
    console.log(`[${new Date().toISOString()}] API - Consultando vehículos - Total: ${vehicles.length}`);
    res.json(vehicles);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR en API vehículos:`, error);
    next(error);
  }
}; 