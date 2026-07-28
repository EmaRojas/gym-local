<template>
  <div class="space-y-2.5">
    <div v-for="(set, j) in modelValue" :key="j" class="flex items-center gap-2.5" :class="readonly ? 'bg-gym-gray-50 rounded-xl p-3' : ''">
      <span class="text-xs font-bold text-gym-gray-400 w-9 flex-shrink-0 tabular-nums">S{{ j + 1 }}</span>
      <template v-if="readonly">
        <div class="flex-1 flex items-center gap-2 justify-center">
          <span class="text-sm font-bold text-gym-gray-900 tabular-nums">{{ set.peso || '-' }} <span class="text-xs font-normal text-gym-gray-400">kg</span></span>
          <span class="text-xs text-gym-gray-300">&times;</span>
          <span class="text-sm font-bold text-gym-gray-900 tabular-nums">{{ set.reps || '-' }} <span class="text-xs font-normal text-gym-gray-400">reps</span></span>
        </div>
      </template>
      <template v-else>
        <div class="flex-1 flex flex-col gap-1">
          <label class="text-[11px] font-medium text-gym-gray-500 px-1">Peso</label>
          <input :value="set.peso" @input="updatePeso(j, $event)" type="number" inputmode="decimal" class="input-field-sm text-center tabular-nums" placeholder="kg" :aria-label="`Peso serie ${j + 1}`" />
        </div>
        <div class="flex-1 flex flex-col gap-1">
          <label class="text-[11px] font-medium text-gym-gray-500 px-1">Reps</label>
          <input :value="set.reps" @input="updateReps(j, $event)" type="number" inputmode="numeric" class="input-field-sm text-center tabular-nums" placeholder="reps" :aria-label="`Repeticiones serie ${j + 1}`" />
        </div>
        <button @click="removeSet(j)" class="btn-icon-sm bg-gym-gray-100 text-gym-gray-400 hover:bg-red-50 hover:text-red-500 mt-4" :aria-label="`Eliminar serie ${j + 1}`">
          <Icon icon="ph:x" class="w-4 h-4" />
        </button>
      </template>
    </div>
    <button v-if="!readonly" @click="addSet" class="btn-sm text-gym-blue w-full mt-2 flex items-center justify-center gap-1.5" aria-label="Agregar nueva serie">
      <Icon icon="ph:plus" class="w-4 h-4" /> Agregar serie
    </button>
  </div>
</template>

<script setup lang="ts">
import type { EjercicioSet } from '../types'

const props = defineProps<{
  modelValue: EjercicioSet[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [sets: EjercicioSet[]]
}>()

function updatePeso(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  const newSets = [...props.modelValue]
  newSets[index] = { ...newSets[index], peso: target.value ? Number(target.value) : null }
  emit('update:modelValue', newSets)
}

function updateReps(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  const newSets = [...props.modelValue]
  newSets[index] = { ...newSets[index], reps: target.value ? Number(target.value) : null }
  emit('update:modelValue', newSets)
}

function addSet() {
  emit('update:modelValue', [...props.modelValue, { peso: null, reps: null }])
}

function removeSet(index: number) {
  const newSets = props.modelValue.filter((_: EjercicioSet, i: number) => i !== index)
  emit('update:modelValue', newSets)
}
</script>
