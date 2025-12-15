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
     * Soft Delete: Marcar como eliminado en lugar de borrar físicamente
     */
    override async delete(id: number): Promise<void> {
        const { error } = await this.client
            .from(this.table)
            .update({ deleted_at: new Date() })
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Crear producto con validación
     */
    override async create(item: Partial<Product>): Promise<Product> {
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
    override async update(id: number, item: Partial<Product>): Promise<Product> {
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
            .is('deleted_at', null)
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
        // Query base con join

        let selectQuery = '*, product_categories(category:categories(id, name))';
        if (filters?.category_id) {
            selectQuery = '*, product_categories!inner(category:categories(id, name))';
        }

        let query = this.client
            .from(this.table)
            .select(selectQuery, { count: 'exact' })
            .is('deleted_at', null);

        if (filters) {
            if (filters.search) {
                // Buscar en nombre O código
                query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.category_id) {
                query = query.eq('product_categories.category_id', filters.category_id);
            }
        }

        // Sort
        if (sort && sort.column) {
            query = query.order(sort.column, { ascending: sort.direction === 'asc' });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // Paginación
        if (pageSize > 0) {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        // Aplanar la estructura: product_categories: [{ category: { id, name } }] -> categories: [{ id, name }]
        const products = (data || []).map((p: any) => ({
            ...p,
            categories: p.product_categories?.map((pc: any) => pc.category) || [] // Ahora categories es un array de objetos
        })) as Product[];

        return { data: products, count: count || 0 };
    }

    /**
     * Obtener el precio efectivo del producto en una fecha dada
     * Verifica tarifas primero, recurre al precio base si no hay tarifas aplicables.
     */
    async getPriceAtDate(id: number, date: string): Promise<number> {
        // 1. Obtener Producto con Tarifas
        const { data: product, error } = await this.client
            .from(this.table)
            .select('price, tariffs')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error || !product) throw error || new Error('Producto no encontrado');

        // 2. Verificar Tarifas
        const tariffs = (product.tariffs as any[]) || [];
        const targetDate = new Date(date);

        // Ordenar tarifas por start_date desc para encontrar la más reciente aplicable
        // Filtrar tarifas válidas para la fecha
        const applicableTariff = tariffs
            .filter((t: any) => {
                const start = new Date(t.start_date);
                const end = t.end_date ? new Date(t.end_date) : null;
                return start <= targetDate && (!end || end >= targetDate);
            })
            .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];

        if (applicableTariff) {
            return Number(applicableTariff.price);
        }

        return Number(product.price);
    }
}
