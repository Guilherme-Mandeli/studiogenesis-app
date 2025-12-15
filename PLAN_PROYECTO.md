# Plan de Desarrollo Modular: App de Gestión (Nuxt + Supabase)

El objetivo de este archivo es describir la hoja de ruta para la construcción del test.

Sirve tanto para mi guia personal que suelo hacer en todos mis proyectos como para los examinadores que quieran evaluar el procedimiento.

## Principios y Filosofía del Código

1.  **KISS (Keep It Simple, Stupid):** No implementaremos (para este proyecto) nada que no sea estrictamente necesario para el funcionamiento básico.
2.  **SOLID & Clean Code:** El código debe ser modular. Las clases y funciones deben tener una única responsabilidad.
3.  **Idioma:**
    * **Código (Variables, Funciones, Clases):** Inglés.
    * **Comentarios y Documentación:** Español de España.
4.  **Documentación:** Cada archivo de código comenzará con un bloque de comentario explicando **qué es este archivo** y **que encontraremos en él**.

---

## Fase 1: Infraestructura Local y Git
**Objetivo:** Establecer los cimientos del proyecto en local.

1.  **Inicialización del Entorno**
    * Creación de la estructura de directorios raíz.
    * Instalación del framework: **Nuxt 3**.
    * Limpieza de archivos por defecto ("Hello World").
2.  **Control de Versiones**
    * Configurar Git y repositorio.
3.  **Estructura de Carpetas Modular**
    * Usaré la arquitectura DDD (Domain Driven Design). Simplificando:
        * `/services`: Lógica de negocio y llamadas a API.
        * `/types`: Interfaces TypeScript.
        * `/components`: Elementos de UI reutilizables.
        * `/pages`: Vistas de la aplicación.

---

## Fase 2: Modelado de Datos (Supabase)
**Objetivo:** Definir el esquema de la base de datos conceptualizando "Entidades" y "Taxonomías".

*Nota: Aunque la implementación técnica usará Supabase (PostgreSQL), el diseño debe estar claro antes de crear las tablas.*

### 2.1 Definiciones y Roles
* **Roles:** Solo existe el perfil **ADMIN**. No se gestionan permisos granulares ni múltiples roles.
* **Registro:** No existe registro público (Sign Up). Los usuarios se dan de alta manualmente en la base de datos.
* **Acceso:** Login por Email + Password.

### 2.2 Esquema de Entidades y Nomenclaturas

#### Tipo de Entidad (_Entity Type_)
Es el tipo de contenido. Define qué es el contenido y qué estructura base tendrá.

> Ejemplos: productos, páginas, eventos, cursos.

Campos predeterminados: `id`, `type`, `created_at`, `updated_at`, `deleted_at`, `name`, `description`, `status`, `image_url`, `slug`.

#### Taxonomía (_Taxonomy_) 

Es la forma de organizar y agrupar los conteúdos de un tipo de entidad. Permite clasificar y filtrar itens relacionados.

> Ejemplos: categorías, tags, gênero.

Campos predeterminados: `id`, `entity_type_id`,`name`, `description`, `slug`, `parent_id`, `children_ids`.

#### Campo Personalizado (_Custom Field_)

Es un campo para adicionar información adicional a la entidad que no existe en la estructura predeterminada.

> Ejemplos: precio, fecha, dirección, referencias a otras entidades.

#### Relación para nuestro proyecto

| Entidades             | Taxonomías                | Campos Personalizados |
|-----------------------|---------------------------|-----------------------|
| `products` (Producto) | `categories` (Categorías) | `price` (Precio), `tariffs` (Loop de Tarifas*), `gallery` (Galería de Imágenes), `code` (Código) |
| `appointments` (Cita) |                           |  `date` (Fecha), `quantity` (Unidades), `locked_price` (Coste calculado), `product_id` (Ref. a Producto) |

**\*Loop de Tarifas:**
* `tariff_start_date` (Fecha de inicio de validez)
* `tariff_end_date` (Fecha de fin de validez)
* `tariff_price` (Precio)
* `tariff_status` (Tarifa Activa/Inactiva/Caducada),

### 2.3 Esquema de Tablas
A continuación, la traducción técnica de las definiciones anteriores a tablas de Supabase (PostgreSQL).

#### A. Tabla: `categories` (Taxonomía)
*Jerarquía para agrupar productos.*

| Columna | Tipo (SQL) | Concepto | Notas Técnicas |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | ID | Primary Key. |
| `created_at` | `timestamptz` | Auditoría | Default: `now()`. |
| `updated_at` | `timestamptz` | Auditoría | |
| `entity_type` | `text` | Clasificación | Fijo: `'product'`. |
| `name` | `text` | Taxonomía | Nombre de la categoría. |
| `slug` | `text` | Taxonomía | Único. |
| `description` | `text` | Taxonomía | |
| `parent_id` | `bigint` | Jerarquía | Foreign Key a `categories.id`. Nullable. |

#### B. Tabla: `products` (Entidad)
*Inventario principal.*

| Columna | Tipo (SQL) | Concepto | Notas Técnicas |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | ID | Primary Key. |
| `created_at` | `timestamptz` | Auditoría | Default: `now()`. |
| `updated_at` | `timestamptz` | Auditoría | |
| `deleted_at` | `timestamptz` | Estado | Soft Delete. |
| `type` | `text` | Entity Type | Fijo: `'product'`. |
| `status` | `text` | Entity Type | `active` / `draft`. |
| `name` | `text` | Entity Type | |
| `description` | `text` | Entity Type | |
| `slug` | `text` | Entity Type | |
| `image_url` | `text` | Entity Type | Imagen destacada. |
| `code` | `text` | **Custom Field** | Código único (SKU). |
| `price` | `decimal` | **Custom Field** | Precio base actual. |
| `gallery` | `jsonb` | **Custom Field** | Array de URLs `['img1.jpg', 'img2.jpg']`. |
| **`tariffs`** | **`jsonb`** | **Custom Field** | Estructura compleja (Ver detalle abajo). |

#### C. Tabla: `product_categories` (Relación)
*Tabla pivote para asignar categorías a productos.*

| Columna | Tipo (SQL) | Notas |
| :--- | :--- | :--- |
| `product_id` | `bigint` | FK a `products`. |
| `category_id` | `bigint` | FK a `categories`. |

#### D. Tabla: `appointments` (Entidad)
*Citas o Pedidos.*

| Columna | Tipo (SQL) | Concepto | Notas Técnicas |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | ID | Primary Key. |
| `created_at` | `timestamptz` | Auditoría | |
| `type` | `text` | Entity Type | Fijo: `'appointment'`. |
| `name` | `text` | Entity Type | Auto-generado (ej: "Pedido #001"). |
| `status` | `text` | Entity Type | `pending` / `confirmed`. |
| `date` | `timestamptz` | **Custom Field** | Fecha y hora de la cita. |
| `quantity` | `int` | **Custom Field** | Unidades. |
| `locked_price` | `decimal` | **Custom Field** | Coste calculado al guardar. |
| `product_id` | `bigint` | **Relación** | FK a `products`. |

#### Detalle de Implementación: "Tariffs" como Custom Field

Para tratar las tarifas como un campo de la entidad y no como una tabla externa, utilizaremos el tipo de dato **JSONB**.

**Estructura del JSON almacenado en `products.tariffs`:**

```json
[
  {
    "start_date": "2023-01-01",
    "end_date": "2023-06-01",
    "price": 6.90,
    "status": "expired"
  },
  {
    "start_date": "2023-06-02",
    "end_date": "2023-08-01",
    "price": 4.90,
    "status": "active"
  }
]
```
---

## Fase 3: Arquitectura Modular (Frontend)
**Objetivo:** Construir el núcleo de la aplicación mediante clases y servicios tipados.

1.  **Servicios Base (Service Layer)**
    * `BaseService<T>`: Clase abstracta con métodos genéricos para reducir código repetitivo (`getAll`, `getById`, `save`, `delete`).
    * `SupabaseClient`: Singleton para manejar la conexión (cuando se integre).
2.  **Módulos de Servicio**
    * `AuthService`: Maneja `signIn` y `signOut`.
    * `TaxonomyService`: Extiende de `BaseService`. Añade lógica para ordenar el árbol jerárquico.
    * `ProductService`: Extiende de `BaseService`. Gestiona productos y la lógica de tarifas.
    * `AppointmentService`: Extiende de `BaseService`. Calcula costes basados en fecha.

---

## Fase 4: Desarrollo de Funcionalidades (Iterativo)

### Módulo 1: Autenticación
* Vista de Login minimalista.
* Protección de rutas (Middleware) para asegurar que solo el admin accede al Backoffice.

### Módulo 2: Gestión de Taxonomías
* CRUD completo para `taxonomies`.
* Vista especial para visualizar la jerarquía (Padre > Hijo).

### Módulo 3: Gestión de Productos (Entidad Principal)
* Formulario de alta/edición.
* Componente de selección múltiple para Taxonomías.
* Componente de gestión de fechas para Tarifas.
* **Exportación:**
    * Lógica para generar XLS del listado.
    * Lógica para maquetar y descargar PDF de la ficha.

---

## Fase 5: Calendario y Citas
**Objetivo:** Integrar la segunda Entidad (Citas) y la lógica temporal.

1.  **Vista Calendario**
    * Implementación de interfaz visual mensual.
2.  **Lógica de Costes**
    * Al crear una cita, el sistema consulta `ProductService` -> `tariffs` para obtener la tarifa válida en la fecha seleccionada.
3.  **Persistencia**
    * Guardado de la cita con el precio bloqueado (`locked_price`).
