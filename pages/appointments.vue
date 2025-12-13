<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Citas</h1>
      <UButton icon="i-heroicons-plus" color="primary" variant="solid">Nueva Cita</UButton>
    </div>

    <UCard>
      <div class="text-center py-8 text-gray-500">
        Gestión de citas próximamente...
      </div>
    </UCard>
  </div>
</template>
