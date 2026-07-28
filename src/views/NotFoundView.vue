<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <div class="text-center px-4">
      <div class="w-20 h-20 bg-gym-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Icon icon="ph:magnifying-glass" class="w-10 h-10 text-gym-gray-400" />
      </div>
      <h1 class="text-3xl font-bold text-gym-gray-900 mb-2">404</h1>
      <p class="text-gym-gray-500 mb-8">No encontramos esta página</p>
      <router-link to="/" class="btn-primary inline-block">
        Volver al inicio
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
