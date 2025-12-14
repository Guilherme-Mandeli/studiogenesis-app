import * as XLSX from 'xlsx';

export interface ExportColumn {
    header: string;
    key: string;
    formatter?: (value: any, row: any) => any;
}

export class ExportService {
    /**
     * Export data to Excel (XLSX)
     * @param data Array of objects to export
     * @param columns Column definitions
     * @param filename Filename without extension
     */
    static exportToExcel(data: any[], columns: ExportColumn[], filename: string) {
        // Transform data based on columns
        const rows = data.map(row => {
            const newRow: any = {};
            columns.forEach(col => {
                // Handle nested keys (e.g. 'category.name') if key handles dots, 
                // but here we rely on simple key access or use formatter for complex logic.
                // For simplicity, we just take row[key] but we could implement dot notation getter if needed.
                // Since we have specific requirements for Products (categories list), formatter is the way to go.

                const val = row[col.key];
                newRow[col.header] = col.formatter ? col.formatter(val, row) : val;
            });
            return newRow;
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);

        // Auto-width columns (optional but nice)
        const wscols = columns.map(col => ({ wch: 20 })); // Default width 20
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Data");

        // Generate file
        XLSX.writeFile(wb, `${filename}.xlsx`);
    }
}
