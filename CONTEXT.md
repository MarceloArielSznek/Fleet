# Fleet Management System - Contexto del Proyecto

## Descripción General del Sistema

Fleet es un sistema de gestión de flotas de vehículos que permite el seguimiento, mantenimiento y administración de vehículos. La aplicación está desarrollada con Node.js y Express, utilizando EJS como motor de plantillas para el frontend, y almacenamiento de datos en archivos JSON.

El sistema está diseñado para ayudar a empresas a gestionar su flota de vehículos, monitorear el mantenimiento, realizar seguimiento de kilometraje, y planificar servicios futuros basados en reglas configurables.

## Principales Funcionalidades Implementadas

### Gestión de Vehículos
- Registro y administración de vehículos (crear, ver, editar, eliminar)
- Detalles completos de cada vehículo (marca, modelo, año, VIN, placa, estado, kilometraje)
- Visualización de vehículos en un carrusel en la página principal
- Filtros para buscar vehículos específicos

### Mantenimiento
- Programación y seguimiento de servicios de mantenimiento
- Diferentes tipos de mantenimiento (rutina, reparación, emergencia)
- Estados de mantenimiento (programado, en progreso, completado, cancelado)
- Visualización de historial de mantenimiento por vehículo
- Subida de documentos relacionados con el mantenimiento

### Weekly Update
- Actualización semanal de kilometraje de múltiples vehículos
- Interfaz unificada para gestionar el kilometraje de la flota
- Detección automática de necesidades de mantenimiento basada en kilometraje

### Administración de Mantenimiento
- Creación y gestión de tipos de servicio personalizados
- Configuración de reglas de mantenimiento basadas en kilometraje o tiempo
- Priorización de mantenimientos (alta, media, baja)
- Aplicación de reglas a vehículos específicos o a toda la flota

### Interfaz de Usuario
- Diseño responsivo adaptado a diferentes dispositivos
- Tarjetas de vehículos con información clara y acciones rápidas
- Tablas de datos con funcionalidades de filtrado
- Panel de administración para configuraciones avanzadas

## Estructura de Carpetas y Archivos Importantes

```
Fleet/
├── app.js                 # Punto de entrada principal de la aplicación
├── controllers/           # Controladores para manejar la lógica de negocio
│   ├── homeController.js  # Controlador para la página principal
│   ├── maintenanceController.js # Controlador para mantenimientos
│   ├── maintenanceAdminController.js # Administración de mantenimientos
│   ├── vehicleController.js # Controlador de vehículos
│   └── weeklyUpdateController.js # Controlador para actualizaciones semanales
├── data/                  # Almacenamiento de datos en JSON
│   ├── maintenance.json   # Registros de mantenimiento
│   ├── maintenance-rules.json # Reglas de mantenimiento
│   ├── serviceTypes.json  # Tipos de servicio
│   └── vehicles.json      # Datos de vehículos
├── models/                # Modelos para manejar los datos
│   ├── maintenance.js     # Modelo de mantenimiento
│   └── vehicle.js         # Modelo de vehículo
├── public/                # Archivos estáticos accesibles públicamente
│   ├── css/               # Hojas de estilo
│   │   └── style.css      # Estilos principales
│   ├── images/            # Imágenes del sistema
│   │   └── vehicles/      # Imágenes de vehículos
│   └── js/                # Scripts JavaScript
│       └── main.js        # Funciones JavaScript principales
├── routes/                # Definición de rutas HTTP
│   ├── homeRoutes.js      # Rutas para la página principal
│   ├── maintenanceRoutes.js # Rutas para mantenimiento
│   ├── maintenanceAdminRoutes.js # Rutas para administración
│   ├── vehicleRoutes.js   # Rutas para vehículos
│   └── weeklyUpdateRoutes.js # Rutas para actualización semanal
└── views/                 # Plantillas EJS para la renderización
    ├── index.ejs          # Página principal
    ├── maintenance/       # Vistas de mantenimiento
    ├── partials/          # Componentes reutilizables
    │   ├── header.ejs     # Cabecera con navegación
    │   └── footer.ejs     # Pie de página
    ├── vehicles/          # Vistas de vehículos
    └── weekly-update/     # Vistas de actualización semanal
```

## Cambios Recientes Realizados

### Rediseño de Tarjetas de Vehículos
- Implementación de un nuevo diseño para las tarjetas de vehículos en el carrusel de la página principal
- Mejora en la presentación de información (estado, placa, marca, modelo)
- Adición de badges de estado (Active, Maintenance, Retired) más prominentes
- Uso de colores para distinguir diferentes estados y acciones

### Funcionalidad de Actualización de Kilometraje
- Integración de actualización de kilometraje directamente desde las tarjetas
- Implementación de validación para evitar valores de kilometraje inválidos
- Visualización inmediata de cambios para mejorar la experiencia del usuario
- Detección automática de necesidades de mantenimiento basadas en kilometraje actualizado

### Weekly Update (Actualización Semanal)
- Nueva sección para actualización semanal de kilometraje de múltiples vehículos
- Interfaz de usuario optimizada para actualizaciones rápidas
- Tarjetas de vehículos con formularios integrados
- Resumen de mantenimientos necesarios basados en las actualizaciones

### Mejoras de UX/UI
- Cambio del logo del sistema
- Mejoras en la navegación mediante barra lateral
- Ajustes de espaciado y layout para mejorar la legibilidad
- Reorganización de elementos para optimizar el flujo de trabajo

### Optimizaciones de Flujo de Trabajo
- Redirección a la página de detalles de mantenimiento después de crear un registro
- Mejora en la estructura de filtros para facilitar su uso en dispositivos móviles
- Ajustes de estilos para mejorar la adaptación a diferentes tamaños de pantalla

## Próximas Mejoras Planeadas

### Módulo de Conductores
- Implementación completa del módulo de gestión de conductores
- Asignación de conductores a vehículos
- Seguimiento de licencias y documentos de conductores
- Dashboard de actividad por conductor

### Sistema de Notificaciones
- Alertas por email para mantenimientos próximos
- Notificaciones en el sistema para recordatorios importantes
- Configuración de preferencias de notificación por usuario

### Mejoras en Reportes
- Generación de reportes en PDF para mantenimientos
- Estadísticas de uso y costos por vehículo
- Gráficos y visualizaciones de datos de la flota
- Exportación de datos en diferentes formatos

### Integración con Servicios Externos
- Conexión con servicios de gasolineras para registrar repostajes
- Integración con talleres para programar servicios
- APIs para obtener información de precios de repuestos

### Optimizaciones Técnicas
- Migración de almacenamiento JSON a una base de datos relacional
- Implementación de autenticación y autorización
- Mejoras de rendimiento para manejo de flotas grandes
- Actualización a un sistema de plantillas más moderno como React

---

*Este documento sirve como referencia para entender el contexto global del proyecto Fleet. Al iniciar una nueva sesión de desarrollo, revisar este documento ayudará a mantener la continuidad y consistencia en el desarrollo.* 