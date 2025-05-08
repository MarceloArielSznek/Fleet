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

class MaintenanceRule {
    constructor(data) {
        this.id = data.id || String(Date.now());
        this.name = data.name || null;
        this.description = data.description || null;
        this.serviceTypeId = data.serviceTypeId || data.service_type_id;
        this.vehicleType = data.vehicleType || data.vehicle_type;
        this.mileageInterval = data.mileageInterval || data.mileage_interval || null;
        this.timeIntervalDays = data.timeIntervalDays || data.time_interval_days || null;
        this.priority = data.priority || 'normal';
        this.active = data.active !== undefined ? data.active : true;
        this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
        this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
    }

    // Obtener todas las reglas de mantenimiento
    static async getAll() {
        try {
            const result = await pool.query(`
                SELECT r.*, s.name as service_name, s.category as service_category
                FROM fleet.maintenance_rules r
                JOIN fleet.service_types s ON r.service_type_id = s.id
                ORDER BY r.priority DESC, s.name
            `);
            return result.rows.map(row => ({
                ...new MaintenanceRule(row),
                serviceName: row.service_name,
                serviceCategory: row.service_category
            }));
        } catch (error) {
            console.error('Error al leer reglas de mantenimiento:', error);
            return [];
        }
    }

    // Obtener reglas activas
    static async getAllActive() {
        try {
            const result = await pool.query(`
                SELECT r.*, s.name as service_name, s.category as service_category
                FROM fleet.maintenance_rules r
                JOIN fleet.service_types s ON r.service_type_id = s.id
                WHERE r.active = true AND s.active = true
                ORDER BY r.priority DESC, s.name
            `);
            return result.rows.map(row => ({
                ...new MaintenanceRule(row),
                serviceName: row.service_name,
                serviceCategory: row.service_category
            }));
        } catch (error) {
            console.error('Error al leer reglas de mantenimiento activas:', error);
            return [];
        }
    }

    // Buscar por ID
    static async findById(id) {
        try {
            const result = await pool.query(`
                SELECT r.*, s.name as service_name, s.category as service_category
                FROM fleet.maintenance_rules r
                JOIN fleet.service_types s ON r.service_type_id = s.id
                WHERE r.id = $1
            `, [id]);
            if (!result.rows[0]) return null;
            return {
                ...new MaintenanceRule(result.rows[0]),
                serviceName: result.rows[0].service_name,
                serviceCategory: result.rows[0].service_category
            };
        } catch (error) {
            console.error('Error al buscar regla de mantenimiento:', error);
            return null;
        }
    }

    // Obtener reglas por tipo de vehículo
    static async getByVehicleType(vehicleType) {
        try {
            const result = await pool.query(`
                SELECT r.*, s.name as service_name, s.category as service_category
                FROM fleet.maintenance_rules r
                JOIN fleet.service_types s ON r.service_type_id = s.id
                WHERE r.vehicle_type = $1 AND r.active = true AND s.active = true
                ORDER BY r.priority DESC, s.name
            `, [vehicleType]);
            return result.rows.map(row => ({
                ...new MaintenanceRule(row),
                serviceName: row.service_name,
                serviceCategory: row.service_category
            }));
        } catch (error) {
            console.error('Error al obtener reglas por tipo de vehículo:', error);
            return [];
        }
    }

    // Crear o actualizar una regla
    async save() {
        try {
            // Validar campos requeridos
            if (!this.serviceTypeId) {
                console.error('Error: service_type_id es requerido');
                return false;
            }
            if (!this.mileageInterval && !this.timeIntervalDays) {
                console.error('Error: Se requiere al menos mileage_interval o time_interval_days');
                return false;
            }

            this.updatedAt = new Date().toISOString();
            
            if (!this.id || !(await MaintenanceRule.findById(this.id))) {
                this.id = String(Date.now());
                this.createdAt = new Date().toISOString();
                
                console.log('Intentando crear nueva regla de mantenimiento:', {
                    id: this.id,
                    serviceTypeId: this.serviceTypeId,
                    vehicleType: this.vehicleType,
                    mileageInterval: this.mileageInterval,
                    timeIntervalDays: this.timeIntervalDays,
                    priority: this.priority,
                    active: this.active
                });
                
                const result = await pool.query(
                    `INSERT INTO fleet.maintenance_rules (
                        id, name, description, service_type_id, vehicle_type, mileage_interval,
                        time_interval_days, priority, active, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        this.id,
                        this.name,
                        this.description,
                        this.serviceTypeId,
                        this.vehicleType,
                        this.mileageInterval,
                        this.timeIntervalDays,
                        this.priority,
                        this.active,
                        this.createdAt,
                        this.updatedAt
                    ]
                );
                
                console.log('Resultado de la inserción:', result);
                
                // Verificar que la regla se creó correctamente
                const createdRule = await MaintenanceRule.findById(this.id);
                if (!createdRule) {
                    console.error('Error: La regla no se creó correctamente en la base de datos');
                    return false;
                }
                
                console.log('Regla creada exitosamente:', createdRule);
            } else {
                await pool.query(
                    `UPDATE fleet.maintenance_rules SET
                        name = $1,
                        description = $2,
                        service_type_id = $3,
                        vehicle_type = $4,
                        mileage_interval = $5,
                        time_interval_days = $6,
                        priority = $7,
                        active = $8,
                        updated_at = $9
                    WHERE id = $10`,
                    [
                        this.name,
                        this.description,
                        this.serviceTypeId,
                        this.vehicleType,
                        this.mileageInterval,
                        this.timeIntervalDays,
                        this.priority,
                        this.active,
                        this.updatedAt,
                        this.id
                    ]
                );
            }
            return true;
        } catch (error) {
            console.error('Error al guardar regla de mantenimiento:', error);
            return false;
        }
    }

    // Eliminar una regla
    static async delete(id) {
        await pool.query('DELETE FROM fleet.maintenance_rules WHERE id = $1', [id]);
    }

    // Asociar vehículos a una regla
    static async addVehiclesToRule(ruleId, vehicleIds) {
        if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) return;
        const values = vehicleIds.map(vehicleId => `('${ruleId}', '${vehicleId}')`).join(',');
        const query = `INSERT INTO fleet.maintenance_rule_vehicles (rule_id, vehicle_id) VALUES ${values}`;
        await pool.query(query);
    }

    // Obtener vehículos asociados a una regla
    static async getVehiclesForRule(ruleId) {
        const result = await pool.query('SELECT vehicle_id FROM fleet.maintenance_rule_vehicles WHERE rule_id = $1', [ruleId]);
        return result.rows.map(row => row.vehicle_id);
    }

    // Obtener todas las reglas con vehículos asociados
    static async getAllWithVehicles() {
        const rules = await this.getAll();
        for (const rule of rules) {
            rule.vehicleIds = await this.getVehiclesForRule(rule.id);
        }
        return rules;
    }

    // Eliminar asociaciones de vehículos de una regla
    static async removeVehiclesFromRule(ruleId) {
        await pool.query('DELETE FROM fleet.maintenance_rule_vehicles WHERE rule_id = $1', [ruleId]);
    }
}

module.exports = MaintenanceRule;