import type { Appointment } from '../types';

export interface ValidationError {
    field: string;
    message: string;
}

export class AppointmentValidator {
    static validate(data: Partial<Appointment>): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!data.product_id) {
            errors.push({ field: 'product_id', message: 'El producto es obligatorio' });
        }

        if (!data.date) {
            errors.push({ field: 'date', message: 'La fecha es obligatoria' });
        }

        if (data.units !== undefined && data.units <= 0) {
            errors.push({ field: 'units', message: 'Las unidades deben ser mayores a 0' });
        }

        return errors;
    }
}
