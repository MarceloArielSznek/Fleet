const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
    user: 'postgres',
    host: '149.50.148.105',
    database: 'alohomora',
    password: 'Fideo2022',
    port: 5432,
    searchPath: 'fleet' // Set the search path to use the fleet schema
});

class Vehicle {
    constructor(data) {
        this.id = data.id || String(Date.now());
        this.name = data.name || null;
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
    static async getAll() {
        try {
            const result = await pool.query('SELECT * FROM fleet.vehicles ORDER BY created_at DESC');
            return result.rows;
        } catch (error) {
            console.error('Error al leer vehículos:', error);
            return [];
        }
    }

    // Buscar un vehículo por ID
    static async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM fleet.vehicles WHERE id = $1', [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error al buscar vehículo:', error);
            return null;
        }
    }

    // Crear un nuevo vehículo
    async save() {
        try {
            this.updatedAt = new Date().toISOString();
            
            if (!this.id || !(await Vehicle.findById(this.id))) {
                this.id = String(Date.now());
                this.createdAt = new Date().toISOString();
                
                await pool.query(
                    `INSERT INTO fleet.vehicles (
                        id, name, plate, brand, model, year, type, status,
                        last_maintenance, driver, fuel_type, mileage, image,
                        vin, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
                    [
                        this.id,
                        this.name,
                        this.plate,
                        this.brand,
                        this.model,
                        this.year,
                        this.type,
                        this.status,
                        this.lastMaintenance,
                        this.driver,
                        this.fuelType,
                        this.mileage,
                        this.image,
                        this.vin,
                        this.createdAt,
                        this.updatedAt
                    ]
                );
            } else {
                await pool.query(
                    `UPDATE fleet.vehicles SET
                        name = $1,
                        plate = $2,
                        brand = $3,
                        model = $4,
                        year = $5,
                        type = $6,
                        status = $7,
                        last_maintenance = $8,
                        driver = $9,
                        fuel_type = $10,
                        mileage = $11,
                        image = $12,
                        vin = $13,
                        updated_at = $14
                    WHERE id = $15`,
                    [
                        this.name,
                        this.plate,
                        this.brand,
                        this.model,
                        this.year,
                        this.type,
                        this.status,
                        this.lastMaintenance,
                        this.driver,
                        this.fuelType,
                        this.mileage,
                        this.image,
                        this.vin,
                        this.updatedAt,
                        this.id
                    ]
                );
            }
            return true;
        } catch (error) {
            console.error('Error al guardar vehículo:', error);
            return false;
        }
    }

    // Actualizar un vehículo existente
    static async findByIdAndUpdate(id, data) {
        try {
            const vehicle = await Vehicle.findById(id);
            if (!vehicle) return null;

            const updatedVehicle = { ...vehicle, ...data, id, updatedAt: new Date().toISOString() };
            const newVehicle = new Vehicle(updatedVehicle);
            await newVehicle.save();
            
            return updatedVehicle;
        } catch (error) {
            console.error('Error al actualizar vehículo:', error);
            return null;
        }
    }

    // Eliminar un vehículo
    static async findByIdAndDelete(id) {
        try {
            const vehicle = await Vehicle.findById(id);
            if (!vehicle) return null;

            await pool.query('DELETE FROM fleet.vehicles WHERE id = $1', [id]);
            return vehicle;
        } catch (error) {
            console.error('Error al eliminar vehículo:', error);
            return null;
        }
    }
}

module.exports = Vehicle; 