const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
    user: 'postgres',
    host: '149.50.148.105',
    database: 'alohomora',
    password: 'Fideo2022',
    port: 5432,
    searchPath: 'fleet'
});

class ServiceType {
    constructor(data) {
        this.id = data.id || String(Date.now());
        this.name = data.name;
        this.description = data.description || null;
        this.category = data.category;
        this.isStandard = data.is_standard !== undefined ? data.is_standard : true;
        this.active = data.active !== undefined ? data.active : true;
        this.vehicleTypes = data.vehicle_types || [];
        this.createdAt = data.created_at || new Date().toISOString();
        this.updatedAt = data.updated_at || new Date().toISOString();
    }

    // Obtener todos los tipos de servicio
    static async getAll() {
        try {
            const result = await pool.query('SELECT * FROM fleet.service_types ORDER BY name');
            return result.rows.map(row => new ServiceType(row));
        } catch (error) {
            console.error('Error al leer tipos de servicio:', error);
            return [];
        }
    }

    // Obtener tipos de servicio activos
    static async getAllActive() {
        try {
            const result = await pool.query('SELECT * FROM fleet.service_types WHERE active = true ORDER BY name');
            return result.rows.map(row => new ServiceType(row));
        } catch (error) {
            console.error('Error al leer tipos de servicio activos:', error);
            return [];
        }
    }

    // Buscar por ID
    static async findById(id) {
        try {
            const result = await pool.query('SELECT * FROM fleet.service_types WHERE id = $1', [id]);
            return result.rows[0] ? new ServiceType(result.rows[0]) : null;
        } catch (error) {
            console.error('Error al buscar tipo de servicio:', error);
            return null;
        }
    }

    // Crear o actualizar un tipo de servicio
    async save() {
        try {
            this.updatedAt = new Date().toISOString();
            
            if (!this.id || !(await ServiceType.findById(this.id))) {
                this.id = String(Date.now());
                this.createdAt = new Date().toISOString();
                
                await pool.query(
                    `INSERT INTO fleet.service_types (
                        id, name, description, category, is_standard,
                        active, vehicle_types, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        this.id,
                        this.name,
                        this.description,
                        this.category,
                        this.isStandard,
                        this.active,
                        this.vehicleTypes,
                        this.createdAt,
                        this.updatedAt
                    ]
                );
            } else {
                await pool.query(
                    `UPDATE fleet.service_types SET
                        name = $1,
                        description = $2,
                        category = $3,
                        is_standard = $4,
                        active = $5,
                        vehicle_types = $6,
                        updated_at = $7
                    WHERE id = $8`,
                    [
                        this.name,
                        this.description,
                        this.category,
                        this.isStandard,
                        this.active,
                        this.vehicleTypes,
                        this.updatedAt,
                        this.id
                    ]
                );
            }
            return true;
        } catch (error) {
            console.error('Error al guardar tipo de servicio:', error);
            return false;
        }
    }

    // Eliminar un tipo de servicio
    static async delete(id) {
        try {
            const result = await pool.query('DELETE FROM fleet.service_types WHERE id = $1 RETURNING *', [id]);
            return result.rows[0] ? new ServiceType(result.rows[0]) : null;
        } catch (error) {
            console.error('Error al eliminar tipo de servicio:', error);
            return null;
        }
    }

    // Obtener tipos de servicio por tipo de vehículo
    static async getByVehicleType(vehicleType) {
        try {
            const result = await pool.query(
                "SELECT * FROM fleet.service_types WHERE $1 = ANY(vehicle_types) AND active = true ORDER BY name",
                [vehicleType]
            );
            return result.rows.map(row => new ServiceType(row));
        } catch (error) {
            console.error('Error al obtener tipos de servicio por tipo de vehículo:', error);
            return [];
        }
    }
}

module.exports = ServiceType; 