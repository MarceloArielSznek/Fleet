-- Drop existing tables and schema
DROP TABLE IF EXISTS fleet.maintenance;
DROP TABLE IF EXISTS fleet.maintenance_rules;
DROP TABLE IF EXISTS fleet.service_types;
DROP TABLE IF EXISTS fleet.vehicles;
DROP SCHEMA IF EXISTS fleet CASCADE;

-- Create the fleet schema
CREATE SCHEMA fleet;

-- Set the search path to use the fleet schema
SET search_path TO fleet;

-- Create vehicles table
CREATE TABLE fleet.vehicles (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    plate VARCHAR(50) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    type VARCHAR(50) DEFAULT 'car',
    status VARCHAR(50) DEFAULT 'active',
    last_maintenance TIMESTAMP,
    driver VARCHAR(255),
    fuel_type VARCHAR(50),
    mileage INTEGER DEFAULT 0,
    image VARCHAR(255),
    vin VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create service types table
CREATE TABLE fleet.service_types (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    is_standard BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    vehicle_types VARCHAR(50)[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create maintenance rules table
CREATE TABLE fleet.maintenance_rules (
    id VARCHAR(255) PRIMARY KEY,
    service_type_id VARCHAR(255) REFERENCES fleet.service_types(id),
    vehicle_type VARCHAR(50) NOT NULL,
    mileage_interval INTEGER,
    time_interval_days INTEGER,
    priority VARCHAR(50) DEFAULT 'normal',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create maintenance table
CREATE TABLE fleet.maintenance (
    id VARCHAR(255) PRIMARY KEY,
    vehicle_id VARCHAR(255) NOT NULL REFERENCES fleet.vehicles(id),
    maintenance_type VARCHAR(255) NOT NULL REFERENCES fleet.service_types(id),
    status VARCHAR(50) DEFAULT 'scheduled',
    schedule_date TIMESTAMP NOT NULL,
    completion_date TIMESTAMP,
    cost DECIMAL(10,2),
    service_provider VARCHAR(255),
    service_location VARCHAR(255),
    mileage INTEGER,
    notes TEXT,
    parts_replaced TEXT,
    documents JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_vehicles_plate ON fleet.vehicles(plate);
CREATE INDEX idx_maintenance_vehicle_id ON fleet.maintenance(vehicle_id);
CREATE INDEX idx_maintenance_status ON fleet.maintenance(status);
CREATE INDEX idx_maintenance_type ON fleet.maintenance(maintenance_type);
CREATE INDEX idx_service_types_active ON fleet.service_types(active);
CREATE INDEX idx_maintenance_rules_active ON fleet.maintenance_rules(active);

-- Insert standard service types
INSERT INTO fleet.service_types (id, name, description, category, is_standard, vehicle_types) VALUES
('oil_change', 'Oil Change', 'Regular engine oil and filter replacement', 'routine', true, ARRAY['car', 'truck', 'van']),
('tire_rotation', 'Tire Rotation', 'Rotating tires to ensure even wear and extend tire life', 'routine', true, ARRAY['car', 'truck', 'van']),
('brake_service', 'Brake Service', 'Inspection and maintenance of brake system components', 'routine', true, ARRAY['car', 'truck', 'van', 'motorcycle']),
('engine_tuning', 'Engine Tuning', 'Adjusting engine components for optimal performance', 'major', true, ARRAY['car', 'truck', 'van', 'motorcycle']),
('battery_replacement', 'Battery Replacement', 'Replacing the vehicle battery', 'routine', true, ARRAY['car', 'truck', 'van', 'motorcycle']),
('air_filter', 'Air Filter Replacement', 'Replacing the engine air filter', 'routine', true, ARRAY['car', 'truck', 'van', 'motorcycle']),
('general_inspection', 'General Inspection', 'Complete vehicle inspection including all major systems', 'routine', true, ARRAY['car', 'truck', 'van', 'motorcycle']);

-- Insert standard maintenance rules
INSERT INTO fleet.maintenance_rules (id, service_type_id, vehicle_type, mileage_interval, time_interval_days, priority) VALUES
('rule_oil_car', 'oil_change', 'car', 5000, 180, 'high'),
('rule_oil_truck', 'oil_change', 'truck', 7500, 180, 'high'),
('rule_oil_van', 'oil_change', 'van', 7500, 180, 'high'),
('rule_tire_car', 'tire_rotation', 'car', 7500, 180, 'normal'),
('rule_tire_truck', 'tire_rotation', 'truck', 10000, 180, 'normal'),
('rule_tire_van', 'tire_rotation', 'van', 10000, 180, 'normal'),
('rule_brake_all', 'brake_service', 'car', 15000, 365, 'high'),
('rule_engine_all', 'engine_tuning', 'car', 30000, 730, 'normal'),
('rule_battery_all', 'battery_replacement', 'car', NULL, 730, 'normal'),
('rule_air_filter_all', 'air_filter', 'car', 15000, 365, 'normal'),
('rule_inspection_all', 'general_inspection', 'car', 10000, 180, 'normal');

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA fleet TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA fleet TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA fleet TO postgres; 