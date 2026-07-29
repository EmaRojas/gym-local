<template>
  <div class="empty-state">
    <div class="empty-state-icon">
      <Icon :icon="icon" class="w-6 h-6 text-gym-blue" />
    </div>
    <p class="font-bold text-gym-gray-900 mb-1.5">{{ title }}</p>
    <p v-if="message" class="text-sm text-gym-gray-500 leading-relaxed">{{ message }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps({
  icon: { type: String, default: 'ph:info' },
  title: { type: String, required: true },
  message: { type: String, default: '' }
})
</script>
