# Fleet Management System - Sistema de Diseño

Este documento define los estándares visuales, componentes y patrones de UI utilizados en el sistema Fleet. Sirve como guía de referencia para mantener la consistencia visual en toda la aplicación.

## Paleta de Colores

### Colores Primarios
- **Celeste (Primary)**: `#3498db` - Color principal de la aplicación, utilizado en cabeceras, botones primarios y elementos de acción.
- **Verde (Success)**: `#2ecc71` - Utilizado para acciones positivas, confirmaciones y estados activos.
- **Rojo (Danger)**: `#e74c3c` - Utilizado para acciones destructivas, alertas y errores.
- **Naranja (Warning)**: `#f39c12` - Utilizado para advertencias, acciones de edición y estados intermedios.

### Colores Secundarios
- **Azul oscuro**: `#2980b9` - Versión más oscura del color primario, usado para estados hover.
- **Verde oscuro**: `#27ae60` - Versión más oscura del verde, usado para estados hover.
- **Naranja oscuro**: `#e67e22` - Versión más oscura del naranja, usado para estados hover.
- **Rojo oscuro**: `#c0392b` - Versión más oscura del rojo, usado para estados hover.

### Colores Neutros
- **Oscuro (Dark)**: `#2c3e50` - Utilizado para textos principales y títulos.
- **Gris oscuro**: `#34495e` - Utilizado para elementos de fondo secundarios, como placas de vehículos.
- **Gris medio**: `#7f8c8d` - Utilizado para textos secundarios y descripciones.
- **Gris claro**: `#95a5a6` - Utilizado para bordes, separadores y elementos deshabilitados.
- **Gris muy claro**: `#f8f9fa` - Utilizado para fondos de secciones y tarjetas.
- **Blanco**: `#ffffff` - Utilizado para fondos de página y texto sobre fondos oscuros.

### Variables CSS
Estas variables están definidas en `style.css` y deben ser utilizadas en lugar de valores hexadecimales directos:

```css
:root {
  --primary-color: #3498db;
  --success-color: #2ecc71;
  --warning-color: #f39c12;
  --danger-color: #e74c3c;
  --dark-color: #2c3e50;
  --light-color: #f8f9fa;
}
```

## Tipografía

### Fuente Principal
- **Familia**: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif
- **Pesos utilizados**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Tamaños de Texto
- **Título principal (h1)**: 2rem (32px)
- **Título de sección (h2)**: 1.8rem (28.8px)
- **Título de tarjeta (h3)**: 1.3rem (20.8px)
- **Subtítulos (h4)**: 1.1rem (17.6px)
- **Texto normal**: 1rem (16px)
- **Texto secundario**: 0.9rem (14.4px)
- **Texto pequeño**: 0.85rem (13.6px)
- **Etiquetas y badges**: 0.75rem (12px)

## Componentes

### Tarjetas
Las tarjetas son el componente principal para presentar información:

```html
<div class="card">
  <div class="card-header">
    <h3>Título de la Tarjeta</h3>
  </div>
  <div class="card-body">
    <!-- Contenido -->
  </div>
</div>
```

#### Estilos de Tarjeta
- Fondo blanco
- Borde redondeado de 10px
- Sombra: `0 5px 15px rgba(0, 0, 0, 0.08)`
- Header con fondo celeste (`var(--primary-color)`) y texto blanco
- Padding interno: 1.5rem

### Botones

#### Tipos de Botones
1. **Botones de Acción Principal**
```html
<button class="action-btn">
  <i class="fas fa-icon"></i> Texto del Botón
</button>
```

2. **Grupos de Botones**
```html
<div class="action-buttons-group">
  <button class="action-group-btn upload-btn">Botón 1</button>
  <button class="action-group-btn cancel-btn">Botón 2</button>
</div>
```

3. **Botones de Icono**
```html
<button class="btn-icon text-primary">
  <i class="fas fa-eye"></i>
</button>
```

#### Estilos de Botón
- Altura consistente (padding vertical: 10-12px)
- Bordes redondeados (8px)
- Icono + texto con gap de 8px
- Transición suave en hover (0.2s)
- Efectos hover: elevación ligera y cambio de color

### Formularios

#### Estructura de Formulario
```html
<div class="form-row">
  <div class="form-group form-col">
    <label for="input-id" class="form-label">Etiqueta</label>
    <input type="text" id="input-id" class="form-control" required>
  </div>
</div>
```

#### Estilos de Formulario
- Inputs con padding de 8-10px
- Bordes redondeados (4-8px)
- Etiquetas con peso 500 (medium)
- Validación visual con estados de error

### Badges y Etiquetas

#### Badge de Estado
```html
<span class="status-badge status-active">Activo</span>
```

#### Estilos de Badge
- Forma pill (border-radius: 30px)
- Padding horizontal mayor que vertical (4px 10px)
- Texto transformado a mayúsculas
- Peso de fuente 600 (semibold)
- Colores según estado (active, maintenance, retired)

### Tablas

#### Estructura de Tabla
```html
<div class="table-responsive">
  <table class="table">
    <thead>
      <tr>
        <th>Encabezado 1</th>
        <th>Encabezado 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Dato 1</td>
        <td>Dato 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

#### Estilos de Tabla
- Bordes sutiles o sin bordes
- Encabezados con fondo ligero (`#f8f9fa`)
- Filas alternas con color muy sutil
- Efecto hover sobre filas
- Esquinas redondeadas en la tabla completa

## Patrones de UI

### Contenedores y Espaciado
- Contenedor principal con clase `.container`
- Margen inferior consistente entre secciones (25px)
- Gap entre elementos relacionados (8-10px)
- Padding interior consistente en componentes (1-1.5rem)

### Estados Vacíos
Patrón para mostrar cuando no hay datos:

```html
<div class="empty-state">
  <div class="empty-state-icon">
    <i class="fas fa-icon"></i>
  </div>
  <h4 class="empty-state-title">No Hay Datos</h4>
  <p class="empty-state-message">Mensaje descriptivo</p>
  <a href="#" class="action-btn">Acción Sugerida</a>
</div>
```

### Navegación y Cabeceras
- Barra de navegación superior con logo y enlaces principales
- Cabecera de página con título y acciones principales
- Migas de pan (breadcrumbs) cuando sea necesario para la navegación

### Manejo de Acciones
- Acciones primarias destacadas con color
- Acciones destructivas siempre con confirmación
- Acciones secundarias menos prominentes
- Agrupación lógica de acciones relacionadas

## Iconografía

### Biblioteca de Iconos
Se utiliza Font Awesome para todos los iconos del sistema.

### Iconos Comunes
- **Crear/Añadir**: `fas fa-plus`
- **Editar**: `fas fa-edit`
- **Eliminar**: `fas fa-trash`
- **Ver**: `fas fa-eye`
- **Vehículo**: `fas fa-car`
- **Mantenimiento**: `fas fa-tools`
- **Documento**: `fas fa-file`
- **Cargar**: `fas fa-upload`
- **Calendario**: `fas fa-calendar-alt`
- **Kilometraje**: `fas fa-road`
- **Guardar**: `fas fa-save`
- **Cancelar**: `fas fa-times`

## Adaptación Responsiva

### Puntos de Quiebre (Breakpoints)
- **Móvil**: < 576px
- **Tablet pequeña**: 576px - 767px
- **Tablet**: 768px - 991px
- **Desktop**: 992px - 1199px
- **Desktop grande**: ≥ 1200px

### Patrones Responsivos
- Cambio de grid a columna única en móviles
- Reducción de padding y márgenes en pantallas pequeñas
- Ajuste de tamaños de fuente en móviles
- Ocultación de elementos secundarios en pantallas muy pequeñas

## Animaciones y Transiciones

### Transiciones
- Duración: 0.2s - 0.3s
- Timing-function: ease o ease-in-out
- Propiedades animadas: transform, opacity, background-color, box-shadow

### Efectos Hover
- Elevación sutil (transform: translateY(-2px))
- Aumento de sombra (box-shadow)
- Cambio suave de color de fondo

---

*Este documento debe ser consultado y actualizado regularmente para mantener la consistencia visual en todo el proyecto Fleet. Cualquier nuevo componente o patrón visual debe ser documentado aquí.* 