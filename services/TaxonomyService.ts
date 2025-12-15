/**
 * TaxonomyService
 *
 * Servicio encargado de gestionar las categorías (Entities de tipo 'product').
 * Extiende la funcionalidad base de CRUD y añade lógica específica de jerarquía.
 */

import { BaseService } from './BaseService';
import type { Category } from '../types';
import { CategoryValidator } from '../validators/CategoryValidator';

export class TaxonomyService extends BaseService<Category> {
    protected table = 'categories';

    /**
     * Crear categoría con validación
     */
    async create(item: Partial<Category>): Promise<Category> {
        const errors = CategoryValidator.validate(item);
        if (errors.length > 0) {
            throw new Error(errors.map(e => e.message).join(' '));
        }
        return super.create(item);
    }

    /**
     * Actualizar categoría con validación
     */
    async update(id: number, item: Partial<Category>): Promise<Category> {
        const errors = CategoryValidator.validate(item);
        if (errors.length > 0) {
            throw new Error(errors.map(e => e.message).join(' '));
        }
        return super.update(id, item);
    }

    /**
     * Obtener categorías en estructura de árbol (Padre -> Hijos)
     * NOTA: Por ahora devolvemos lista plana, la jerarquía se puede construir en el frontend se es necesario,
     * o implementar aquí un método recursivo.
     * Seguiremos el principio KISS y devolveremos todo por ahora.
     */
    async getTree(): Promise<Category[]> {
        // En una implementación más compleja aquí armaríamos el árbol.
        // Para este MVP, devolvemos la lista ordenada por nombre.
        const { data, error } = await this.client
            .from(this.table)
            .select('*, product_categories(count)')
            .eq('entity_type', 'product') // Asegurar que solo traemos categorías de productos
            .order('parent_id', { ascending: true, nullsFirst: true })
            .order('name', { ascending: true });

        if (error) throw error;

        // Mapear claves para coincidir con la interfaz si es necesario, aunque PostgREST devuelve { product_categories: [{ count: N }] }
        return data.map((item: any) => ({
            ...item,
            products_count: item.product_categories?.[0]?.count || 0,
            // Limpiar el array pivote del objeto si queremos una salida más limpia
            product_categories: undefined
        })) as Category[];
    }
}
