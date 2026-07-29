<template>
  <div class="space-y-2.5">
    <div v-for="(set, j) in modelValue" :key="j" class="flex items-center gap-2.5" :class="readonly ? 'bg-gym-gray-50 rounded-xl p-3' : ''">
      <span class="text-xs font-bold text-gym-gray-400 w-9 flex-shrink-0 tabular-nums">S{{ j + 1 }}</span>
      <template v-if="readonly">
        <div class="flex-1 flex items-center gap-2 justify-center">
          <span class="text-sm font-bold text-gym-gray-900 tabular-nums">{{ set.weight || '-' }} <span class="text-xs font-normal text-gym-gray-400">kg</span></span>
          <span class="text-xs text-gym-gray-300">&times;</span>
          <span v-if="set.seconds != null" class="text-sm font-bold text-gym-gray-900 tabular-nums">{{ set.seconds }}<span class="text-xs font-normal text-gym-gray-400">s</span></span>
          <span v-else class="text-sm font-bold text-gym-gray-900 tabular-nums">{{ set.reps || '-' }} <span class="text-xs font-normal text-gym-gray-400">reps</span></span>
        </div>
      </template>
      <template v-else>
        <div class="flex-1 flex flex-col gap-1">
          <label class="text-[11px] font-medium text-gym-gray-500 px-1">Peso</label>
          <input :value="set.weight" @input="updateWeight(j, $event)" type="number" inputmode="decimal" class="input-field-sm text-center tabular-nums" placeholder="kg" style="font-size: 16px" :aria-label="`Peso serie ${j + 1}`" />
        </div>
        <div class="flex-1 flex flex-col gap-1">
          <div class="flex items-center gap-1.5">
            <button @click="toggleMode(j)" class="text-[11px] font-medium px-1.5 py-0.5 rounded transition-colors"
              :class="set.seconds != null ? 'bg-gym-blue text-white' : 'bg-gym-gray-200 text-gym-gray-600'">seg</button>
            <button @click="toggleMode(j)" class="text-[11px] font-medium px-1.5 py-0.5 rounded transition-colors"
              :class="set.seconds == null ? 'bg-gym-blue text-white' : 'bg-gym-gray-200 text-gym-gray-600'">reps</button>
          </div>
          <input v-if="set.seconds != null" :value="set.seconds" @input="updateSeconds(j, $event)" type="number" inputmode="numeric" class="input-field-sm text-center tabular-nums" placeholder="seg" style="font-size: 16px" :aria-label="`Segundos serie ${j + 1}`" />
          <input v-else :value="set.reps" @input="updateReps(j, $event)" type="number" inputmode="numeric" class="input-field-sm text-center tabular-nums" placeholder="reps" style="font-size: 16px" :aria-label="`Repeticiones serie ${j + 1}`" />
        </div>
        <button @click="removeSet(j)" class="btn-icon bg-gym-gray-100 text-gym-gray-400 hover:bg-red-50 hover:text-red-500 mt-4" :aria-label="`Eliminar serie ${j + 1}`">
          <Icon icon="ph:x" class="w-4 h-4" />
        </button>
      </template>
    </div>
    <button v-if="!readonly" @click="addSet" class="btn-secondary w-full mt-2 flex items-center justify-center gap-1.5" aria-label="Agregar nueva serie">
      <Icon icon="ph:plus" class="w-4 h-4" /> Agregar serie
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ExerciseSet } from '../types'

const props = defineProps<{
  modelValue: ExerciseSet[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [sets: ExerciseSet[]]
}>()

function updateWeight(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  const newSets = [...props.modelValue]
  newSets[index] = { ...newSets[index], weight: target.value ? Number(target.value) : null }
  emit('update:modelValue', newSets)
}

function updateReps(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  const newSets = [...props.modelValue]
  newSets[index] = { ...newSets[index], reps: target.value ? Number(target.value) : null }
  emit('update:modelValue', newSets)
}

function updateSeconds(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  const newSets = [...props.modelValue]
  newSets[index] = { ...newSets[index], seconds: target.value ? Number(target.value) : null }
  emit('update:modelValue', newSets)
}

function toggleMode(index: number) {
  const set = props.modelValue[index]
  const newSets = [...props.modelValue]
  if (set.seconds != null) {
    newSets[index] = { ...set, seconds: null, reps: null }
  } else {
    newSets[index] = { ...set, reps: null, seconds: null }
  }
  emit('update:modelValue', newSets)
}

function addSet() {
  emit('update:modelValue', [...props.modelValue, { weight: null, reps: null, seconds: null }])
}

function removeSet(index: number) {
  const newSets = props.modelValue.filter((_: ExerciseSet, i: number) => i !== index)
  emit('update:modelValue', newSets)
}
</script>
