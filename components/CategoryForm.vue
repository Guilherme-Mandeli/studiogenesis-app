<script setup lang="ts">
/**
 * Category Form Component
 * 
 * Componente reutilizable que contiene el formulario para crear y editar categorías.
 * Maneja el estado local del formulario y la generación automática del slug.
 */
import { TaxonomyService } from '~/services/TaxonomyService'
import { CategoryValidator } from '~/validators/CategoryValidator'
import type { Category } from '~/types'

const props = defineProps<{
  initialData?: Partial<Category>
  loading?: boolean
  isEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', data: Partial<Category>): void
  (e: 'cancel'): void
}>()

// Servicio para obtener opciones de padres
const client = useSupabaseClient()
const service = new TaxonomyService(client)

// Local state copy
const form = reactive<Partial<Category>>({
  name: props.initialData?.name || '',
  slug: props.initialData?.slug || '',
  description: props.initialData?.description || '',
  parent_id: props.initialData?.parent_id || null,
  entity_type: 'product'
})

// Validation State
const errors = reactive<{ [key: string]: string }>({})

const parentOptions = ref<{ id: number; label: string }[]>([])

// Fetch categories on mount
onMounted(async () => {
  try {
    const categories = await service.getTree()
    
    // Filtrar opciones:
    // 1. Eliminar categoría actual (si se edita) para evitar auto-parentesco
    // 2. Mapear a { id, label } para SelectMenu
    parentOptions.value = categories
      .filter(c => !props.isEdit || c.id !== props.initialData?.id)
      .map(c => ({
        id: c.id,
        label: c.name
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

  } catch (e) {
    console.error('Error loading parent categories', e)
  }
})

// Slugify
watch(() => form.name, (newVal) => {
  if (!props.isEdit && newVal) {
    if (errors.name) delete errors.name

    form.slug = newVal
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      
    if (errors.slug) delete errors.slug
  }
})

watch(() => form.slug, () => {
   if (errors.slug) delete errors.slug
})

const handleSubmit = () => {
  // Limpiar errores previos
  Object.keys(errors).forEach(key => delete errors[key])

  const validationErrors = CategoryValidator.validate(form)
  
  if (validationErrors.length > 0) {
    validationErrors.forEach(err => {
      errors[err.field] = err.message
    })
    return // Detener envío
  }

  emit('submit', form)
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6 max-w-xl">
    
    <UFormGroup label="Nombre" name="name" required :error="errors.name">
      <UInput v-model="form.name" placeholder="Ej: Ropa de Hombre" autofocus />
    </UFormGroup>

    <UFormGroup label="Slug" name="slug" required help="Identificador URL amigable (ej: ropa-de-hombre)" :error="errors.slug">
      <UInput v-model="form.slug" />
    </UFormGroup>

    <UFormGroup label="Descripción" name="description">
      <UTextarea v-model="form.description" :rows="3" />
    </UFormGroup>

    <UFormGroup label="Categoría Padre" name="parent_id" help="Opcional. Selecciona si esta categoría pertenece a otra.">
      <USelectMenu
        v-model="form.parent_id"
        :options="parentOptions"
        placeholder="Seleccionar categoría padre (Ninguna)"
        value-attribute="id"
        option-attribute="label"
        searchable
        searchable-placeholder="Buscar categoría..."
        nullable
      />
    </UFormGroup>

    <div class="flex items-center gap-4 pt-4">
      <UButton type="submit" color="black" :loading="loading">
        {{ isEdit ? 'Actualizar' : 'Guardar' }}
      </UButton>
      <UButton variant="ghost" color="gray" @click="$emit('cancel')">
        Cancelar
      </UButton>
    </div>
  </form>
</template>
