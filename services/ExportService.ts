import * as XLSX from 'xlsx';

export interface ExportColumn {
    header: string;
    key: string;
    formatter?: (value: any, row: any) => any;
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export class ExportService {
    /**
     * Export data to Excel (XLSX)
     * @param data Array of objects to export
     * @param columns Column definitions
     * @param filename Filename without extension
     */
    static exportToExcel(data: any[], columns: ExportColumn[], filename: string) {
        // Transformar datos basados en columnas
        const rows = data.map(row => {
            const newRow: any = {};
            columns.forEach(col => {
                // Manejar claves anidadas (ej: 'category.name') si la clave maneja puntos, 
                // pero aquí dependemos de acceso simple o usamos formateador para lógica compleja.
                // Por simplicidad, tomamos row[key] pero podríamos implementar un getter de notación por puntos si fuera necesario.
                // Dado que tenemos requisitos específicos para Productos (lista de categorías), el formateador es el camino a seguir.

                const val = row[col.key];
                newRow[col.header] = col.formatter ? col.formatter(val, row) : val;
            });
            return newRow;
        });

        // Crear libro y hoja
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);

        // Auto-ancho de columnas (opcional pero agradable)
        const wscols = columns.map(col => ({ wch: 20 })); // Ancho por defecto 20
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Data");

        // Generar archivo
        XLSX.writeFile(wb, `${filename}.xlsx`);
    }

    /**
     * Export data to PDF using jspdf-autotable
     * @param data Array of objects to export
     * @param columns Column definitions
     * @param filename Filename without extension
     */
    static exportToPDF(data: any[], columns: ExportColumn[], filename: string) {
        const doc = new jsPDF();

        // Preparar cuerpo de la tabla
        const body = data.map(row => {
            return columns.map(col => {
                const val = row[col.key];
                return col.formatter ? col.formatter(val, row) : (val ?? '');
            });
        });

        // Preparar cabeceras de la tabla
        const head = [columns.map(col => col.header)];

        autoTable(doc, {
            head: head,
            body: body,
        });

        doc.save(`${filename}.pdf`);
    }
}
