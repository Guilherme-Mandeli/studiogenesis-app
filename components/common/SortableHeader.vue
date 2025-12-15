<script setup lang="ts">
/**
 * SortableHeader Component
 * 
 * Cabecera de tabla reutilizable con controles de ordenamiento.
 * Muestra etiqueta e indicadores arriba/abajo.
 */

const props = defineProps<{
    label: string
    value: string // Field key
    sort?: { column: string, direction: 'asc' | 'desc' }
}>()

const emit = defineEmits<{
    (e: 'sort', payload: { column: string, direction: 'asc' | 'desc' }): void
}>()

const isActive = computed(() => props.sort?.column === props.value)
const isAsc = computed(() => isActive.value && props.sort?.direction === 'asc')
const isDesc = computed(() => isActive.value && props.sort?.direction === 'desc')

const toggleSort = () => {
    let newDirection: 'asc' | 'desc' = 'asc'
    if (isActive.value) {
        newDirection = props.sort?.direction === 'asc' ? 'desc' : 'asc'
    }
    emit('sort', { column: props.value, direction: newDirection })
}
</script>

<template>
  <button 
    @click="toggleSort" 
    class="flex items-center gap-1.5 focus:outline-none hover:text-gray-900 dark:hover:text-white transition-colors group"
    :class="[isActive ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400']"
  >
    <span>{{ label }}</span>
    <div class="flex flex-col gap-[2px]">
        <!-- Up Chevron (ASC) - Claro si no es ASC -->
        <UIcon 
            name="i-heroicons-chevron-up-20-solid" 
            class="w-3 h-3 -mb-1"
            :class="[isAsc ? 'opacity-100 text-black dark:text-white' : 'opacity-40 group-hover:opacity-60']"
        />
        <!-- Down Chevron (DESC) - Claro si no es DESC -->
         <UIcon 
            name="i-heroicons-chevron-down-20-solid" 
            class="w-3 h-3"
            :class="[isDesc ? 'opacity-100 text-black dark:text-white' : 'opacity-40 group-hover:opacity-60']"
        />
    </div>
  </button>
</template>
