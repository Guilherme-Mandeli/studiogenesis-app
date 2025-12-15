# Documentación Técnica del Proyecto: StudioGenesis

## 1. Visión General del Sistema

La filosofía central del desarrollo ha sido **KISS (Keep It Simple, Stupid)** y **Modularidad**. No se ha buscado sobre-ingeniería, sino una arquitectura sólida, escalable y fácil de mantener.

### Tecnologías Clave (Stack)

*   **Frontend Framework:** `Nuxt 3` (Vue.js).
*   **Base de Datos y Auth:** `Supabase`.
*   **UI System:** `Nuxt UI` + `Tailwind CSS`.

---

## 2. Arquitectura de Software

He evitado mezclar la lógica de negocio con la interfaz de usuario (el clásico "Spaghetti Code"). En su lugar, he implementado una arquitectura por capas simplificada:

### A. Capa de Servicios (`/services`)
Es el "cerebro" de las operaciones de datos. Los componentes de Vue (las pantallas) nunca hablan directamente con la base de datos; hablan con un "Servicio".

*   **¿Por qué?** Si mañana cambiamos Supabase por otra API, solo tocamos los servicios, no las 50 pantallas de la app.

| Visita esto para leer el archivo |
| :--- |
| [`services/BaseService.ts`](services/BaseService.ts) |
| [`services/ProductService.ts`](services/ProductService.ts) |
| [`services/TaxonomyService.ts`](services/TaxonomyService.ts) |
| [`services/AppointmentService.ts`](services/AppointmentService.ts) |

### B. Capa de Validación (`/validators`)
Si cambia una regla, se cambia en un solo sitio. Antes de enviar nada a la base de datos, pasa por un validador.

*   **Ejemplo:** "Un producto debe tener precio" o "Una cita no puede tener unidades negativas". 

| Visita esto para leer el archivo |
| :--- |
| [`validators/ProductValidator.ts`](validators/ProductValidator.ts) |
| [`validators/CategoryValidator.ts`](validators/CategoryValidator.ts) |
| [`validators/AppointmentValidator.ts`](validators/AppointmentValidator.ts) | 

### C. Capa de Presentación (`/pages` y `/components`)
Encargada únicamente de mostrar datos y capturar interacciones del usuario. Delega la lógica "pesada" a los servicios.

| Visita esto para leer el archivo |
| :--- |
| [`pages/products/index.vue`](pages/products/index.vue) |
| [`components/admin/ProductForm.vue`](components/admin/ProductForm.vue) |

---

## 3. Módulos Principales
El sistema se divide en cuatro grandes bloques funcionales:

### 3.1. Autenticación y Seguridad
*   **Funcionamiento:** Sistema de Login clásico (Email/Password).
*   **Seguridad:** Uso de `Middleware` global. Si un usuario no está logueado, el sistema lo expulsa automáticamente a la pantalla de login. Protege todas las rutas administrativas.

| Visita esto para leer el archivo |
| :--- |
| [`services/auth.service.ts`](services/auth.service.ts) |
| [`middleware/auth.global.ts`](middleware/auth.global.ts) |
| [`pages/login.vue`](pages/login.vue) |

### 3.2. Gestión de Productos
El corazón del inventario. No es un simple listado; es una entidad completa.
*   **Taxonomías:** Sistema jerárquico de Categorías (Padre > Hijo) para organizar productos.
*   **Tarifas Dinámicas:** Un producto no tiene un solo precio fijo. Tiene un historial de tarifas basado en fechas (tarifas activas, caducadas, futuras). El sistema sabe automáticamente qué precio aplicar hoy.

| Visita esto para leer el archivo |
| :--- |
| [`services/ProductService.ts`](services/ProductService.ts) |
| [`pages/products/index.vue`](pages/products/index.vue) |
| [`components/admin/ProductForm.vue`](components/admin/ProductForm.vue) |

### 3.3. Citas y Pedidos
Módulo dependiente de Productos.

*   **Flujo:** Permite crear una cita vinculada a un producto.
*   **Inteligencia:** Al seleccionar una fecha, el sistema consulta el módulo de Productos para saber qué tarifa estaba vigente ese día y calcular el coste automáticamente. Bloquea el precio (`locked_price`) para que cambios futuros en la tarifa no afecten a pedidos pasados.

| Visita esto para leer el archivo |
| :--- |
| [`services/AppointmentService.ts`](services/AppointmentService.ts) |
| [`pages/appointments.vue`](pages/appointments.vue) |
| [`components/appointments/AppointmentForm.vue`](components/appointments/AppointmentForm.vue) |

### 3.4. Interfaz Administrativa
*   **Diseño:** Inspirado en paneles CMS clásicos. Barra lateral fija, navegación clara y tablas de datos con filtros, ordenación y paginación.

| Visita esto para leer el archivo |
| :--- |
| [`layouts/admin.vue`](layouts/admin.vue) |

---

## 4. Implementaciones

1.  **Exportación en Cliente:**
    Como no es necesário guardar los archivos generados de Excel y PDF en el servidor, la exportación se realiza en el navegador del usuario (`ExportService`).

| Visita esto para leer el archivo |
| :--- |
| [`services/ExportService.ts`](services/ExportService.ts) |

2.  **Componentización:**
    Elementos repetitivos como "Cabeceras de Tabla Ordenables" (`SortableHeader`) o "Filtros de Busqueda" (`DataFilter`) son componentes reutilizables.

| Visita esto para leer el archivo |
| :--- |
| [`components/common/SortableHeader.vue`](components/common/SortableHeader.vue) |
| [`components/common/DataFilter.vue`](components/common/DataFilter.vue) |

