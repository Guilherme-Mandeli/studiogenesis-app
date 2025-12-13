<script setup lang="ts">
/**
 * Edit Category Page
 * 
 * Página para editar una categoría existente.
 * Carga los datos por ID y utiliza el CategoryForm para la edición.
 */
import { TaxonomyService } from '~/services/TaxonomyService'
import type { Category } from '~/types'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const client = useSupabaseClient()
const service = new TaxonomyService(client)
const toast = useToast()

const id = Number(route.params.id)
const loading = ref(false)

// Fetch data server-side or on hydration
const { data: category, error: fetchError } = await useAsyncData<Category | null>(
  `category-${id}`, 
  () => service.getById(id)
)

// Handle 404 or Error
if (fetchError.value || !category.value) {
  // If running on client, redirect. On server, we might want to handle differently but this is fine for SPA feel.
  if (import.meta.client) {
     toast.add({ title: 'Error', description: 'No se pudo cargar la categoría.', color: 'red' })
     router.push('/products/categories')
  }
}

const handleSubmit = async (data: Partial<Category>) => {
  loading.value = true
  try {
    await service.update(id, data)
    toast.add({ title: 'Éxito', description: 'Categoría actualizada correctamente.', color: 'green' })
    router.push('/products/categories')
  } catch (err: any) {
    console.error(err)
    toast.add({ title: 'Error', description: err.message || 'Error al actualizar.', color: 'red' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="category">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Editar Categoría</h1>
      <p class="text-gray-500 text-sm">ID: {{ id }}</p>
    </div>

    <UCard>
      <CategoryForm 
        :initial-data="category" 
        :is-edit="true" 
        :loading="loading" 
        @submit="handleSubmit" 
        @cancel="router.back()" 
      />
    </UCard>
  </div>
  <div v-else class="text-center py-10">
    <p>Cargando información...</p>
  </div>
</template>
