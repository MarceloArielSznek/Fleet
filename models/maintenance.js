const { Pool } = require('pg');
const Vehicle = require('./vehicle');

// Database configuration
const pool = new Pool({
    user: 'postgres',
    host: '149.50.148.105',
    database: 'alohomora',
    password: 'Fideo2022',
    port: 5432,
    searchPath: 'fleet' // Set the search path to use the fleet schema
});

class Maintenance {
    constructor(data) {
        this.id = data.id || String(Date.now());
        this.vehicleId = data.vehicleId;
        this.maintenanceType = data.maintenanceType;
        this.status = data.status || 'scheduled';
        this.scheduleDate = data.scheduleDate;
        this.completionDate = data.completionDate || null;
        this.cost = data.cost !== undefined && data.cost !== null ? parseFloat(data.cost) : null;
        this.serviceProvider = data.serviceProvider || null;
        this.serviceLocation = data.serviceLocation || null;
        this.mileage = data.mileage ? parseInt(data.mileage) : null;
        this.notes = data.notes || null;
        this.partsReplaced = data.partsReplaced || null;
        this.documents = data.documents || [];
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    // Obtener todos los registros de mantenimiento
    static async getAll() {
        try {
            const result = await pool.query('SELECT * FROM fleet.maintenance ORDER BY created_at DESC');
            return result.rows;
        } catch (error) {
            console.error('Error al leer registros de mantenimiento:', error);
            return [];
        }
    }

    // Obtener todos los registros con información de vehículos
    static async getAllWithVehicles() {
        try {
            const result = await pool.query(`
                SELECT 
                    m.id,
                    m.vehicle_id,
                    m.maintenance_type,
                    m.status,
                    m.schedule_date,
                    m.completion_date,
                    m.cost,
                    m.service_provider,
                    m.service_location,
                    m.mileage,
                    m.notes,
                    m.parts_replaced,
                    m.documents,
                    m.created_at,
                    m.updated_at,
                    v.id as vehicle_id,
                    v.name,
                    v.plate,
                    v.brand,
                    v.model,
                    v.year,
                    v.type,
                    v.status as vehicle_status,
                    v.last_maintenance,
                    v.driver,
                    v.fuel_type,
                    v.mileage as vehicle_mileage,
                    v.image,
                    v.vin,
                    v.created_at as vehicle_created_at,
                    v.updated_at as vehicle_updated_at
                FROM fleet.maintenance m
                LEFT JOIN fleet.vehicles v ON m.vehicle_id = v.id
                ORDER BY m.created_at DESC
            `);
            
            return result.rows.map(row => {
                const maintenance = {
                    id: row.id,
                    vehicleId: row.vehicle_id,
                    maintenanceType: row.maintenance_type,
                    status: row.status,
                    scheduleDate: row.schedule_date,
                    completionDate: row.completion_date,
                    cost: row.cost !== null ? parseFloat(row.cost) : null,
                    serviceProvider: row.service_provider,
                    serviceLocation: row.service_location,
                    mileage: row.mileage ? parseInt(row.mileage) : null,
                    notes: row.notes,
                    partsReplaced: row.parts_replaced,
                    documents: row.documents || [],
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                };
                
                if (row.vehicle_id) {
                    maintenance.vehicle = {
                        id: row.vehicle_id,
                        name: row.name,
                        plate: row.plate,
                        brand: row.brand,
                        model: row.model,
                        year: row.year,
                        type: row.type,
                        status: row.vehicle_status,
                        lastMaintenance: row.last_maintenance,
                        driver: row.driver,
                        fuelType: row.fuel_type,
                        mileage: row.vehicle_mileage,
                        image: row.image,
                        vin: row.vin,
                        createdAt: row.vehicle_created_at,
                        updatedAt: row.vehicle_updated_at
                    };
                }
                
                return maintenance;
            });
        } catch (error) {
            console.error('Error al leer registros de mantenimiento con vehículos:', error);
            return [];
        }
    }

    // Buscar un registro por ID
    static async findById(id) {
        try {
            const result = await pool.query(`
                SELECT 
                    id,
                    vehicle_id,
                    maintenance_type,
                    status,
                    schedule_date,
                    completion_date,
                    cost,
                    service_provider,
                    service_location,
                    mileage,
                    notes,
                    parts_replaced,
                    documents,
                    created_at,
                    updated_at
                FROM fleet.maintenance 
                WHERE id = $1
            `, [id]);
            
            if (result.rows.length === 0) return null;
            
            const row = result.rows[0];
            return {
                id: row.id,
                vehicleId: row.vehicle_id,
                maintenanceType: row.maintenance_type,
                status: row.status,
                scheduleDate: row.schedule_date,
                completionDate: row.completion_date,
                cost: row.cost !== null ? parseFloat(row.cost) : null,
                serviceProvider: row.service_provider,
                serviceLocation: row.service_location,
                mileage: row.mileage ? parseInt(row.mileage) : null,
                notes: row.notes,
                partsReplaced: row.parts_replaced,
                documents: row.documents || [],
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
        } catch (error) {
            console.error('Error al buscar registro de mantenimiento:', error);
            return null;
        }
    }

    // Encontrar un registro por ID con información del vehículo
    static async findByIdWithVehicle(id) {
        try {
            const result = await pool.query(`
                SELECT 
                    m.id,
                    m.vehicle_id,
                    m.maintenance_type,
                    m.status,
                    m.schedule_date,
                    m.completion_date,
                    m.cost,
                    m.service_provider,
                    m.service_location,
                    m.mileage,
                    m.notes,
                    m.parts_replaced,
                    m.documents,
                    m.created_at,
                    m.updated_at,
                    v.id as vehicle_id,
                    v.name,
                    v.plate,
                    v.brand,
                    v.model,
                    v.year,
                    v.type,
                    v.status as vehicle_status,
                    v.last_maintenance,
                    v.driver,
                    v.fuel_type,
                    v.mileage as vehicle_mileage,
                    v.image,
                    v.vin,
                    v.created_at as vehicle_created_at,
                    v.updated_at as vehicle_updated_at
                FROM fleet.maintenance m
                LEFT JOIN fleet.vehicles v ON m.vehicle_id = v.id
                WHERE m.id = $1
            `, [id]);
            
            if (result.rows.length === 0) return null;
            
            const row = result.rows[0];
            const maintenance = {
                id: row.id,
                vehicleId: row.vehicle_id,
                maintenanceType: row.maintenance_type,
                status: row.status,
                scheduleDate: row.schedule_date,
                completionDate: row.completion_date,
                cost: row.cost !== null ? parseFloat(row.cost) : null,
                serviceProvider: row.service_provider,
                serviceLocation: row.service_location,
                mileage: row.mileage ? parseInt(row.mileage) : null,
                notes: row.notes,
                partsReplaced: row.parts_replaced,
                documents: row.documents || [],
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
            
            if (row.vehicle_id) {
                maintenance.vehicle = {
                    id: row.vehicle_id,
                    name: row.name,
                    plate: row.plate,
                    brand: row.brand,
                    model: row.model,
                    year: row.year,
                    type: row.type,
                    status: row.vehicle_status,
                    lastMaintenance: row.last_maintenance,
                    driver: row.driver,
                    fuelType: row.fuel_type,
                    mileage: row.vehicle_mileage,
                    image: row.image,
                    vin: row.vin,
                    createdAt: row.vehicle_created_at,
                    updatedAt: row.vehicle_updated_at
                };
            }
            
            return maintenance;
        } catch (error) {
            console.error('Error al buscar registro con vehículo:', error);
            return null;
        }
    }

    // Buscar registros por vehicleId
    static async findByVehicleId(vehicleId) {
        try {
            const result = await pool.query(
                'SELECT * FROM fleet.maintenance WHERE vehicle_id = $1 ORDER BY created_at DESC',
                [vehicleId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error al buscar registros por vehicleId:', error);
            return [];
        }
    }

    // Obtener el último mantenimiento completado para cada tipo de servicio de un vehículo
    static async getLastCompletedByServiceType(vehicleId) {
        try {
            const result = await pool.query(`
                SELECT DISTINCT ON (maintenance_type) 
                    id, vehicle_id, maintenance_type, status, completion_date, mileage
                FROM fleet.maintenance 
                WHERE vehicle_id = $1 
                AND status = 'completed'
                AND completion_date IS NOT NULL
                ORDER BY maintenance_type, mileage DESC
            `, [vehicleId]);
            
            // Convertir a un objeto donde la clave es el tipo de mantenimiento (lowercase, trimmed)
            const lastMaintenanceByType = {};
            result.rows.forEach(row => {
                const key = row.maintenance_type.trim().toLowerCase();
                lastMaintenanceByType[key] = {
                    id: row.id,
                    vehicleId: row.vehicle_id,
                    maintenanceType: row.maintenance_type,
                    status: row.status,
                    completionDate: row.completion_date,
                    mileage: row.mileage ? parseInt(row.mileage) : null
                };
            });
            
            // Log para depuración
            console.log(`[DEBUG] Últimos mantenimientos por tipo para vehículo ${vehicleId}:`, lastMaintenanceByType);
            
            return lastMaintenanceByType;
        } catch (error) {
            console.error('Error al obtener últimos mantenimientos por tipo:', error);
            return {};
        }
    }

    // Crear un nuevo registro de mantenimiento
    async save() {
        try {
            this.updatedAt = new Date().toISOString();
            
            if (!this.id || !(await Maintenance.findById(this.id))) {
                this.id = String(Date.now());
                this.createdAt = new Date().toISOString();
                
                console.log('Intentando crear nuevo registro de mantenimiento:', {
                    id: this.id,
                    vehicleId: this.vehicleId,
                    maintenanceType: this.maintenanceType,
                    status: this.status,
                    scheduleDate: this.scheduleDate,
                    completionDate: this.completionDate,
                    cost: this.cost,
                    serviceProvider: this.serviceProvider,
                    serviceLocation: this.serviceLocation,
                    mileage: this.mileage
                });
                
                const result = await pool.query(
                    `INSERT INTO fleet.maintenance (
                        id, vehicle_id, maintenance_type, status, schedule_date,
                        completion_date, cost, service_provider, service_location,
                        mileage, notes, parts_replaced, documents, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                    [
                        this.id,
                        this.vehicleId,
                        this.maintenanceType,
                        this.status,
                        this.scheduleDate,
                        this.completionDate,
                        this.cost,
                        this.serviceProvider,
                        this.serviceLocation,
                        this.mileage,
                        this.notes,
                        this.partsReplaced,
                        JSON.stringify(this.documents),
                        this.createdAt,
                        this.updatedAt
                    ]
                );
                
                console.log('Resultado de la inserción:', result);
                
                // Verificar que el registro se creó correctamente
                const createdRecord = await Maintenance.findById(this.id);
                if (!createdRecord) {
                    console.error('Error: El registro no se creó correctamente en la base de datos');
                    return false;
                }
                
                console.log('Registro creado exitosamente:', createdRecord);
            } else {
                await pool.query(
                    `UPDATE fleet.maintenance SET
                        vehicle_id = $1,
                        maintenance_type = $2,
                        status = $3,
                        schedule_date = $4,
                        completion_date = $5,
                        cost = $6,
                        service_provider = $7,
                        service_location = $8,
                        mileage = $9,
                        notes = $10,
                        parts_replaced = $11,
                        documents = $12,
                        updated_at = $13
                    WHERE id = $14`,
                    [
                        this.vehicleId,
                        this.maintenanceType,
                        this.status,
                        this.scheduleDate,
                        this.completionDate,
                        this.cost,
                        this.serviceProvider,
                        this.serviceLocation,
                        this.mileage,
                        this.notes,
                        this.partsReplaced,
                        JSON.stringify(this.documents),
                        this.updatedAt,
                        this.id
                    ]
                );
            }

            // Actualizar el estado del vehículo según el estado del mantenimiento
            if (this.status === 'completed' && this.completionDate) {
                // Actualizar el kilometraje del vehículo si es mayor
                const vehicleResult = await pool.query('SELECT mileage FROM vehicles WHERE id = $1', [this.vehicleId]);
                if (vehicleResult.rows.length > 0) {
                    const currentVehicleMileage = parseInt(vehicleResult.rows[0].mileage) || 0;
                    if (this.mileage && this.mileage > currentVehicleMileage) {
                        await pool.query(
                            'UPDATE vehicles SET mileage = $1 WHERE id = $2',
                            [this.mileage, this.vehicleId]
                        );
                    }
                }
                await pool.query(
                    'UPDATE vehicles SET last_maintenance = $1, status = CASE WHEN status = $2 THEN $3 ELSE status END, mileage = COALESCE($4, mileage) WHERE id = $5',
                    [this.completionDate, 'maintenance', 'active', this.mileage, this.vehicleId]
                );
            } else if (this.status === 'scheduled' || this.status === 'in_progress') {
                await pool.query(
                    'UPDATE vehicles SET status = $1 WHERE id = $2 AND status != $3',
                    ['maintenance', this.vehicleId, 'retired']
                );
            } else if (this.status === 'cancelled') {
                // Verificar si hay otros mantenimientos activos
                const result = await pool.query(
                    'SELECT COUNT(*) FROM maintenance WHERE vehicle_id = $1 AND id != $2 AND status IN ($3, $4)',
                    [this.vehicleId, this.id, 'scheduled', 'in_progress']
                );
                
                if (result.rows[0].count === '0') {
                    await pool.query(
                        'UPDATE vehicles SET status = $1 WHERE id = $2 AND status = $3',
                        ['active', this.vehicleId, 'maintenance']
                    );
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error al guardar registro de mantenimiento:', error);
            return false;
        }
    }

    // Actualizar un registro existente
    static async findByIdAndUpdate(id, data) {
        try {
            const maintenance = await Maintenance.findById(id);
            if (!maintenance) return null;

            const updatedMaintenance = { ...maintenance, ...data, id, updatedAt: new Date().toISOString() };
            const newMaintenance = new Maintenance(updatedMaintenance);
            await newMaintenance.save();
            
            return updatedMaintenance;
        } catch (error) {
            console.error('Error al actualizar registro de mantenimiento:', error);
            return null;
        }
    }

    // Eliminar un registro
    static async findByIdAndDelete(id) {
        try {
            const maintenance = await Maintenance.findById(id);
            if (!maintenance) return null;

            await pool.query('DELETE FROM fleet.maintenance WHERE id = $1', [id]);
            
            // Verificar si hay otros mantenimientos activos
            const result = await pool.query(
                'SELECT COUNT(*) FROM maintenance WHERE vehicle_id = $1 AND status IN ($2, $3)',
                [maintenance.vehicleId, 'scheduled', 'in_progress']
            );
            
            if (result.rows[0].count === '0') {
                await pool.query(
                    'UPDATE vehicles SET status = $1 WHERE id = $2 AND status = $3',
                    ['active', maintenance.vehicleId, 'maintenance']
                );
            }
            
            return maintenance;
        } catch (error) {
            console.error('Error al eliminar registro de mantenimiento:', error);
            return null;
        }
    }

    // Agregar un documento
    static async addDocument(maintenanceId, document) {
        try {
            const maintenance = await Maintenance.findById(maintenanceId);
            if (!maintenance) return null;

            const documents = maintenance.documents || [];
            documents.push(document);
            
            await pool.query(
                'UPDATE fleet.maintenance SET documents = $1, updated_at = $2 WHERE id = $3',
                [JSON.stringify(documents), new Date().toISOString(), maintenanceId]
            );
            
            return { ...maintenance, documents };
        } catch (error) {
            console.error('Error al agregar documento:', error);
            return null;
        }
    }

    // Eliminar un documento
    static async removeDocument(maintenanceId, documentId) {
        try {
            const maintenance = await Maintenance.findById(maintenanceId);
            if (!maintenance) return null;

            const documents = maintenance.documents || [];
            const updatedDocuments = documents.filter(doc => doc.id !== documentId);
            
            await pool.query(
                'UPDATE fleet.maintenance SET documents = $1, updated_at = $2 WHERE id = $3',
                [JSON.stringify(updatedDocuments), new Date().toISOString(), maintenanceId]
            );
            
            return { ...maintenance, documents: updatedDocuments };
        } catch (error) {
            console.error('Error al eliminar documento:', error);
            return null;
        }
    }

    static async create(data) {
        const id = data.id || String(Date.now());
        const result = await pool.query(
            `INSERT INTO fleet.maintenance (
                id, vehicle_id, maintenance_type, schedule_date, status, notes
            ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
                id,
                data.vehicleId,
                data.maintenanceType,
                data.scheduleDate,
                data.status,
                data.notes || null
            ]
        );
        return result.rows[0];
    }

    static async existsScheduledOrInProgress(vehicleId, maintenanceType) {
        const result = await pool.query(
            `SELECT 1 FROM fleet.maintenance 
             WHERE vehicle_id = $1 AND maintenance_type = $2 
             AND status IN ('scheduled', 'in_progress') LIMIT 1`,
            [vehicleId, maintenanceType]
        );
        return result.rows.length > 0;
    }
}

module.exports = Maintenance; 