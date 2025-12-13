/**
 * BaseService
 *
 * Clase abstracta que implementa la lógica genérica de acceso a datos (CRUD).
 * El objetivo es evitar código repetitivo en cada servicio específico.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export abstract class BaseService<T> {
    protected client: SupabaseClient;
    protected abstract table: string;

    constructor(client: SupabaseClient) {
        this.client = client;
    }

    /**
     * Obtener todos los registros
     */
    async getAll(): Promise<T[]> {
        const { data, error } = await this.client
            .from(this.table)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as T[];
    }

    /**
     * Obtener un registro por ID
     */
    async getById(id: number): Promise<T | null> {
        const { data, error } = await this.client
            .from(this.table)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as T;
    }

    /**
     * Crear un nuevo registro
     */
    async create(item: Partial<T>): Promise<T> {
        const { data, error } = await this.client
            .from(this.table)
            .insert(item)
            .select()
            .single();

        if (error) throw error;
        return data as T;
    }

    /**
     * Actualizar un registro existente
     */
    async update(id: number, item: Partial<T>): Promise<T> {
        const { data, error } = await this.client
            .from(this.table)
            .update(item)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as T;
    }

    /**
     * Eliminar un registro
     */
    async delete(id: number): Promise<void> {
        const { error } = await this.client
            .from(this.table)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
