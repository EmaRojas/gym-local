<template>
  <div class="flex items-center justify-center min-h-[70vh]">
    <div class="max-w-sm w-full">
      <div class="text-center mb-10">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" :class="iconBgClass">
          <Icon :icon="icono" class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gym-gray-900">{{ titulo }}</h1>
        <p v-if="subtitulo" class="text-sm text-gym-gray-500 mt-2 leading-relaxed">{{ subtitulo }}</p>
      </div>

      <div v-if="loading" class="card p-8 text-center">
        <Icon icon="ph:spinner" class="w-6 h-6 text-gym-blue mx-auto mb-3 animate-spin" />
        <p class="text-sm text-gym-gray-500">Cargando...</p>
      </div>

      <div v-else class="card p-6">
        <slot />

        <p v-if="error" role="alert" class="text-sm text-red-500 text-center mb-4 mt-4">{{ error }}</p>
        <button @click="$emit('submit')" :disabled="disabled || cargando" class="btn-primary w-full mt-4">
          {{ cargando ? textoCargando : textoBoton }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' },
  icono: { type: String, default: 'ph:barbell-fill' },
  iconBgClass: { type: String, default: 'bg-gym-blue' },
  error: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  cargando: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  textoBoton: { type: String, default: 'Ingresar' },
  textoCargando: { type: String, default: 'Buscando...' }
})

defineEmits(['submit'])
</script>
