/**
 * Tipos Globales (Types)
 *
 * Definiciones de interfaces TypeScript principales para el modelado de datos.
 * Define la estructura de las Entidades y Taxonomías descritas en el PLAN_PROYECTO.
 */

export interface FilterDefinition {
    key: string;
    label: string;
    type: 'text' | 'select' | 'date';
    placeholder?: string;
    options?: { label: string; value: any }[]; // For select type
}

export interface BaseEntity {
    id: number;
    created_at: string;
    updated_at?: string;
}

/**
 * Propiedades comunes de 'Entity Type'
 * id, type, created_at, updated_at, deleted_at, name, description, status, image_url, slug
 */
export interface Entity extends BaseEntity {
    type: string; // 'product', 'appointment', etc.
    name: string;
    description?: string;
    status: 'active' | 'draft' | 'pending' | 'confirmed';
    image_url?: string;
    slug: string;
    deleted_at?: string | null;
}

/**
 * Interfaz para la tabla 'categories' (Taxonomía)
 */
export interface Category extends BaseEntity {
    entity_type: 'product';
    name: string;
    slug: string;
    description?: string;
    parent_id?: number | null;

    // Propiedades virtuales (no en BD) para UI
    children?: Category[];
    products_count?: number;
}

/**
 * Tariff Loop Structure
 */
export interface Tariff {
    start_date: string;
    end_date: string;
    price: number;
    status: 'active' | 'expired' | 'inactive';
}

/**
 * Interfaz para 'products' (Extiende Entity)
 * Adds: code, price, gallery, tariffs
 */
export interface Product extends Entity {
    type: 'product';
    code: string;
    price: number;
    gallery?: string[]; // jsonb array of strings
    tariffs?: Tariff[]; // jsonb array of Tariff objects

    // Virtual for Many-to-Many
    categories?: number[] | Category[];
}

/**
 * Appointment / Cita
 */
export interface Appointment extends BaseEntity {
    product_id: number;
    date: string; // YYYY-MM-DD
    units: number;
    total_cost: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';

    // Virtual
    product?: Product;
}
