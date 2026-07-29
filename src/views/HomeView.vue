<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <div class="max-w-sm w-full">
      <div class="text-center mb-12">
        <div class="w-20 h-20 bg-gym-blue rounded-[20px] flex items-center justify-center mx-auto mb-5 shadow-lg">
          <Icon icon="ph:barbell-fill" class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gym-gray-900">Gym App</h1>
        <p class="text-sm text-gym-gray-500 mt-2 leading-relaxed">Planes de entrenamiento personalizados</p>
      </div>

      <div class="space-y-4">
        <router-link to="/admin" class="card card-hover p-5 flex items-center gap-4 block group">
          <div class="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-active:bg-purple-200 transition-colors">
            <Icon icon="ph:shield-check-fill" class="w-7 h-7 text-purple-600" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-bold text-gym-gray-900 text-lg leading-tight">Panel Admin</h3>
            <p class="text-sm text-gym-gray-500 mt-0.5">Gestionar personas y planes</p>
          </div>
          <Icon icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
        </router-link>

        <router-link to="/student" class="card card-hover p-5 flex items-center gap-4 block group">
          <div class="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-active:bg-green-200 transition-colors">
            <Icon icon="ph:user-fill" class="w-7 h-7 text-green-600" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-bold text-gym-gray-900 text-lg leading-tight">Soy Alumno</h3>
            <p class="text-sm text-gym-gray-500 mt-0.5">Ver mis planes de entrenamiento</p>
          </div>
          <Icon icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'HomeView'
}
</script>
