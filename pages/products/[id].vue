<script setup lang="ts">
/**
 * Product Edit Page
 * 
 * Página para editar un producto existente.
 * Carga los datos por ID y los pasa al ProductForm.
 */
import { ProductService } from '~/services/ProductService'
import type { Product } from '~/types'
import ProductForm from '~/components/admin/ProductForm.vue'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const router = useRouter()
const client = useSupabaseClient()
const service = new ProductService(client)

const loading = ref(false)
const product = ref<Product | null>(null)
const id = parseInt(route.params.id as string)
const formRef = ref<any>(null)

onMounted(async () => {
    try {
        // Use getByIdWithCategories to pre-fill selections
        const data = await service.getByIdWithCategories(id)
        if (!data) {
            alert('Producto no encontrado')
            router.push('/products')
            return
        }
        product.value = data
    } catch (e) {
        console.error('Error loading product', e)
        router.push('/products')
    }
})

const handleSubmit = async (data: Partial<Product>) => {
    loading.value = true
    try {
        await service.update(id, data)
        router.push('/products')
    } catch (e: any) {
        console.error('Error updating product', e)
        if (e.message && e.message.includes('products_slug_key')) {
             formRef.value?.setErrors({ slug: 'El slug ya existe. Intenta con otro nombre.' })
        } else if (e.message && e.message.includes('products_code_key')) {
             formRef.value?.setErrors({ code: 'El código (SKU) ya existe.' })
        } else {
             alert('Error al actualizar producto: ' + e.message)
        }
    } finally {
        loading.value = false
    }
}

const handleCancel = () => {
    router.push('/products')
}
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Editar Producto</h1>
    </div>

    <UCard v-if="product">
        <ProductForm ref="formRef" :initial-data="product" :is-edit="true" :loading="loading" @submit="handleSubmit" @cancel="handleCancel" />
    </UCard>
    <div v-else class="p-8 text-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400 mx-auto" />
    </div>
  </div>
</template>
