# StudioGenesis - App de Gestión

Este repositorio contiene el código fuente de un test para **Studio Genesis**, una aplicación de gestión administrativa (Backoffice).

---

## Instalación y Ejecución Local

Sigue estos pasos para poner en marcha el proyecto en tu entorno local.

### Prerrequisitos
*   **Node.js**: v18 o superior.
*   **NPM**: (Incluido con Node.js) o Yarn/Pnpm.
*   **Git**: Para clonar el repositorio.

### Pasos

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/Guilherme-Mandeli/studiogenesis-app.git
    cd studiogenesis-test
    ```

2.  **Acceder al directorio de la aplicación:**
    El código de la aplicación se encuentra en la carpeta `genesis-app`.
    ```bash
    cd genesis-app
    ```

3.  **Instalar dependencias:**
    ```bash
    npm install
    ```

4.  **Configurar Variables de Entorno:**
    Renombra el archivo `.env.example` a `.env` (si existe) o crea uno nuevo en la raíz de `genesis-app`. Necesitarás las credenciales de tu proyecto Supabase:

    ```env
    SUPABASE_URL="https://tu-proyecto.supabase.co"
    SUPABASE_KEY="tu-anon-key"
    ```

5.  **Ejecutar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:3000`.

---

## 🗄️ Configuración de Base de Datos (Supabase)

Para inicializar la base de datos con el esquema y datos de prueba, siga estos pasos en el Editor SQL de su proyecto Supabase:

1.  **Crear el Esquema:**
    Copie y ejecute el contenido del archivo:
    `genesis-app/supabase/create-supabase.db`
    *Esto creará las tablas (productos, categorías, citas), funciones y políticas de seguridad.*

2.  **Cargar Datos de Prueba (Seed):**
    Una vez creado el esquema, copie y ejecute el contenido del archivo:
    `genesis-app/supabase/update/seed_data.sql`
    *Esto insertará un set de datos inicial con:*
    *   *Categorías de mercado (Alimentos, Lácteos, Carnes).*
    *   *12 Productos genericos (Leche, Huevos, Pollo, etc.) con histórico de tarifas.*
    *   *Citas/Pedidos de ejemplo para Diciembre 2025 y Enero 2026.*

---

## Sobre el Proyecto

StudioGenesis ha sido desarrollado siguiendo la filosofía **KISS (Keep It Simple, Stupid)** y principios de **Modularidad**.

### Stack Tecnológico

*   **Frontend**: [Nuxt 3](https://nuxt.com/) (Vue.js) - Framework Híbrido.
*   **Backend / DB**: [Supabase](https://supabase.com/) - PostgreSQL + Auth instantáneo.
*   **UI Framework**: [Nuxt UI](https://ui.nuxt.com/) + Tailwind CSS.
*   **Lenguaje**: TypeScript Estricto.

### Arquitectura del Código

El proyecto evita el "Spaghetti Code" mediante una clara separación de responsabilidades en capas, implementada dentro de la estructura de Nuxt:

1.  **Capa de Servicios (`/services`)**:
    *   Toda la lógica de comunicación con Supabase reside aquí.
    *   Extienden de una clase abstracta `BaseService` para estandarizar operaciones CRUD.
    *   Ejemplos: `ProductService`, `TaxonomyService`, `AppointmentService`.

2.  **Capa de Validación (`/validators`)**:
    *   Clases estáticas dedicadas a validar la integridad de los datos antes de enviarlos al servidor.
    *   Centralizan reglas de negocio (ej: validación de tarifas, campos obligatorios).

3.  **Capa de Vista (`/pages` y `/components`)**:
    *   **Pages**: Estructura de rutas y vistas principales.
    *   **Components**: Elementos de UI reutilizables (ej: `SortableHeader`, `DataFilter`).

### Módulos Principales Implementados

#### 1. Gestión de Productos
*   **Inventario Completo**: Creación y edición con campos personalizados.
*   **Taxonomías**: Organización jerárquica mediante Categorías (Padre/Hijo).
*   **Tarifas Dinámicas**: Sistema avanzado donde un producto tiene múltiples tarifas con rangos de fechas de validez. Se implementan como un campo JSONB (`tariffs`) dentro de la entidad Producto.
*   **Galería**: Gestión de imágenes múltiples.

#### 2. Citas y Pedidos
*   **Vinculación**: Las citas se asocian directamente a productos.
*   **Cálculo de Precios**: Al crear una cita, el sistema determina automáticamente la tarifa vigente del producto para la fecha seleccionada y "bloquea" ese precio (`locked_price`), asegurando la integridad histórica de los pedidos.

#### 3. Panel de Administración
*   **Autenticación**: Acceso restringido (Middleware global) para usuarios administradores.
*   **Diseño**: Interfaz tipo Dashboard con barra lateral fija (`layouts/admin.vue`).
*   **Herramientas**: Filtrado avanzado, ordenación de columnas y descarga de listados en Excel/PDF (generación en cliente).

---

> **Nota:** La documentación técnica detallada para gestores se encuentra en el archivo [`Documentacion.md`](Documentacion.md) en la raíz de este proyecto.
