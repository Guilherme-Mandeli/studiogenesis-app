/**
 * Tipos Globales (Types)
 *
 * Definiciones de interfaces TypeScript principales para el modelado de datos.
 * Define la estructura de las Entidades y Taxonomías descritas en el PLAN_PROYECTO.
 */

export interface BaseEntity {
    id: number;
    created_at: string;
    updated_at?: string;
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
}
