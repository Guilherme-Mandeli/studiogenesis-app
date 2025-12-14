<script setup lang="ts">
/**
 * Product Form Component
 * 
 * Formulario maestro para productos.
 * Incluye gestión de campos base, selector de categorías y gestor de tarifas (Custom Fields).
 */
import { TaxonomyService } from '~/services/TaxonomyService'
import { ProductValidator, type ValidationError } from '~/validators/ProductValidator'
import type { Product, Category, Tariff } from '~/types'

const props = defineProps<{
  initialData?: Partial<Product>
  loading?: boolean
  isEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', data: Partial<Product>): void
  (e: 'cancel'): void
}>()

// Service dependencies
const client = useSupabaseClient()
const taxonomyService = new TaxonomyService(client)

// State
const form = reactive<Partial<Product>>({
  type: 'product',
  name: props.initialData?.name || '',
  slug: props.initialData?.slug || '',
  description: props.initialData?.description || '',
  status: props.initialData?.status || 'draft',
  image_url: props.initialData?.image_url || '',
  code: props.initialData?.code || '',
  price: props.initialData?.price || 0,
  categories: props.initialData?.categories || [],
  tariffs: props.initialData?.tariffs || [],
  gallery: props.initialData?.gallery || []
})

const errors = reactive<{ [key: string]: string }>({})
const categoryOptions = ref<{ id: number; label: string }[]>([])

// Tariff Options in Spanish
const tariffStatusOptions = [
    { label: 'Activa', value: 'active' },
    { label: 'Caducada', value: 'expired' },
    { label: 'Inactiva', value: 'inactive' }
]

// Load categories
onMounted(async () => {
    try {
        const cats = await taxonomyService.getTree()
        categoryOptions.value = cats.map(c => ({ id: c.id, label: c.name }))
    } catch (e) {
        console.error('Error loading categories', e)
    }
})

// Slug Auto-generator
watch(() => form.name, (newVal) => {
  if (!props.isEdit && newVal) {
    if (errors.name) delete errors.name
    form.slug = newVal.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    if (errors.slug) delete errors.slug
  }
})

// Price Mask (2 decimals)
const formatPrice = (field: 'price' | 'tariff', index?: number) => {
    if (field === 'price') {
        const val = parseFloat(form.price?.toString() || '0')
        form.price = parseFloat(val.toFixed(2))
    } else if (field === 'tariff' && typeof index === 'number' && form.tariffs) {
        const val = parseFloat(form.tariffs[index].price?.toString() || '0')
        form.tariffs[index].price = parseFloat(val.toFixed(2))
    }
}

// Tariff Management
const addTariff = () => {
    if (!form.tariffs) form.tariffs = []
    form.tariffs.push({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        price: 0,
        status: 'active'
    })
}

const removeTariff = (index: number) => {
    if (form.tariffs) form.tariffs.splice(index, 1)
}

// Gallery Management
const addGalleryImage = () => {
    if (!form.gallery) form.gallery = []
    form.gallery.push('')
}

const removeGalleryImage = (index: number) => {
    if (form.gallery) form.gallery.splice(index, 1)
}

// Image Selection Simulation
const selectImage = (target: 'main' | 'gallery', index?: number) => {
    // Simulated action
    const url = prompt("Introduce la URL de la imagen (Simulación de selección):", "https://placehold.co/600x400")
    if (url) {
        if (target === 'main') {
            form.image_url = url
        } else if (target === 'gallery' && typeof index === 'number' && form.gallery) {
            form.gallery[index] = url
        }
    }
}

// Submission
const handleSubmit = () => {
    Object.keys(errors).forEach(key => delete errors[key])
    
    const validationErrors = ProductValidator.validate(form)
    if (validationErrors.length > 0) {
        validationErrors.forEach(err => errors[err.field] = err.message)
        return
    }
    emit('submit', form)
}

const setErrors = (externalErrors: { [key: string]: string }) => {
    Object.assign(errors, externalErrors)
}

defineExpose({
    setErrors
})
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6 max-w-4xl">
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Basic Info -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold">Información General</h3>
            
            <UFormGroup label="Nombre" name="name" required :error="errors.name">
                <UInput v-model="form.name" autofocus />
            </UFormGroup>

            <UFormGroup label="Slug" name="slug" required :error="errors.slug">
                <UInput v-model="form.slug" />
            </UFormGroup>

            <UFormGroup label="Código (SKU)" name="code" required :error="errors.code">
                <UInput v-model="form.code" />
            </UFormGroup>

            <div class="grid grid-cols-2 gap-4">
                <UFormGroup label="Precio Base" name="price" required :error="errors.price">
                    <UInput v-model="form.price" type="number" step="0.01" @blur="formatPrice('price')" />
                </UFormGroup>
                 <UFormGroup label="Estado" name="status">
                    <!-- Mapped options could be improved here too but explicit request was for Tariffs -->
                    <USelect v-model="form.status" :options="['active', 'draft', 'pending']" />
                </UFormGroup>
            </div>
            
            <UFormGroup label="Categorías" name="categories">
                 <USelectMenu v-model="form.categories" :options="categoryOptions" multiple searchable placeholder="Seleccionar categorías" value-attribute="id" option-attribute="label" />
            </UFormGroup>
        </div>

        <!-- Description & Image -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold">Detalles</h3>
            <UFormGroup label="Descripción" name="description">
                <UTextarea v-model="form.description" :rows="5" />
            </UFormGroup>
            
             <UFormGroup label="Imagen Principal" name="image_url">
                <div class="flex gap-2">
                    <UInput v-model="form.image_url" placeholder="https://..." class="flex-1" />
                    <UButton color="gray" icon="i-heroicons-photo" @click="selectImage('main')">Seleccionar</UButton>
                </div>
            </UFormGroup>
        </div>
    </div>

    <!-- Custom Field: Gallery -->
    <div class="border-t pt-6 bg-gray-50/50 p-4 rounded-lg">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Galería de Imágenes</h3>
            <UButton size="sm" color="white" @click="addGalleryImage" icon="i-heroicons-plus">Añadir Imagen</UButton>
        </div>
         <div v-if="form.gallery && form.gallery.length > 0" class="space-y-2">
            <div v-for="(img, idx) in form.gallery" :key="idx" class="flex gap-2 items-center">
                 <UInput v-model="form.gallery[idx]" placeholder="URL de la imagen" class="flex-1" />
                 <UButton color="gray" icon="i-heroicons-photo" size="sm" @click="selectImage('gallery', idx)">Seleccionar</UButton>
                 <UButton color="red" variant="ghost" icon="i-heroicons-trash" size="sm" @click="removeGalleryImage(idx)" />
            </div>
        </div>
        <div v-else class="text-gray-500 text-sm italic text-center">
            Sin imágenes en la galería.
        </div>
    </div>

    <!-- Custom Field: Tariffs -->
    <div class="border-t pt-6">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Tarifas</h3>
            <UButton size="sm" color="gray" @click="addTariff" icon="i-heroicons-plus">Añadir Tarifa</UButton>
        </div>
        
        <UAlert v-if="errors.tariffs" color="red" variant="subtle" title="Error en Tarifas" :description="errors.tariffs" class="mb-4"/>

        <div v-if="form.tariffs && form.tariffs.length > 0" class="border rounded-lg">
             <table class="w-full text-sm text-left">
                <thead class="bg-gray-50 text-gray-700 font-medium">
                    <tr>
                        <th class="p-3">Inicio</th>
                        <th class="p-3">Fin</th>
                        <th class="p-3">Precio</th>
                         <th class="p-3">Estado</th>
                        <th class="p-3 w-10"></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="(tariff, idx) in form.tariffs" :key="idx">
                        <td class="p-2"><UInput type="date" v-model="tariff.start_date" size="sm" /></td>
                        <td class="p-2"><UInput type="date" v-model="tariff.end_date" size="sm" /></td>
                        <td class="p-2"><UInput type="number" step="0.01" v-model="tariff.price" size="sm" @blur="formatPrice('tariff', idx)" /></td>
                        <td class="p-2">
                            <USelectMenu v-model="tariff.status" :options="tariffStatusOptions" value-attribute="value" option-attribute="label" size="sm" />
                        </td>
                        <td class="p-2">
                            <UButton color="red" variant="ghost" icon="i-heroicons-trash" size="xs" @click="removeTariff(idx)" />
                        </td>
                    </tr>
                </tbody>
             </table>
        </div>
        <div v-else class="text-gray-500 text-sm italic py-4 text-center bg-gray-50 rounded">
            No hay tarifas definidas.
        </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-4 pt-6 border-t">
      <UButton type="submit" color="black" :loading="loading" size="lg">
        {{ isEdit ? 'Actualizar Producto' : 'Guardar Producto' }}
      </UButton>
      <UButton variant="ghost" color="gray" @click="$emit('cancel')">
        Cancelar
      </UButton>
    </div>
  </form>
</template>
