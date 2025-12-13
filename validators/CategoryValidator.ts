/**
 * Category Validator
 * 
 * Clase responsable de validar la integridad de los datos de una Categoría.
 * Sigue el principio de Responsabilidad Única (SRP).
 */

import type { Category } from '~/types'

export interface ValidationError {
    field: string;
    message: string;
}

export class CategoryValidator {

    /**
     * Valida los datos de una categoría.
     * Retorna una lista de errores. Si la lista está vacía, los datos son válidos.
     */
    static validate(data: Partial<Category>): ValidationError[] {
        const errors: ValidationError[] = [];

        // 1. Validar Nombre (No Vacio)
        if (!data.name || data.name.trim() === '') {
            errors.push({
                field: 'name',
                message: 'El nombre es obligatorio.'
            });
        }

        // 2. Validar Slug
        // - No vacio
        // - Formato URL (solo letras minusculas, numeros y guiones)
        if (!data.slug || data.slug.trim() === '') {
            errors.push({
                field: 'slug',
                message: 'El slug es obligatorio.'
            });
        } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
            errors.push({
                field: 'slug',
                message: 'El slug contiene caracteres inválidos. Solo minúsculas, números y guiones.'
            });
        }

        return errors;
    }
}
