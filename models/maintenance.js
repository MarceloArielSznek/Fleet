const fs = require('fs');
const path = require('path');
const Vehicle = require('./vehicle');

const dataPath = path.join(__dirname, '../data/maintenance.json');

class Maintenance {
  constructor(data) {
    this.id = data.id || String(Date.now());
    this.vehicleId = data.vehicleId;
    this.maintenanceType = data.maintenanceType;
    this.status = data.status || 'scheduled';
    this.scheduleDate = data.scheduleDate;
    this.completionDate = data.completionDate || null;
    this.cost = data.cost ? parseFloat(data.cost) : null;
    this.serviceProvider = data.serviceProvider || null;
    this.serviceLocation = data.serviceLocation || null;
    this.mileage = data.mileage ? parseInt(data.mileage) : null;
    this.notes = data.notes || null;
    this.partsReplaced = data.partsReplaced || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Obtener todos los registros de mantenimiento
  static getAll() {
    try {
      if (!fs.existsSync(dataPath)) {
        // Si el archivo no existe, crear un array vacío
        fs.writeFileSync(dataPath, JSON.stringify([], null, 2), 'utf8');
        return [];
      }
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error al leer registros de mantenimiento:', error);
      return [];
    }
  }

  // Obtener todos los registros con información de vehículos
  static getAllWithVehicles() {
    try {
      const maintenanceRecords = this.getAll();
      const vehicles = Vehicle.getAll();
      
      // Agregar la información del vehículo a cada registro
      return maintenanceRecords.map(record => {
        const vehicle = vehicles.find(v => v.id === record.vehicleId);
        return { ...record, vehicle };
      });
    } catch (error) {
      console.error('Error al obtener registros con vehículos:', error);
      return [];
    }
  }

  // Buscar un registro por ID
  static findById(id) {
    try {
      const records = this.getAll();
      return records.find(record => record.id === id) || null;
    } catch (error) {
      console.error('Error al buscar registro de mantenimiento:', error);
      return null;
    }
  }

  // Encontrar un registro por ID con información del vehículo
  static findByIdWithVehicle(id) {
    try {
      const record = this.findById(id);
      if (!record) return null;
      
      const vehicle = Vehicle.findById(record.vehicleId);
      return { ...record, vehicle };
    } catch (error) {
      console.error('Error al buscar registro con vehículo:', error);
      return null;
    }
  }

  // Buscar registros por vehicleId
  static findByVehicleId(vehicleId) {
    try {
      const records = this.getAll();
      return records.filter(record => record.vehicleId === vehicleId);
    } catch (error) {
      console.error('Error al buscar registros por vehicleId:', error);
      return [];
    }
  }

  // Guardar registros en el archivo JSON
  static saveAll(records) {
    try {
      // Asegurarse de que el directorio existe
      const dir = path.dirname(dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(dataPath, JSON.stringify(records, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error al guardar registros de mantenimiento:', error);
      return false;
    }
  }

  // Crear un nuevo registro de mantenimiento
  save() {
    try {
      const records = Maintenance.getAll();
      // Actualizar la fecha
      this.updatedAt = new Date().toISOString();
      
      // Si es un nuevo registro
      if (!this.id || !Maintenance.findById(this.id)) {
        this.id = String(Date.now());
        this.createdAt = new Date().toISOString();
        records.push(this);
      } else {
        // Si es una actualización
        const index = records.findIndex(r => r.id === this.id);
        if (index !== -1) {
          records[index] = this;
        } else {
          records.push(this);
        }
      }
      
      // Actualizar la fecha de último mantenimiento en el vehículo
      // Solo si el estado es 'completed'
      if (this.status === 'completed' && this.completionDate) {
        const vehicle = Vehicle.findById(this.vehicleId);
        if (vehicle) {
          vehicle.lastMaintenance = this.completionDate;
          // Si el vehículo estaba en mantenimiento, ponerlo como activo
          if (vehicle.status === 'maintenance') {
            vehicle.status = 'active';
          }
          Vehicle.findByIdAndUpdate(vehicle.id, vehicle);
        }
      } else if (this.status === 'scheduled' || this.status === 'in_progress') {
        // Si el mantenimiento está programado o en progreso, marcar el vehículo como en mantenimiento
        const vehicle = Vehicle.findById(this.vehicleId);
        if (vehicle && vehicle.status !== 'retired') {
          vehicle.status = 'maintenance';
          Vehicle.findByIdAndUpdate(vehicle.id, vehicle);
        }
      }
      
      return Maintenance.saveAll(records);
    } catch (error) {
      console.error('Error al guardar registro de mantenimiento:', error);
      return false;
    }
  }

  // Actualizar un registro existente
  static findByIdAndUpdate(id, data) {
    try {
      const records = this.getAll();
      const index = records.findIndex(r => r.id === id);
      
      if (index === -1) return null;
      
      // Mantener los valores existentes que no se proporcionan en data
      const updatedRecord = { 
        ...records[index], 
        ...data, 
        id, 
        updatedAt: new Date().toISOString() 
      };
      
      records[index] = updatedRecord;
      this.saveAll(records);
      
      // Si el estado es 'completed', actualizar el vehículo
      if (updatedRecord.status === 'completed' && updatedRecord.completionDate) {
        const vehicle = Vehicle.findById(updatedRecord.vehicleId);
        if (vehicle) {
          vehicle.lastMaintenance = updatedRecord.completionDate;
          if (vehicle.status === 'maintenance') {
            vehicle.status = 'active';
          }
          Vehicle.findByIdAndUpdate(vehicle.id, vehicle);
        }
      } else if (updatedRecord.status === 'scheduled' || updatedRecord.status === 'in_progress') {
        const vehicle = Vehicle.findById(updatedRecord.vehicleId);
        if (vehicle && vehicle.status !== 'retired') {
          vehicle.status = 'maintenance';
          Vehicle.findByIdAndUpdate(vehicle.id, vehicle);
        }
      } else if (updatedRecord.status === 'cancelled') {
        // Si se cancela, verificar si hay otros mantenimientos activos
        const otherActiveMaintenances = this.getAll().filter(
          m => m.id !== id && 
               m.vehicleId === updatedRecord.vehicleId && 
               (m.status === 'scheduled' || m.status === 'in_progress')
        );
        
        if (otherActiveMaintenances.length === 0) {
          const vehicle = Vehicle.findById(updatedRecord.vehicleId);
          if (vehicle && vehicle.status === 'maintenance') {
            vehicle.status = 'active';
            Vehicle.findByIdAndUpdate(vehicle.id, vehicle);
          }
        }
      }
      
      return updatedRecord;
    } catch (error) {
      console.error('Error al actualizar registro de mantenimiento:', error);
      return null;
    }
  }

  // Eliminar un registro
  static findByIdAndDelete(id) {
    try {
      const records = this.getAll();
      const index = records.findIndex(r => r.id === id);
      
      if (index === -1) return null;
      
      const deletedRecord = records[index];
      records.splice(index, 1);
      this.saveAll(records);
      
      // Si no hay otros mantenimientos activos, cambiar el estado del vehículo a activo
      const otherActiveMaintenances = this.getAll().filter(
        m => m.vehicleId === deletedRecord.vehicleId && 
             (m.status === 'scheduled' || m.status === 'in_progress')
      );
      
      if (otherActiveMaintenances.length === 0) {
        const vehicle = Vehicle.findById(deletedRecord.vehicleId);
        if (vehicle && vehicle.status === 'maintenance') {
          vehicle.status = 'active';
          Vehicle.findByIdAndUpdate(vehicle.id, vehicle);
        }
      }
      
      return deletedRecord;
    } catch (error) {
      console.error('Error al eliminar registro de mantenimiento:', error);
      return null;
    }
  }
}

module.exports = Maintenance; 