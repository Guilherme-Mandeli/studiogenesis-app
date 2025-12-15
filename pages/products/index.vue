<script setup lang="ts">
/**
 * Product List Page
 * 
 * Muestra el listado de productos con opciones para crear, editar y eliminar.
 * Usa ProductService para obtener datos.
 */
import { ProductService } from '~/services/ProductService'
import type { Product } from '~/types'

import DataFilter from '~/components/common/DataFilter.vue'
import { TaxonomyService } from '~/services/TaxonomyService'
import type { FilterDefinition } from '~/types'

import SortableHeader from '~/components/common/SortableHeader.vue'
import { ExportService } from '~/services/ExportService'

definePageMeta({
  layout: 'admin'
})

const client = useSupabaseClient()
const service = new ProductService(client)
const taxonomyService = new TaxonomyService(client)

const products = ref<Product[]>([])
const loading = ref(true)
const exporting = ref(false)

// Filters
const activeFilters = ref({
    search: undefined,
    status: undefined,
    category_id: undefined
})

const filterDefinitions = ref<FilterDefinition[]>([
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Nombre o SKU' },
    { key: 'status', label: 'Estado', type: 'select', options: [
        { label: 'Activo', value: 'active' },
        { label: 'Borrador', value: 'draft' },
        { label: 'Pendiente', value: 'pending' }
    ]},
    { key: 'category_id', label: 'Categoría', type: 'select', options: [] }
])

const columns = [
  { key: 'image_url', label: 'Imagen' },
  { key: 'name', label: 'Nombre' },
  { key: 'categories', label: 'Categorías' },
  { key: 'code', label: 'SKU' },
  { key: 'price', label: 'Precio' },
  { key: 'status', label: 'Estado' },
  { key: 'actions' }
]

// Pagination
const page = ref(1)
const pageSize = ref(10)
const total = ref(0) // Total items count

// Sorting
const { sort, handleSort } = useTableSort({ column: 'created_at', direction: 'desc' })

// Fetch data
const fetchProducts = async () => {
    loading.value = true
    try {
        const result = await service.getAllWithCategories(activeFilters.value, page.value, pageSize.value, sort.value)
        products.value = result.data
        total.value = result.count
    } catch (e) {
        console.error('Error fetching products', e)
    } finally {
        loading.value = false
    }
}

// Observar cambios en ordenamiento para recargar
watch(sort, () => {
    fetchProducts()
})

// Resetear página al filtrar
watch(activeFilters, () => {
    page.value = 1
}, { deep: true })

// Refetch on pagination change
watch([page, pageSize], () => {
    fetchProducts()
})

onMounted(async () => {
    try {
        const cats = await taxonomyService.getTree()
        const catFilter = filterDefinitions.value.find(f => f.key === 'category_id')
        if (catFilter) {
            catFilter.options = cats.map(c => ({ label: c.name, value: c.id }))
        }
    } catch (e) { console.error(e) }

    await fetchProducts()
})

// Actions
const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
    
    try {
        await service.delete(id)
        await fetchProducts()
    } catch (e) {
        console.error('Error deleting product', e)
        alert('Error al eliminar producto')
    }
    }

const handleExport = async (format: 'xls' | 'pdf') => {
    exporting.value = true
    try {
        const result = await service.getAllWithCategories(activeFilters.value, 1, -1, sort.value)
        
        const exportCols = [
            { header: 'ID', key: 'id' },
            { header: 'Nombre', key: 'name' },
            { header: 'SKU', key: 'code' },
            { header: 'Precio', key: 'price', formatter: (val: number) => val?.toFixed(2) },
            { header: 'Estado', key: 'status' },
            { header: 'Categorías', key: 'categories', formatter: (cats: any[]) => cats ? cats.map(c => c.name).join(', ') : '' },
            { header: 'Fecha Creación', key: 'created_at', formatter: (val: string) => val ? new Date(val).toLocaleDateString() : '' }
        ]

        const filename = `Productos_${new Date().toISOString().split('T')[0]}`

        if (format === 'xls') {
            ExportService.exportToExcel(result.data, exportCols, filename)
        } else {
            ExportService.exportToPDF(result.data, exportCols, filename)
        }
        
    } catch (e) {
        console.error('Error exporting', e)
        alert('Error al exportar datos')
    } finally {
        exporting.value = false
    }
}

const getStatusColor = (status: string) => {
    switch(status) {
        case 'Activo': return 'green'
        case 'Borrador': return 'gray'
        case 'Pendiente': return 'orange'
        default: return 'gray'
    }
}
</script>

<template>
  <div class="p-6">
    <!-- Export Actions -->
    <div class="flex gap-2 justify-end mb-4">
        <UButton 
            color="white" 
            variant="solid" 
            label="Exportar | XLS" 
            icon="i-heroicons-document-arrow-down"
            :loading="exporting"
            @click="handleExport('xls')"
        />
        <UButton 
            color="white" 
            variant="solid" 
            label="Exportar | PDF" 
            icon="i-heroicons-document"
            :loading="exporting"
            @click="handleExport('pdf')"
        />
    </div>

    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Productos</h1>
      <UButton to="/products/create" color="black" icon="i-heroicons-plus">
        Nuevo Producto
      </UButton>
    </div>

    <DataFilter 
        :filters="filterDefinitions" 
        v-model="activeFilters" 
        v-model:page-size="pageSize"
        :loading="loading" 
        @filter="fetchProducts" 
        @reset="fetchProducts"
    />

    <UCard>
        <UTable 
            :rows="products" 
            :columns="columns" 
            :loading="loading"
            :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'No hay productos.' }"
        >
             <!-- Sortable Headers -->
             <template #name-header="{ column }">
                <SortableHeader label="Nombre" value="name" :sort="sort" @sort="handleSort" />
             </template>
             <template #code-header="{ column }">
                <SortableHeader label="SKU" value="code" :sort="sort" @sort="handleSort" />
             </template>
             <template #price-header="{ column }">
                <SortableHeader label="Precio" value="price" :sort="sort" @sort="handleSort" />
             </template>
             <template #status-header="{ column }">
                <SortableHeader label="Estado" value="status" :sort="sort" @sort="handleSort" />
             </template>

             <template #image_url-data="{ row }">
                <img v-if="row.image_url" :src="row.image_url" class="h-10 w-10 object-cover rounded" alt="" />
                <div v-else class="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">N/A</div>
            </template>

            <template #price-data="{ row }">
                {{ row.price?.toFixed(2) }}€
            </template>

            <template #categories-data="{ row }">
                <div v-if="row.categories && row.categories.length > 0" class="flex items-center gap-1">
                    <UBadge color="gray" variant="subtle" size="xs">{{ row.categories[0].name }}</UBadge>
                    
                    <UPopover v-if="row.categories.length > 1" mode="hover">
                        <UButton color="gray" variant="soft" size="xs" :padded="false" class="rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                            +{{ row.categories.length - 1 }}
                        </UButton>
                        <template #panel>
                            <div class="p-2 flex flex-col gap-1">
                                <span v-for="cat in row.categories.slice(1)" :key="cat.id" class="text-xs text-gray-700 whitespace-nowrap">
                                    {{ cat.name }}
                                </span>
                            </div>
                        </template>
                    </UPopover>
                </div>
                <span v-else class="text-xs text-gray-400">-</span>
            </template>

            <template #status-data="{ row }">
                <UBadge :color="getStatusColor(row.status)" variant="subtle">{{ row.status }}</UBadge>
            </template>

            <template #actions-data="{ row }">
                <div class="flex gap-2">
                    <UButton :to="`/products/${row.id}`" color="gray" variant="ghost" icon="i-heroicons-pencil-square" size="xs" />
                    <UButton color="red" variant="ghost" icon="i-heroicons-trash" size="xs" @click="handleDelete(row.id)" />
                </div>
            </template>
        </UTable>

        <!-- Pagination -->
        <div class="flex justify-between items-center px-3 py-3 border-t border-gray-200 dark:border-gray-700">
             <span class="text-sm text-gray-500">
                Total: {{ total }} productos
             </span>
             <UPagination 
                v-model="page" 
                :page-count="pageSize" 
                :total="total" 
             />
        </div>
    </UCard>
  </div>
</template>
