const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
    user: 'postgres',
    host: '149.50.148.105',
    database: 'alohomora',
    password: 'Fideo2022',
    port: 5432,
    searchPath: 'fleet' // Set the search path to use the fleet schema
});

// Paths to JSON files
const vehiclesPath = path.join(__dirname, '../data/vehicles.json');
const maintenancePath = path.join(__dirname, '../data/maintenance.json');

async function migrateData() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Read and migrate vehicles
        if (fs.existsSync(vehiclesPath)) {
            const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, 'utf8'));
            for (const vehicle of vehicles) {
                const now = new Date().toISOString();
                await client.query(
                    `INSERT INTO fleet.vehicles (
                        id, name, plate, brand, model, year, type, status,
                        last_maintenance, driver, fuel_type, mileage, image,
                        vin, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
                    [
                        vehicle.id || String(Date.now()),
                        vehicle.name || null,
                        vehicle.plate,
                        vehicle.brand,
                        vehicle.model,
                        vehicle.year,
                        vehicle.type || 'car',
                        vehicle.status || 'active',
                        vehicle.lastMaintenance || null,
                        vehicle.driver || null,
                        vehicle.fuelType || 'unknown',
                        vehicle.mileage || 0,
                        vehicle.image || null,
                        vehicle.vin || null,
                        vehicle.createdAt || now,
                        vehicle.updatedAt || now
                    ]
                );
            }
            console.log(`Migrated ${vehicles.length} vehicles`);
        }

        // Read and migrate maintenance records
        if (fs.existsSync(maintenancePath)) {
            const maintenanceRecords = JSON.parse(fs.readFileSync(maintenancePath, 'utf8'));
            for (const record of maintenanceRecords) {
                const now = new Date().toISOString();
                await client.query(
                    `INSERT INTO fleet.maintenance (
                        id, vehicle_id, maintenance_type, status, schedule_date,
                        completion_date, cost, service_provider, service_location,
                        mileage, notes, parts_replaced, documents, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                    [
                        record.id || String(Date.now()),
                        record.vehicleId,
                        record.maintenanceType,
                        record.status || 'scheduled',
                        record.scheduleDate,
                        record.completionDate || null,
                        record.cost || null,
                        record.serviceProvider || null,
                        record.serviceLocation || null,
                        record.mileage || null,
                        record.notes || null,
                        record.partsReplaced || null,
                        JSON.stringify(record.documents || []),
                        record.createdAt || now,
                        record.updatedAt || now
                    ]
                );
            }
            console.log(`Migrated ${maintenanceRecords.length} maintenance records`);
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during migration:', error);
        throw error;
    } finally {
        client.release();
        pool.end();
    }
}

migrateData().catch(console.error); 