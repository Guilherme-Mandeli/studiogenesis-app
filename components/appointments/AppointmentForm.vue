<script setup lang="ts">
import type { Appointment, Product, Tariff } from '~/types'
import { AppointmentService } from '~/services/AppointmentService'
import { ProductService } from '~/services/ProductService'
import { AppointmentValidator } from '~/validators/AppointmentValidator'

const props = defineProps<{
    modelValue: boolean
    appointmentId?: number
    initialDate?: Date
}>()

const emit = defineEmits(['update:modelValue', 'saved', 'close'])

const client = useSupabaseClient()
const service = new AppointmentService(client)
const productService = new ProductService(client)

const form = ref<Partial<Appointment>>({
    product_id: undefined,
    date: undefined,
    units: 1,
    status: 'pending'
})

const products = ref<Product[]>([])
const loading = ref(false)
const saving = ref(false)
const currentPrice = ref<number | null>(null)
const estimatedCost = computed(() => {
    if (currentPrice.value === null || !form.value.units) return 0
    return currentPrice.value * form.value.units
})

const isOpen = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

// Validación
const errors = ref<{ field: string, message: string }[]>([])
const getError = (field: string) => errors.value.find(e => e.field === field)?.message

// Ayudante para calcular el precio de un producto en la fecha SELECCIONADA
// Comprueba si hay tarifas vigentes para la fecha y devuelve el precio ajustado.
const getCalculatedPrice = (product: Product): { original: number, current: number, hasTariff: boolean } => {
    const original = product.price
    if (!form.value.date) return { original, current: original, hasTariff: false }

    const targetDate = new Date(form.value.date)
    const tariffs = (product.tariffs as Tariff[]) || []
    
    const applicableTariff = tariffs
            .filter((t) => {
                const start = new Date(t.start_date);
                const end = t.end_date ? new Date(t.end_date) : null;
                return start <= targetDate && (!end || end >= targetDate);
            })
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];

    if (applicableTariff) {
        return { original, current: Number(applicableTariff.price), hasTariff: true }
    }
    return { original, current: original, hasTariff: false }
}

// Cargar Datos
onMounted(async () => {
    loading.value = true
    try {
        // Cargar productos para el selector
        const res = await productService.getAllWithCategories(undefined, 1, -1) // Get all
        products.value = res.data

        if (props.appointmentId) {
            const apt = await service.getById(props.appointmentId)
            if (apt) {
                form.value = { ...apt }
            }
        } 
        // La lógica de la Fecha Inicial se maneja mediante un 'watch' para asegurar la reactividad cuando cambia la 'prop'.
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
})

// Observar cambios en la prop initialDate para actualizar el formulario
watch(() => props.initialDate, (newDate) => {
    if (newDate) {
        form.value.date = newDate.toISOString().split('T')[0]
    }
}, { immediate: true })

// Observadores para el cálculo de precios
// Recalcula el precio si cambia el producto o la fecha.
watch([() => form.value.product_id, () => form.value.date], async ([pid, date]) => {
    if (!pid || !date) {
        currentPrice.value = null
        return
    }

    try {
        // Podemos usar el ayudante localmente ya que cargamos todos los productos con tarifas
        const product = products.value.find(p => p.id === pid)
        if (product) {
            const calculated = getCalculatedPrice(product)
            currentPrice.value = calculated.current
        } else {
             // Recurrir al servicio si el producto no está en la lista (poco probable)
            const price = await productService.getPriceAtDate(pid, date)
            currentPrice.value = price
        }
    } catch (e) {
        console.error('Error fetching price', e)
        currentPrice.value = null
    }
})

const handleSave = async () => {
    errors.value = []
    const validationErrors = AppointmentValidator.validate(form.value)
    if (validationErrors.length > 0) {
        errors.value = validationErrors
        return
    }

    saving.value = true
    try {
        const payload = {
            ...form.value,
            total_cost: estimatedCost.value // Costo instantáneo al momento de guardar
        }

        if (payload.id) {
            await service.update(payload.id, payload)
        } else {
            await service.create(payload)
        }
        
        emit('saved')
        isOpen.value = false
    } catch (e: any) {
        console.error(e)
        alert(e.message || 'Error al guardar')
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <UModal v-model="isOpen">
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
                <h3 class="font-semibold text-lg">{{ form.id ? 'Editar Cita' : 'Nueva Cita' }}</h3>
            </template>

            <div class="space-y-4 py-4">
                 <!-- Selector de Fecha (Primero, porque el precio depende de ella) -->
                 <UFormGroup label="Fecha" :error="getError('date')" required>
                     <VDatePicker v-model="form.date" mode="date" :model-config="{ type: 'string', mask: 'YYYY-MM-DD' }">
                        <template #default="{ togglePopover, inputValue, inputEvents }">
                            <UInput 
                                :model-value="inputValue" 
                                v-on="inputEvents" 
                                icon="i-heroicons-calendar" 
                                @click="togglePopover" 
                                readonly 
                            />
                        </template>
                     </VDatePicker>
                </UFormGroup>

                <!-- Selector de Producto -->
                <UFormGroup label="Producto" :error="getError('product_id')" required>
                    <USelectMenu
                        v-model="form.product_id"
                        :options="products"
                        option-attribute="name"
                        value-attribute="id"
                        placeholder="Seleccionar producto"
                        searchable
                    >
                        <template #option="{ option }">
                            <div class="flex justify-between w-full items-center">
                                <div class="flex flex-col">
                                    <span class="font-medium">{{ option.name }}</span>
                                    <span class="text-xs text-gray-500">SKU: {{ option.code }}</span>
                                </div>
                                <div class="flex flex-col items-end text-sm">
                                    <!-- Visualización del Cálculo de Precio -->
                                    <template v-if="form.date">
                                        <div v-if="getCalculatedPrice(option).hasTariff" class="flex ml-3 flex-row gap-2 items-center">
                                            <span class="line-through text-gray-400 text-xs">{{ option.price }}€</span>
                                            <span 
                                                class="font-bold" 
                                                :class="getCalculatedPrice(option).current < option.price ? 'text-green-600' : 'text-red-600'"
                                            >
                                                {{ getCalculatedPrice(option).current }}€
                                            </span>
                                        </div>
                                        <span v-else class="text-gray-900">{{ option.price }}€</span>
                                    </template>
                                    <span v-else class="text-gray-900">{{ option.price }}€</span>
                                </div>
                            </div>
                        </template>
                    </USelectMenu>
                </UFormGroup>

                <!-- Unidades -->
                <UFormGroup label="Unidades" :error="getError('units')" required>
                    <UInput v-model.number="form.units" type="number" min="1" />
                </UFormGroup>

                <!-- Resumen de Costos -->
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-600">Tarifa Vigente:</span>
                        <span class="font-medium">{{ currentPrice !== null ? currentPrice.toFixed(2) + '€' : '-' }}</span>
                    </div>
                    <div class="flex justify-between text-lg font-bold text-gray-900 border-t pt-2 mt-1">
                        <span>Total Estimado:</span>
                        <span>{{ estimatedCost.toFixed(2) }}€</span>
                    </div>
                </div>

                <!-- Estado (Solo para edición) -->
                <UFormGroup v-if="form.id" label="Estado">
                    <USelect 
                        v-model="form.status" 
                        :options="[
                            { label: 'Pendiente', value: 'pending' },
                            { label: 'Confirmada', value: 'confirmed' },
                            { label: 'Concluida', value: 'completed' },
                            { label: 'Cancelada', value: 'cancelled' }
                        ]"
                        option-attribute="label"
                        value-attribute="value"
                    />
                </UFormGroup>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton color="gray" variant="ghost" @click="isOpen = false">Cancelar</UButton>
                    <UButton color="black" @click="handleSave" :loading="saving">Guardar</UButton>
                </div>
            </template>
        </UCard>
    </UModal>
</template>
