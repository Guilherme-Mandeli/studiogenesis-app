import { BaseService } from './BaseService';
import type { Appointment } from '../types';
import { AppointmentValidator } from '../validators/AppointmentValidator';

export class AppointmentService extends BaseService<Appointment> {
    protected table = 'appointments';

    override async create(item: Partial<Appointment>): Promise<Appointment> {
        const errors = AppointmentValidator.validate(item);
        if (errors.length > 0) {
            throw new Error(errors.map(e => e.message).join('\n'));
        }

        return super.create(item);
    }

    override async update(id: number, item: Partial<Appointment>): Promise<Appointment> {
        const errors = AppointmentValidator.validate(item, true);
        if (errors.length > 0) {
            throw new Error(errors.map(e => e.message).join('\n'));
        }

        return super.update(id, item);
    }

    /**
     * Obtener citas por mes para la vista de calendario.
     * 
     * Construye un rango de fechas desde el primer hasta el último día del mes
     * para filtrar eficientemente las citas en Supabase sin traer datos innecesarios.
     */
    async getByMonth(month: number, year: number): Promise<Appointment[]> {
        // Construimos la fecha de inicio (día 1) y fin (último día del mes)
        // en formato YYYY-MM-DD para compatibilidad con filtros de Supabase.
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        
        // El día 0 del siguiente mes nos da el último día del mes actual.
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

        // Aplanar información del producto si es necesario, o mantener anidado
        return data as Appointment[];
    }
    /**
     * Obtener citas futuras o pendientes para la agenda lateral.
     * 
     * Prioriza mostrar las citas más próximas que requieren atención (pendientes/confirmadas),
     * ordenadas cronológicamente para que el usuario vea lo que sigue inmediatamente.
     */
    async getFuture(limit: number = 5): Promise<Appointment[]> {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await this.client
            .from(this.table)
            .select(`
                *,
                product:products(name)
            `)
            .gte('date', today)
            .in('status', ['pending', 'confirmed'])
            .order('date', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data as Appointment[];
    }

    /**
     * Obtener lista paginada de citas separadas por contexto temporal (futuras vs pasadas).
     * Esto permite dividir la visualización en pestañas lógicas sin sobrecargar una sola lista.
     */
    async getPaginated(
        dataset: 'future' | 'past',
        page: number = 1,
        pageSize: number = 10
    ): Promise<{ data: Appointment[], count: number }> {
        const today = new Date().toISOString().split('T')[0];
        let query = this.client
            .from(this.table)
            .select(`
                *,
                product:products(name)
            `, { count: 'exact' });

        if (dataset === 'future') {
            query = query.gte('date', today);
            query = query.order('date', { ascending: true }); // Las más cercanas primero
        } else {
            query = query.lt('date', today);
            query = query.order('date', { ascending: false }); // Las más recientes del pasado primero
        }

        // Paginación
        if (pageSize > 0) {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return { data: data as Appointment[], count: count || 0 };
    }
}
