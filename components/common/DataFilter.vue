<script setup lang="ts">
/**
 * DataFilter Component
 * 
 * Componente modular para renderizar filtros de datos.
 * Acepta una configuración de filtros y emite los cambios.
 */
import type { FilterDefinition } from '~/types'

const props = defineProps<{
    filters: FilterDefinition[]
    modelValue: { [key: string]: any }
    loading?: boolean
    pageSize?: number // opcional para tamaño de página
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: { [key: string]: any }): void
    (e: 'update:pageSize', value: number): void
    (e: 'filter'): void
    (e: 'reset'): void
}>()

// Lógica de tamaño de página
const localPageSize = ref(props.pageSize || 10)
watch(() => props.pageSize, (val) => localPageSize.value = val || 10)
watch(localPageSize, (val) => emit('update:pageSize', val))


const localFilters = reactive<{ [key: string]: any }>({ ...props.modelValue })

// Observar cambios
watch(() => props.modelValue, (newVal) => {
    Object.assign(localFilters, newVal)
})

// Actualizar padre al cambiar
const updateFilter = (key: string, value: any) => {
    localFilters[key] = value
    emit('update:modelValue', localFilters)
    // Se podría agregar debounce aquí si queremos búsqueda automática
}

const handleSearch = () => {
    emit('filter')
}

const handleReset = () => {
    // Limpiar todos los campos
    props.filters.forEach(f => {
        localFilters[f.key] = undefined
    })
    emit('update:modelValue', localFilters)
    emit('reset')
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        
        <div v-for="filter in filters" :key="filter.key">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ filter.label }}</label>
            
            <!-- Type: Text -->
            <UInput 
                v-if="filter.type === 'text'"
                v-model="localFilters[filter.key]"
                :placeholder="filter.placeholder"
                icon="i-heroicons-magnifying-glass"
                @update:model-value="updateFilter(filter.key, $event)"
                @keydown.enter="handleSearch"
            />
            
            <!-- Type: Select -->
            <USelectMenu
                v-else-if="filter.type === 'select'"
                v-model="localFilters[filter.key]"
                :options="filter.options || []"
                value-attribute="value"
                option-attribute="label"
                :placeholder="filter.placeholder || 'Seleccionar...'"
                @update:model-value="updateFilter(filter.key, $event)"
            />

            <!-- Type: Date -->
            <UInput 
                v-else-if="filter.type === 'date'"
                type="date"
                v-model="localFilters[filter.key]"
                @update:model-value="updateFilter(filter.key, $event)"
            />
        </div>

        <!-- Buttons -->
        <div class="flex gap-2 items-center">
            <UButton color="black" @click="handleSearch" :loading="loading" icon="i-heroicons-funnel">Filtrar</UButton>
            <UButton color="gray" variant="ghost" @click="handleReset" icon="i-heroicons-x-mark">Limpiar</UButton>
        </div>
    </div>

    <!-- Footer / Page Size -->
    <div v-if="pageSize !== undefined" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
            <div class="flex items-center gap-2">
                 <span class="text-xs text-gray-500">Mostrar por página:</span>
                 <USelectMenu 
                    v-model="localPageSize"
                    :options="[10, 20, 50, 100, 200]"
                    size="xs"
                    class="w-20"
                 />
            </div>
    </div>
  </div>
</template>
