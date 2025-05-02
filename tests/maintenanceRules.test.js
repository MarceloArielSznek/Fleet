const weeklyUpdateController = require('../controllers/weeklyUpdateController');
const checkVehicleForServices = weeklyUpdateController.checkVehicleForServices;

// Datos de prueba
const testServiceTypes = [
  { id: 'oil_change', name: 'Oil Change' },
  { id: 'tire_rotation', name: 'Tire Rotation' },
  { id: 'spark_plugs', name: 'Spark Plugs Replacement' }
];

const testRules = [
  {
    id: '1',
    name: 'Oil Change Rule',
    serviceType: 'oil_change',
    conditionType: 'mileage',
    conditionValue: 5000,
    priority: 'high',
    vehicleIds: ['1', '2', '3', '4'], // Solo para vehículos de prueba 1-4
    isActive: true
  },
  {
    id: '2',
    name: 'Tire Rotation Rule',
    serviceType: 'tire_rotation',
    conditionType: 'mileage',
    conditionValue: 10000,
    priority: 'medium',
    vehicleIds: ['1', '2', '3', '4'], // Solo para vehículos de prueba 1-4
    isActive: true
  },
  {
    id: '3',
    name: 'Spark Plugs Rule',
    serviceType: 'spark_plugs',
    conditionType: 'mileage',
    conditionValue: 70000,
    priority: 'medium',
    vehicleIds: ['1745245136032'], // Solo para Black
    isActive: true
  }
];

// Casos de prueba
const testCases = [
  {
    name: 'Vehicle with no maintenance history',
    vehicle: {
      id: '1',
      mileage: '10000',
      status: 'active'
    },
    maintenances: [],
    expectedServices: 2 // Debería necesitar ambos servicios
  },
  {
    name: 'Vehicle with recent oil change',
    vehicle: {
      id: '2',
      mileage: '10000',
      status: 'active'
    },
    maintenances: [
      {
        maintenanceType: 'oil_change',
        status: 'completed',
        mileage: '8000'
      }
    ],
    expectedServices: 1 // Solo debería necesitar tire rotation
  },
  {
    name: 'Vehicle with all services up to date',
    vehicle: {
      id: '3',
      mileage: '10000',
      status: 'active'
    },
    maintenances: [
      {
        maintenanceType: 'oil_change',
        status: 'completed',
        mileage: '9000'
      },
      {
        maintenanceType: 'tire_rotation',
        status: 'completed',
        mileage: '9000'
      }
    ],
    expectedServices: 0 // No debería necesitar servicios
  },
  {
    name: 'Vehicle with lower mileage than last maintenance',
    vehicle: {
      id: '4',
      mileage: '8000',
      status: 'active'
    },
    maintenances: [
      {
        maintenanceType: 'oil_change',
        status: 'completed',
        mileage: '9000'
      }
    ],
    expectedServices: 0 // No debería necesitar servicios
  },
  {
    name: 'High mileage vehicle with spark plugs service',
    vehicle: {
      id: '1745245136032', // Black
      mileage: '200000',
      status: 'active'
    },
    maintenances: [],
    expectedServices: 1 // Debería necesitar spark plugs
  }
];

// Mock de la clase Maintenance
class MockMaintenance {
  static findByVehicleId(vehicleId) {
    const testCase = testCases.find(tc => tc.vehicle.id === vehicleId);
    return testCase ? testCase.maintenances : [];
  }
}

// Ejecutar pruebas
console.log('=== Iniciando pruebas de reglas de mantenimiento ===\n');

testCases.forEach(testCase => {
  console.log(`\nPrueba: ${testCase.name}`);
  console.log('----------------------------------------');
  
  // Mock Maintenance.findByVehicleId
  const originalMaintenance = require('../models/maintenance');
  require('../models/maintenance').findByVehicleId = MockMaintenance.findByVehicleId;
  
  const services = checkVehicleForServices(testCase.vehicle, testRules, testServiceTypes);
  
  console.log(`Vehículo ID: ${testCase.vehicle.id}`);
  console.log(`Kilometraje actual: ${testCase.vehicle.mileage}`);
  console.log(`Mantenimientos previos: ${JSON.stringify(testCase.maintenances, null, 2)}`);
  console.log(`Servicios necesarios: ${services.length}`);
  console.log('Detalles de servicios:');
  services.forEach(service => {
    console.log(`- ${service.serviceName}: ${service.status} (Próximo a: ${service.nextServiceDueMileage})`);
  });
  
  // Verificar resultados
  if (services.length === testCase.expectedServices) {
    console.log('\n✅ Prueba pasada');
  } else {
    console.log('\n❌ Prueba fallida');
    console.log(`Se esperaban ${testCase.expectedServices} servicios, pero se encontraron ${services.length}`);
  }
  
  // Restaurar Maintenance original
  require('../models/maintenance').findByVehicleId = originalMaintenance.findByVehicleId;
}); 