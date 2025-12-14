/**
 * ProductService
 *
 * Servicio encargado de gestionar los Productos.
 * Extiende la funcionalidad base de CRUD y añade validaciones específicas.
 */

import { BaseService } from './BaseService';
import type { Product } from '../types';
import { ProductValidator } from '../validators/ProductValidator';

export class ProductService extends BaseService<Product> {
    protected table = 'products';

    /**
     * Crear producto con validación
     */
    async create(item: Partial<Product>): Promise<Product> {
        // Asegurar tipo producto
        item.type = 'product';

        const errors = ProductValidator.validate(item);
        if (errors.length > 0) {
            throw new Error(errors.map(e => e.message).join('\n'));
        }

        // Manejo de categories si vienen (pivot table)
        // Por simplicidad en este paso, asumimos que 'categories' se gestiona aparte 
        // o que Supabase lo ignora si no está en la tabla. 
        // Limpiamos propiedad virtual para evitar error de SQL si la tabla no tiene esa columna JSONB (que no la tiene, es pivot).
        const { categories, ...productData } = item;

        const createdProduct = await super.create(productData);

        if (categories && Array.isArray(categories) && categories.length > 0) {
            await this.assignCategories(createdProduct.id, categories as number[]);
        }

        return createdProduct;
    }

    /**
     * Actualizar producto con validación
     */
    async update(id: number, item: Partial<Product>): Promise<Product> {
        const errors = ProductValidator.validate(item);
        if (errors.length > 0) {
            throw new Error(errors.map(e => e.message).join('\n'));
        }

        const { categories, ...productData } = item;

        const updatedProduct = await super.update(id, productData);

        if (categories && Array.isArray(categories)) {
            await this.updateCategories(id, categories as number[]);
        }

        return updatedProduct;
    }

    /**
     * Asignar categorías (Insert en tabla pivote)
     */
    private async assignCategories(productId: number, categoryIds: number[]) {
        if (!categoryIds.length) return;

        const rows = categoryIds.map(catId => ({
            product_id: productId,
            category_id: catId
        }));

        const { error } = await this.client
            .from('product_categories')
            .insert(rows);

        if (error) throw error;
    }

    /**
     * Actualizar categorías (Borrar y re-asignar para asegurar consistencia)
     */
    private async updateCategories(productId: number, categoryIds: number[]) {
        // 1. Borrar existentes
        const { error: deleteError } = await this.client
            .from('product_categories')
            .delete()
            .eq('product_id', productId);

        if (deleteError) throw deleteError;

        // 2. Insertar nuevas
        await this.assignCategories(productId, categoryIds);
    }

    /**
     * Obtener producto con categorías
     * Sobrescribimos getById para traer relaciones si es posible, 
     * pero Supabase básico requiere joins explícitos.
     */
    /**
     * Obtener producto con categorías
     * Sobrescribimos getById para traer relaciones si es posible, 
     * pero Supabase básico requiere joins explícitos.
     */
    async getByIdWithCategories(id: number): Promise<Product | null> {
        const { data, error } = await this.client
            .from(this.table)
            .select('*, product_categories(category_id)') // Join select
            .eq('id', id)
            .single();

        if (error) throw error;

        if (data) {
            // Mapear respuesta para ajustar a la interfaz si es necesario
            // data.product_categories será un array de objetos { category_id: X }
            const categoryIds = (data.product_categories as any[])?.map((pc: any) => pc.category_id) || [];
            return { ...data, categories: categoryIds } as Product;
        }
        return null;
    }

    /**
     * Obtener todos los productos con sus categorías (nombres)
     * Soporta filtrado por: search (nombre/sku), status, category_id
     */
    async getAllWithCategories(
        filters?: { search?: string; status?: string; category_id?: number },
        page: number = 1,
        pageSize: number = 10,
        sort: { column: string, direction: 'asc' | 'desc' } = { column: 'created_at', direction: 'desc' }
    ): Promise<{ data: Product[], count: number }> {
        // Query base with join

        let selectQuery = '*, product_categories(category:categories(id, name))';
        if (filters?.category_id) {
            selectQuery = '*, product_categories!inner(category:categories(id, name))';
        }

        let query = this.client
            .from(this.table)
            .select(selectQuery, { count: 'exact' });

        // Apply filters
        if (filters) {
            if (filters.search) {
                // Search in name OR code
                query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.category_id) {
                query = query.eq('product_categories.category_id', filters.category_id);
            }
        }

        // Apply Sort
        if (sort && sort.column) {
            query = query.order(sort.column, { ascending: sort.direction === 'asc' });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        // Flatten the structure: product_categories: [{ category: { id, name } }] -> categories: [{ id, name }]
        const products = (data || []).map((p: any) => ({
            ...p,
            categories: p.product_categories?.map((pc: any) => pc.category) || [] // Now categories is array of objects
        })) as Product[];

        return { data: products, count: count || 0 };
    }
}
