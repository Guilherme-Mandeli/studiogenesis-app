import { BaseService } from './BaseService';
import type { Appointment } from '../types';
import { AppointmentValidator } from '../validators/AppointmentValidator';

export class AppointmentService extends BaseService<Appointment> {
    protected table = 'appointments';

    async create(item: Partial<Appointment>): Promise<Appointment> {
        const errors = AppointmentValidator.validate(item);
        if (errors.length > 0) {
            throw new Error(errors.map(e => e.message).join('\n'));
        }

        return super.create(item);
    }

    async update(id: number, item: Partial<Appointment>): Promise<Appointment> {
        const errors = AppointmentValidator.validate(item);
        if (errors.length > 0) {
            throw new Error(errors.map(e => e.message).join('\n'));
        }

        return super.update(id, item);
    }

    /**
     * Get appointments by month for calendar view
     */
    async getByMonth(month: number, year: number): Promise<Appointment[]> {
        // Construct date range
        // Month is 0-indexed in JS but let's assume 1-indexed for argument flexibility
        // Supabase date filtering

        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        // Calculate end date (last day of month)
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

        const { data, error } = await this.client
            .from(this.table)
            .select(`
                *,
                product:products(name, price)
            `)
            .gte('date', startDate)
            .lte('date', endDate);

        if (error) throw error;

        // Flatten product info if needed or just keep it nested
        return data as Appointment[];
    }
}
