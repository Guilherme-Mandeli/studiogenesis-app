<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Inicio</h1>
    </div>

    <UCard class="w-full">
      <template #header>
        <h2 class="text-xl font-semibold">Resumen</h2>
      </template>

      <div class="py-4">
        <p class="text-gray-600 dark:text-gray-300">
          Bienvenido al sistema de gestión. Seleccione una opción del menú lateral para comenzar.
        </p>
      </div>
    </UCard>
  </div>
</template>
