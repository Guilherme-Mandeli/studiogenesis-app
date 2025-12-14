<script setup lang="ts">
/**
 * Product Create Page
 * 
 * Página para crear un nuevo producto. Reutiliza ProductForm.
 */
import { ProductService } from '~/services/ProductService'
import type { Product } from '~/types'
import ProductForm from '~/components/admin/ProductForm.vue'

definePageMeta({
  layout: 'admin'
})

const client = useSupabaseClient()
const service = new ProductService(client)
const router = useRouter()
const loading = ref(false)
const formRef = ref<any>(null)

const handleSubmit = async (data: Partial<Product>) => {
    loading.value = true
    try {
        await service.create(data)
        router.push('/products')
    } catch (e: any) {
        console.error('Error creating product', e)
        if (e.message && e.message.includes('products_slug_key')) {
             formRef.value?.setErrors({ slug: 'El slug ya existe. Intenta con otro nombre.' })
        } else if (e.message && e.message.includes('products_code_key')) {
             formRef.value?.setErrors({ code: 'El código (SKU) ya existe.' })
        } else {
             alert('Error al crear producto: ' + e.message)
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
      <h1 class="text-2xl font-bold text-gray-800">Nuevo Producto</h1>
    </div>

    <UCard>
        <ProductForm ref="formRef" :loading="loading" @submit="handleSubmit" @cancel="handleCancel" />
    </UCard>
  </div>
</template>
