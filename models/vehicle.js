const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/vehicles.json');

class Vehicle {
  constructor(data) {
    this.id = data.id || String(Date.now());
    this.plate = data.plate;
    this.brand = data.brand;
    this.model = data.model;
    this.year = data.year;
    this.type = data.type || 'car';
    this.status = data.status || 'active';
    this.lastMaintenance = data.lastMaintenance || null;
    this.driver = data.driver || null;
    this.fuelType = data.fuelType;
    this.mileage = data.mileage || 0;
    this.image = data.image || null;
    this.vin = data.vin || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Obtener todos los vehículos
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
      console.error('Error al leer vehículos:', error);
      return [];
    }
  }

  // Buscar un vehículo por ID
  static findById(id) {
    try {
      const vehicles = this.getAll();
      return vehicles.find(vehicle => vehicle.id === id) || null;
    } catch (error) {
      console.error('Error al buscar vehículo:', error);
      return null;
    }
  }

  // Guardar vehículos en el archivo JSON
  static saveAll(vehicles) {
    try {
      // Asegurarse de que el directorio existe
      const dir = path.dirname(dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(dataPath, JSON.stringify(vehicles, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error al guardar vehículos:', error);
      return false;
    }
  }

  // Crear un nuevo vehículo
  save() {
    try {
      const vehicles = Vehicle.getAll();
      // Actualizar la fecha
      this.updatedAt = new Date().toISOString();
      
      // Si es un nuevo vehículo
      if (!this.id || !Vehicle.findById(this.id)) {
        this.id = String(Date.now());
        this.createdAt = new Date().toISOString();
        vehicles.push(this);
      } else {
        // Si es una actualización
        const index = vehicles.findIndex(v => v.id === this.id);
        if (index !== -1) {
          vehicles[index] = this;
        } else {
          vehicles.push(this);
        }
      }
      
      return Vehicle.saveAll(vehicles);
    } catch (error) {
      console.error('Error al guardar vehículo:', error);
      return false;
    }
  }

  // Actualizar un vehículo existente
  static findByIdAndUpdate(id, data) {
    try {
      const vehicles = this.getAll();
      const index = vehicles.findIndex(v => v.id === id);
      
      if (index === -1) return null;
      
      // Mantener los valores existentes que no se proporcionan en data
      const updatedVehicle = { 
        ...vehicles[index], 
        ...data, 
        id, 
        updatedAt: new Date().toISOString() 
      };
      
      vehicles[index] = updatedVehicle;
      this.saveAll(vehicles);
      
      return updatedVehicle;
    } catch (error) {
      console.error('Error al actualizar vehículo:', error);
      return null;
    }
  }

  // Eliminar un vehículo
  static findByIdAndDelete(id) {
    try {
      const vehicles = this.getAll();
      const index = vehicles.findIndex(v => v.id === id);
      
      if (index === -1) return null;
      
      const deletedVehicle = vehicles[index];
      vehicles.splice(index, 1);
      this.saveAll(vehicles);
      
      return deletedVehicle;
    } catch (error) {
      console.error('Error al eliminar vehículo:', error);
      return null;
    }
  }
}

module.exports = Vehicle; 