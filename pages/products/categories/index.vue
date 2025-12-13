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

definePageMeta({
  layout: 'admin'
})

// Initialize service
const client = useSupabaseClient()
const service = new TaxonomyService(client)
const toast = useToast()

// Definition of table columns
const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'slug', label: 'Slug' },
  { key: 'description', label: 'Descripción' },
  { key: 'actions', label: 'Acciones' }
]

// Fetch data
const { data: rawCategories, refresh, pending } = await useAsyncData<Category[]>('categories', () => service.getTree())

/**
 * Interface extension for UI Logic
 */
interface CategoryWithDepth extends Category {
  depth: number;
}

/**
 * Recursively build a flat list with depth from the category tree/list.
 * 
 * Logic:
 * 1. Find root nodes (parent_id is null).
 * 2. For each root, add to list, then find children and recurse.
 */
const buildHierarchy = (cats: Category[]): CategoryWithDepth[] => {
  if (!cats) return []

  const result: CategoryWithDepth[] = []
  
  // Helper to find children
  const getChildren = (parentId: number | null) => 
    cats.filter(c => c.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name))

  // Recursive adder
  const addCategory = (cat: Category, depth: number) => {
    result.push({ ...cat, depth })
    const children = getChildren(cat.id)
    children.forEach(child => addCategory(child, depth + 1))
  }

  // Start with top-level categories
  const roots = getChildren(null)
  roots.forEach(root => addCategory(root, 0))

  return result
}

// Compute the sorted hierarchical list
const categories = computed(() => buildHierarchy(rawCategories.value || []))


/**
 * Handle Delete Category
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
    <UCard :ui="{ body: { padding: 'p-0' } }">
      <UTable 
        :rows="categories" 
        :columns="columns" 
        :loading="pending"
        class="w-full"
      >
        <!-- Custom Name Column for Hierarchy -->
        <template #name-data="{ row }">
          <span :style="{ paddingLeft: `${row.depth * 20}px` }">
            <span v-if="row.depth > 0" class="text-gray-400 mr-1">↳</span>
            {{ row.name }}
          </span>
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
    </UCard>
  </div>
</template>
