<script setup lang="ts">
/**
 * Create Category Page
 * 
 * Página para dar de alta una nueva categoría.
 */
import { TaxonomyService } from '~/services/TaxonomyService'
import type { Category } from '~/types'

definePageMeta({
  layout: 'admin'
})

const client = useSupabaseClient()
const service = new TaxonomyService(client)
const toast = useToast()
const router = useRouter()

const loading = ref(false)

const handleSubmit = async (data: Partial<Category>) => {
  loading.value = true
  try {
    // Asegurar que entity_type esté establecido
    data.entity_type = 'product'
    
    await service.create(data)
    toast.add({ title: 'Éxito', description: 'Categoría creada correctamente.', color: 'green' })
    router.push('/products/categories')
  } catch (error: any) {
    console.error(error)
    toast.add({ title: 'Error', description: error.message || 'Error al crear la categoría.', color: 'red' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Nueva Categoría</h1>
      <p class="text-gray-500 text-sm">Añade una nueva clasificación para tus productos.</p>
    </div>

    <UCard>
      <CategoryForm @submit="handleSubmit" @cancel="router.back()" />
    </UCard>
  </div>
</template>
