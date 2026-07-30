<template>
  <div class="flex items-start gap-3 mb-6 lg:mb-8">
    <button @click="$emit('back')" class="btn-icon bg-gym-gray-100 mt-0.5" aria-label="Volver a personas">
      <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
    </button>
    <div class="flex-1 min-w-0">
      <h1 class="text-xl lg:text-2xl font-bold text-gym-gray-900 leading-tight truncate">{{ person?.name }} {{ person?.lastName }}</h1>
      <p class="text-sm text-gym-gray-500 mt-0.5">DNI: {{ person?.dni }}</p>
      <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
        <span v-if="person?.phone" class="text-xs text-gym-gray-500 flex items-center gap-1">
          <Icon icon="ph:phone" class="w-3.5 h-3.5" /> {{ person.phone }}
        </span>
        <span v-if="person?.address" class="text-xs text-gym-gray-500 flex items-center gap-1 truncate max-w-[200px] lg:max-w-none">
          <Icon icon="ph:map-pin" class="w-3.5 h-3.5" /> {{ person.address }}
        </span>
      </div>
    </div>
    <div class="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
      <button @click="$emit('edit')" class="btn-icon bg-gym-gray-100" aria-label="Editar datos">
        <Icon icon="ph:pencil" class="w-5 h-5 text-gym-gray-500" />
      </button>
      <button @click="$emit('delete')" class="btn-icon bg-red-50" :aria-label="`Eliminar a ${person?.name}`">
        <Icon icon="ph:trash" class="w-5 h-5 text-red-500" />
      </button>
    </div>
  </div>

  <div class="flex items-center justify-between mb-4 lg:mb-6">
    <h2 class="font-bold text-gym-gray-900 text-lg lg:text-xl">Planes asignados</h2>
    <button @click="$emit('new-plan')" class="btn-sm text-gym-blue flex items-center gap-1.5">
      <Icon icon="ph:plus" class="w-4 h-4" /> Nuevo plan
    </button>
  </div>

  <EmptyState v-if="plans.length === 0" icon="ph:list-checks" title="No tiene planes asignados" />

  <div v-else class="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
    <PlanCard
      v-for="plan in plans"
      :key="plan.id"
      :plan="plan"
      editable
      @edit="$emit('edit-plan', plan)"
      @delete="$emit('delete-plan', plan)"
    />
  </div>
</template>

<script lang="ts">
import PlanCard from '../../components/PlanCard.vue'
import EmptyState from '../../components/EmptyState.vue'

export default {
  name: 'PersonDetailView',
  components: { PlanCard, EmptyState },
  props: {
    person: { type: null as any, default: null },
    plans: { type: Array as () => import('../../types').Plan[], default: () => [] }
  },
  emits: ['back', 'edit', 'delete', 'new-plan', 'edit-plan', 'delete-plan']
}
</script>
