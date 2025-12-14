import type { Product, Tariff } from '../types';

export interface ValidationError {
    field: string;
    message: string;
}

export class ProductValidator {
    /**
     * Validar producto completo
     */
    static validate(item: Partial<Product>): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!item.name || item.name.length < 3) {
            errors.push({ field: 'name', message: 'El nombre es obligatorio y debe tener al menos 3 caracteres.' });
        }

        if (!item.slug) {
            errors.push({ field: 'slug', message: 'El slug es obligatorio.' });
        }

        if (!item.code) {
            errors.push({ field: 'code', message: 'El código (SKU) es obligatorio.' });
        }

        if (item.price === undefined || item.price < 0) {
            errors.push({ field: 'price', message: 'El precio es obligatorio y debe ser mayor o igual a 0.' });
        }

        if (item.tariffs && item.tariffs.length > 0) {
            const tariffErrors = this.validateTariffs(item.tariffs);
            errors.push(...tariffErrors);
        }

        return errors;
    }

    /**
     * Validar lista de tarifas
     * Retorna errores genéricos de tarifas. 
     */
    static validateTariffs(tariffs: Tariff[]): ValidationError[] {
        const errors: ValidationError[] = [];
        tariffs.forEach((t, index) => {
            if (t.price < 0) {
                errors.push({ field: 'tariffs', message: `La tarifa #${index + 1} tiene un precio inválido.` });
            }
            if (!t.start_date || !t.end_date) {
                errors.push({ field: 'tariffs', message: `La tarifa #${index + 1} debe tener fechas de inicio y fin.` });
            }
            if (new Date(t.start_date) > new Date(t.end_date)) {
                errors.push({ field: 'tariffs', message: `La tarifa #${index + 1} tiene una fecha de inicio posterior al fin.` });
            }
        });
        return errors;
    }
}
