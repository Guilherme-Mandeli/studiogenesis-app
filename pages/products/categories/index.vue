<script setup lang="ts">
/**
 * Categories List Page
 * 
 * Vista principal para gestionar las categorías de productos.
 * Muestra un listado y permite acceder a crear, editar o eliminar.
 * Implementa visualización jerárquica (Padre > Hijo).
 */
import { TaxonomyService } from '~/services/TaxonomyService'
import type { Category } from '~/types'

import DataFilter from '~/components/common/DataFilter.vue'
import SortableHeader from '~/components/common/SortableHeader.vue'
import type { FilterDefinition } from '~/types'

definePageMeta({
  layout: 'admin'
})

// Initialize service
const client = useSupabaseClient()
const service = new TaxonomyService(client)
const toast = useToast()

// Filters
const activeFilters = ref({
    search: undefined
})

const filterDefinitions = ref<FilterDefinition[]>([
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Nombre o Slug' }
])

// Sorting
const { sort, handleSort } = useTableSort({ column: 'name', direction: 'asc' })

// Definición de columnas de la tabla
const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'products_count', label: 'Productos' },
  { key: 'slug', label: 'Slug' },
  { key: 'description', label: 'Descripción' },
  { key: 'actions' }
]

// Obtener datos
const { data: rawCategories, refresh, pending } = await useAsyncData<Category[]>('categories', () => service.getTree())

/**
 * Extensión de interfaz para lógica UI
 */
interface CategoryWithDepth extends Category {
  depth: number;
}

/**
 * Construir recursivamente una lista plana con profundidad desde el árbol/lista de categorías.
 * 
 * Lógica:
 * 1. Encontrar nodos raíz (parent_id es null).
 * 2. Para cada raíz, añadir a la lista, luego buscar hijos y recursar.
 */
const buildHierarchy = (cats: Category[]): CategoryWithDepth[] => {
  if (!cats) return []

  const result: CategoryWithDepth[] = []
  
  // Helper para buscar hijos
  const getChildren = (parentId: number | null) => 
    cats.filter(c => c.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name))

  const addCategory = (cat: Category, depth: number) => {
    result.push({ ...cat, depth })
    const children = getChildren(cat.id)
    children.forEach(child => addCategory(child, depth + 1))
  }

  const roots = getChildren(null)
  roots.forEach(root => addCategory(root, 0))

  return result
}

// Computar lista jerárquica ordenada
const categories = computed(() => {
    let list = rawCategories.value || []

    // 1. Filter
    if (activeFilters.value.search) {
        const q = String(activeFilters.value.search).toLowerCase()
        list = list.filter(c => 
            c.name.toLowerCase().includes(q) || 
            c.slug.toLowerCase().includes(q)
        )
    }

    // 2. Hierarchy vs Flat Sort
    // Si tenemos búsqueda o un orden no por defecto, tratamos como lista plana
    const isDefaultSort = sort.value.column === 'name' && sort.value.direction === 'asc' && !activeFilters.value.search
    
    let result: CategoryWithDepth[] = []

    if (isDefaultSort) {
        result = buildHierarchy(list)
    } else {
        // Flat sort
        result = list.map(c => ({ ...c, depth: 0 })) // Flatten depth
        
        result.sort((a, b) => {
            const col = sort.value.column as keyof Category
            const aVal = a[col]
            const bVal = b[col]

            if (aVal === bVal) return 0
            
            // Handle strings
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                 return sort.value.direction === 'asc' 
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal)
            }
            
            // Handle numbers
            if (aVal < bVal) return sort.value.direction === 'asc' ? -1 : 1
            if (aVal > bVal) return sort.value.direction === 'asc' ? 1 : -1
            return 0
        })
    }
    
    return result
})

// Paginación del lado del cliente
const page = ref(1)
const pageCount = ref(10)

const paginatedCategories = computed(() => {
    const start = (page.value - 1) * pageCount.value
    const end = start + pageCount.value
    return categories.value.slice(start, end)
})


/**
 * Manejar eliminación de categoría
 */
const handleDelete = async (id: number) => {
  if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) return

  try {
    await service.delete(id)
    toast.add({ title: 'Categoría eliminada correctamente', color: 'green' })
    refresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error al eliminar', description: 'No se pudo eliminar la categoría.', color: 'red' })
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Categorías</h1>
      <UButton 
        to="/products/categories/create" 
        icon="i-heroicons-plus" 
        color="black"
        class="dark:bg-white dark:text-black hover:bg-gray-800"
      >
        Nueva Categoría
      </UButton>
    </div>

    <!-- Table -->
    <DataFilter 
        :filters="filterDefinitions" 
        v-model="activeFilters" 
        v-model:page-size="pageCount"
        :loading="pending"
        @filter="page=1"
        @reset="page=1"
    />

    <UCard :ui="{ body: { padding: 'p-0' } }">
      <UTable 
        :rows="paginatedCategories" 
        :columns="columns" 
        :loading="pending"
        class="w-full"
        :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'No hay categorías.' }"
      >
        <!-- Sortable Headers -->
        <template #name-header="{ column }">
            <SortableHeader label="Nombre" value="name" :sort="sort" @sort="handleSort" />
        </template>
        <template #products_count-header="{ column }">
            <SortableHeader label="Productos" value="products_count" :sort="sort" @sort="handleSort" />
        </template>
        <template #slug-header="{ column }">
            <SortableHeader label="Slug" value="slug" :sort="sort" @sort="handleSort" />
        </template>

        <!-- Custom Name Column for Hierarchy -->
        <template #name-data="{ row }">
          <span :style="{ paddingLeft: `${row.depth * 20}px` }">
            <span v-if="row.depth > 0" class="text-gray-400 mr-1">↳</span>
            {{ row.name }}
          </span>
        </template>

        <template #products_count-data="{ row }">
            <UBadge color="gray" variant="subtle">{{ row.products_count || 0 }}</UBadge>
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UTooltip text="Editar">
              <UButton 
                :to="`/products/categories/${row.id}`" 
                icon="i-heroicons-pencil-square" 
                variant="ghost" 
                color="gray" 
                size="xs" 
              />
            </UTooltip>
            <UTooltip text="Eliminar">
              <UButton 
                icon="i-heroicons-trash" 
                variant="ghost" 
                color="red" 
                size="xs" 
                @click="handleDelete(row.id)" 
              />
            </UTooltip>
          </div>
        </template>
      </UTable>

        <!-- Pagination -->
        <div class="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
             <span class="text-sm text-gray-500">
                Total: {{ categories.length }} categorías
             </span>
             <UPagination 
                v-model="page" 
                :page-count="pageCount" 
                :total="categories.length" 
             />
        </div>
    </UCard>
  </div>
</template>
