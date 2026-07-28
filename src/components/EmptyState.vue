<template>
  <div class="empty-state">
    <div class="empty-state-icon">
      <Icon :icon="icono" class="w-6 h-6 text-gym-blue" />
    </div>
    <p class="font-bold text-gym-gray-900 mb-1.5">{{ titulo }}</p>
    <p v-if="mensaje" class="text-sm text-gym-gray-500 leading-relaxed">{{ mensaje }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps({
  icono: { type: String, default: 'ph:info' },
  titulo: { type: String, required: true },
  mensaje: { type: String, default: '' }
})
</script>
