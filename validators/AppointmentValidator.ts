import type { Appointment } from '../types';

export interface ValidationError {
    field: string;
    message: string;
}

/**
 * Validador para Citas (Appointments)
 * 
 * Centraliza la lógica de validación tanto para creación como actualización.
 * Permite validar campos obligatorios o reglas de negocio específicas (ej. unidades > 0).
 */
export class AppointmentValidator {
    static validate(data: Partial<Appointment>, isUpdate: boolean = false): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!isUpdate && !data.product_id) {
            errors.push({ field: 'product_id', message: 'El producto es obligatorio' });
        }

        if (!isUpdate && !data.date) {
            errors.push({ field: 'date', message: 'La fecha es obligatoria' });
        }

        if (data.units !== undefined && data.units <= 0) {
            errors.push({ field: 'units', message: 'Las unidades deben ser mayores a 0' });
        }

        return errors;
    }
}
