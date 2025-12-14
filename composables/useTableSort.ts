export const useTableSort = (initialSort = { column: 'created_at', direction: 'desc' as const }) => {
    const sort = ref<{ column: string, direction: 'asc' | 'desc' }>(initialSort)

    const handleSort = (newSort: { column: string, direction: 'asc' | 'desc' }) => {
        sort.value = newSort
    }

    return {
        sort,
        handleSort
    }
}
