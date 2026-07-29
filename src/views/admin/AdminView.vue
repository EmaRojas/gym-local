<template>
  <div>
    <!-- LOGIN ADMIN -->
    <LoginCard
      v-if="!isLoggedIn"
      title="Panel Admin"
      subtitle="Ingresá tu usuario y contraseña"
      icon="ph:shield-check"
      icon-bg-class="bg-gym-gray-800"
      :error="loginError"
      :isSaving="loginSaving"
      :disabled="!loginUser.trim() || !loginPass.trim()"
      button-text="Ingresar"
      loading-text="Entrando..."
      @submit="loginAdmin"
    >
      <div class="mb-4">
        <label for="admin-usuario" class="label-field">Usuario</label>
        <input id="admin-usuario" v-model="loginUser" type="text" class="input-field" placeholder="Usuario" @keyup.enter="loginAdmin" autocomplete="username" />
      </div>
      <div class="mb-2">
        <label for="admin-password" class="label-field">Contraseña</label>
        <input id="admin-password" v-model="loginPass" type="password" class="input-field" placeholder="Contraseña" @keyup.enter="loginAdmin" autocomplete="current-password" />
      </div>
    </LoginCard>

    <!-- PANEL ADMIN (requiere login) -->
    <template v-if="isLoggedIn">
    <!-- LISTA DE PERSONAS -->
    <template v-if="currentView === 'lista'">
      <div class="flex items-center gap-3 mb-5">
        <button @click="$router.push('/')" class="btn-icon bg-gym-gray-100" aria-label="Volver al inicio">
          <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-gym-gray-900 leading-tight">Personas</h1>
          <p class="text-sm text-gym-gray-500 mt-0.5 tabular-nums">{{ persons.length }} personas</p>
        </div>
        <button @click="logoutAdmin" class="btn-icon bg-gym-gray-200" aria-label="Cerrar sesión">
          <Icon icon="ph:sign-out" class="w-5 h-5 text-gym-gray-600" />
        </button>
      </div>

      <button @click="newPerson" class="card card-hover p-4 flex items-center gap-3.5 mb-4 w-full">
        <div class="w-12 h-12 bg-gym-blue rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon icon="ph:plus" class="w-6 h-6 text-white" />
        </div>
        <div class="min-w-0 flex-1 text-left">
          <h3 class="font-bold text-gym-gray-900 leading-tight">Nueva persona</h3>
          <p class="text-xs text-gym-gray-500 mt-0.5">Cargá los datos de un alumno</p>
        </div>
        <Icon icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
      </button>

      <button @click="currentView = 'custom-exercises'" class="card card-hover p-4 flex items-center gap-3.5 mb-4 w-full">
        <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon icon="ph:barbell" class="w-6 h-6 text-white" />
        </div>
        <div class="min-w-0 flex-1 text-left">
          <h3 class="font-bold text-gym-gray-900 leading-tight">Ejercicios personalizados</h3>
          <p class="text-xs text-gym-gray-500 mt-0.5">Creá y gestioná tus propios ejercicios</p>
        </div>
        <Icon icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
      </button>

      <div class="mb-4">
        <label for="search-persons" class="sr-only">Buscar personas</label>
        <input id="search-persons" v-model="searchQuery" type="text" class="input-field" placeholder="Buscar por nombre o DNI..." />
      </div>

      <div v-if="loadingData" class="text-center py-12">
        <Icon icon="ph:spinner" class="w-8 h-8 text-gym-blue mx-auto mb-3 animate-spin" />
        <p class="text-sm text-gym-gray-400">Cargando datos...</p>
      </div>
      <EmptyState v-else-if="filteredPersons.length === 0" icon="ph:users" title="No hay personas cargadas" />

      <div v-else class="space-y-3">
        <PersonCard
          v-for="p in filteredPersons"
          :key="p.firebaseId"
          :person="p"
          :plan-count="plansFor(p.firebaseId!).length"
          @click="viewPerson(p)"
        />
      </div>
    </template>

      <!-- CREAR / EDITAR PERSONA -->
    <template v-if="currentView === 'person-form'">
      <div class="flex items-center gap-3 mb-5">
        <button @click="currentView = personForm.firebaseId ? 'person-detail' : 'lista'" class="btn-icon bg-gym-gray-100" aria-label="Volver">
          <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <div class="min-w-0">
          <h1 class="text-xl font-bold text-gym-gray-900 leading-tight">{{ personForm.firebaseId ? 'Editar persona' : 'Nueva persona' }}</h1>
          <p class="text-sm text-gym-gray-500 mt-0.5">Completá los datos del alumno</p>
        </div>
      </div>

      <div class="card p-5 space-y-5">
        <div>
          <label for="person-name" class="label-field">Nombre *</label>
          <input id="person-name" v-model="personForm.name" type="text" class="input-field" :class="personSubmitted && !personForm.name.trim() ? 'border-red-400 bg-red-50' : ''" placeholder="Nombre" autocomplete="given-name" />
          <p v-if="personSubmitted && !personForm.name.trim()" class="error-text" role="alert">
            <Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Dato obligatorio
          </p>
        </div>
        <div>
          <label for="person-lastname" class="label-field">Apellido *</label>
          <input id="person-lastname" v-model="personForm.lastName" type="text" class="input-field" :class="personSubmitted && !personForm.lastName.trim() ? 'border-red-400 bg-red-50' : ''" placeholder="Apellido" autocomplete="family-name" />
          <p v-if="personSubmitted && !personForm.lastName.trim()" class="error-text" role="alert">
            <Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Dato obligatorio
          </p>
        </div>
        <div>
          <label for="person-dni" class="label-field">DNI *</label>
          <input
            id="person-dni"
            v-model="personForm.dni"
            type="text"
            inputmode="numeric"
            class="input-field"
            :class="personSubmitted && (!personForm.dni.trim() || isIdDuplicate) ? 'border-red-400 bg-red-50' : ''"
            placeholder="12345678"
            maxlength="10"
            @input="personForm.dni = personForm.dni.replace(/[^0-9]/g, '')"
            autocomplete="off"
          />
          <p v-if="personSubmitted && !personForm.dni.trim()" class="error-text" role="alert">
            <Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Dato obligatorio
          </p>
          <p v-else-if="personSubmitted && isIdDuplicate" class="error-text" role="alert">
            <Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Ya existe una persona con ese DNI
          </p>
        </div>
        <div>
          <label for="person-address" class="label-field">Dirección <span class="font-normal text-gym-gray-400">(opcional)</span></label>
          <input id="person-address" v-model="personForm.address" type="text" class="input-field" placeholder="Calle 123" autocomplete="street-address" />
        </div>
        <div>
          <label for="person-phone" class="label-field">Teléfono <span class="font-normal text-gym-gray-400">(opcional)</span></label>
          <input id="person-phone" v-model="personForm.phone" type="tel" class="input-field" placeholder="11-1234-5678" autocomplete="tel" />
        </div>
      </div>

      <div class="mt-6 safe-bottom">
        <button @click="savePerson" :disabled="isSaving" class="btn-primary w-full">
          {{ isSaving ? 'Guardando...' : personForm.firebaseId ? 'Guardar cambios' : 'Crear persona' }}
        </button>
      </div>
    </template>

    <!-- DETALLE DE PERSONA + PLANES -->
    <template v-if="currentView === 'person-detail'">
      <div class="flex items-start gap-3 mb-5">
        <button @click="currentView = 'lista'" class="btn-icon bg-gym-gray-100 mt-0.5" aria-label="Volver a personas">
          <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-gym-gray-900 leading-tight truncate">{{ selectedPerson?.name }} {{ selectedPerson?.lastName }}</h1>
          <p class="text-sm text-gym-gray-500 mt-0.5">DNI: {{ selectedPerson?.dni }}</p>
          <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
            <span v-if="selectedPerson?.phone" class="text-xs text-gym-gray-500 flex items-center gap-1">
              <Icon icon="ph:phone" class="w-3.5 h-3.5" /> {{ selectedPerson.phone }}
            </span>
            <span v-if="selectedPerson?.address" class="text-xs text-gym-gray-500 flex items-center gap-1 truncate max-w-[200px]">
              <Icon icon="ph:map-pin" class="w-3.5 h-3.5" /> {{ selectedPerson.address }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          <button @click="editPerson" class="btn-icon bg-gym-gray-100" aria-label="Editar datos">
            <Icon icon="ph:pencil" class="w-5 h-5 text-gym-gray-500" />
          </button>
          <button @click="showConfirmPerson = true" class="btn-icon bg-red-50" :aria-label="`Eliminar a ${selectedPerson?.name}`">
            <Icon icon="ph:trash" class="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-gym-gray-900">Planes asignados</h2>
        <button @click="newPlan" class="btn-sm text-gym-blue flex items-center gap-1.5">
          <Icon icon="ph:plus" class="w-4 h-4" /> Nuevo plan
        </button>
      </div>

      <EmptyState v-if="personPlans.length === 0" icon="ph:list-checks" title="No tiene planes asignados" />

      <div v-else class="space-y-3">
        <PlanCard
          v-for="plan in personPlans"
          :key="plan.firebaseId"
          :plan="plan"
          editable
          @edit="editPlan"
          @delete="deletePlan"
        />
      </div>
    </template>

    <!-- CREAR / EDITAR PLAN -->
    <template v-if="currentView === 'plan-form'">
      <div class="flex items-center gap-3 mb-5">
        <button @click="currentView = 'person-detail'" class="btn-icon bg-gym-gray-100" aria-label="Volver">
          <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-gym-gray-900 leading-tight">{{ planForm.firebaseId ? 'Editar plan' : 'Nuevo plan' }}</h1>
          <p class="text-sm text-gym-gray-500 mt-0.5 truncate">Para: {{ selectedPerson?.name }} {{ selectedPerson?.lastName }}</p>
        </div>
      </div>

      <div class="card p-5 mb-4">
        <label for="plan-nombre" class="label-field">Nombre del plan</label>
        <input id="plan-nombre" v-model="planForm.name" type="text" class="input-field" placeholder="Ej: Torso, Fuerza, etc." />
      </div>

      <button @click="showBrowser = true" class="card card-hover p-4 flex items-center gap-3 mb-4 w-full">
        <div class="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon icon="ph:magnifying-glass" class="w-5 h-5 text-green-600" />
        </div>
        <div class="flex-1 text-left min-w-0">
          <span class="font-semibold text-gym-gray-700 leading-tight block">Buscar ejercicio del catálogo</span>
          <p class="text-xs text-gym-gray-500 mt-0.5 tabular-nums">{{ planForm.datasetExercises.length }} seleccionados</p>
        </div>
        <Icon icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
      </button>

      <div v-if="planForm.datasetExercises.length === 0 && planForm.manualExercises.length === 0" class="text-center text-sm text-gym-gray-400 mb-4 py-2">
        Agregá ejercicios del catálogo o manualmente
      </div>

      <div v-if="planForm.datasetExercises.length > 0" class="mb-5">
        <h3 class="text-sm font-semibold text-gym-gray-700 mb-2.5">Del catálogo ({{ planForm.datasetExercises.length }})</h3>
        <div class="space-y-3">
          <div v-for="(ej, i) in planForm.datasetExercises" :key="ej.id" class="card p-4">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-gym-gray-100">
                <img v-if="ej.gifUrl" :src="getImgUrl(ej.gifUrl)" :alt="ej.name" class="w-full h-full object-cover" />
                <img v-else-if="ej.image" :src="ej.image" :alt="ej.name" class="w-full h-full object-cover" />
                <Icon v-else icon="ph:barbell" class="w-5 h-5 text-gym-gray-400" />
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="text-sm font-semibold text-gym-gray-900 truncate leading-tight">{{ translateName(ej.name) }}</h4>
                <p class="text-xs text-gym-gray-500 mt-0.5">{{ translateCategory(ej.category) }}</p>
              </div>
              <button @click="planForm.datasetExercises.splice(i, 1)" class="btn-icon bg-gym-gray-100" :aria-label="`Quitar ${translateName(ej.name)}`">
                <Icon icon="ph:x" class="w-5 h-5 text-gym-gray-400" />
              </button>
            </div>
            <div class="mt-3">
              <ExerciseSetEditor v-model="ej.sets" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="planForm.manualExercises.length > 0" class="mb-5">
        <h3 class="text-sm font-semibold text-gym-gray-700 mb-2.5">Manuales ({{ planForm.manualExercises.length }})</h3>
        <div class="space-y-3">
          <div v-for="(ej, i) in planForm.manualExercises" :key="i" class="card p-4">
            <div class="flex items-center gap-3 mb-3">
              <div class="flex-1">
                <label :for="`manual-nombre-${i}`" class="sr-only">Nombre del ejercicio manual</label>
                <input :id="`manual-nombre-${i}`" v-model="ej.name" type="text" class="input-field" placeholder="Nombre del ejercicio" />
              </div>
              <button @click="planForm.manualExercises.splice(i, 1)" class="btn-icon bg-gym-gray-100 flex-shrink-0" :aria-label="`Quitar ejercicio ${i + 1}`">
                <Icon icon="ph:x" class="w-5 h-5 text-gym-gray-400" />
              </button>
            </div>
            <div class="mb-3">
              <label :for="`manual-grupo-${i}`" class="sr-only">Grupo muscular</label>
              <input :id="`manual-grupo-${i}`" v-model="ej.muscleGroup" type="text" class="input-field" placeholder="Grupo muscular" />
            </div>
            <ExerciseSetEditor v-model="ej.sets" />
          </div>
        </div>
      </div>

      <button @click="addManualExercise" class="card card-hover p-4 flex items-center gap-3 mb-5 w-full">
        <div class="w-11 h-11 bg-gym-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon icon="ph:plus" class="w-5 h-5 text-gym-blue" />
        </div>
        <span class="font-semibold text-gym-gray-700">Agregar ejercicio manual</span>
      </button>

      <p v-if="!isPlanValid && planSubmitted" class="text-sm text-red-500 font-medium text-center mb-4" role="alert">{{ planValidationMessage }}</p>
      <p v-if="planError" class="text-sm text-red-500 font-medium text-center mb-4" role="alert">{{ planError }}</p>

      <div class="safe-bottom">
        <button @click="savePlan" :disabled="isSaving || !isPlanValid" class="btn-primary w-full mb-4">
          {{ isSaving ? 'Guardando...' : planForm.firebaseId ? 'Guardar cambios' : 'Asignar plan' }}
        </button>
      </div>

      <!-- Modal buscador -->
      <div v-if="showBrowser" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4" @keydown.window.escape="showBrowser = false" role="dialog" aria-modal="true" aria-label="Buscar ejercicio">
        <div class="absolute inset-0 bg-black/40" @click="showBrowser = false"></div>
        <div class="relative bg-white w-full sm:max-w-lg max-h-[85dvh] sm:max-h-[75vh] flex flex-col min-h-0 shadow-2xl px-4 pt-3 pb-4 safe-bottom rounded-t-3xl sm:rounded-2xl">
          <div class="w-10 h-1 bg-gym-gray-300 rounded-full mx-auto mb-3 flex-shrink-0 sm:hidden" aria-hidden="true"></div>
          <ExercisesBrowser
            :seleccionados="planForm.datasetExercises"
            :admin-id="adminStore.adminId || ''"
            @select="onExerciseSelected"
            @back="showBrowser = false"
          />
        </div>
      </div>
    </template>

      <!-- EJERCICIOS PERSONALIZADOS -->
      <template v-if="currentView === 'custom-exercises'">
        <div class="flex items-center gap-3 mb-5">
          <button @click="currentView = 'lista'" class="btn-icon bg-gym-gray-100" aria-label="Volver">
            <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
          </button>
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-gym-gray-900 leading-tight">Ejercicios personalizados</h1>
            <p class="text-sm text-gym-gray-500 mt-0.5 tabular-nums">{{ customExercises.length }} ejercicios</p>
          </div>
        </div>

        <button @click="newCustomExercise" class="card card-hover p-4 flex items-center gap-3.5 mb-4 w-full">
          <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon icon="ph:plus" class="w-6 h-6 text-white" />
          </div>
          <div class="min-w-0 flex-1 text-left">
            <h3 class="font-bold text-gym-gray-900 leading-tight">Nuevo ejercicio</h3>
            <p class="text-xs text-gym-gray-500 mt-0.5">Grabá un GIF y creá tu propio ejercicio</p>
          </div>
          <Icon icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
        </button>

        <div v-if="loadingCustom" class="text-center py-12">
          <Icon icon="ph:spinner" class="w-8 h-8 text-gym-blue mx-auto mb-3 animate-spin" />
          <p class="text-sm text-gym-gray-400">Cargando ejercicios personalizados...</p>
        </div>
        <div v-else-if="customExercises.length === 0">
          <EmptyState icon="ph:barbell" title="No tenés ejercicios personalizados" />
        </div>

        <div v-else class="space-y-3">
          <div v-for="ej in customExercises" :key="ej.id" class="card p-4">
            <div class="flex items-center gap-3">
              <div class="w-14 h-14 rounded-xl overflow-hidden bg-gym-gray-100 flex-shrink-0">
                <video v-if="ej.videoBase64" :src="ej.videoBase64" :playbackRate="0.5" autoplay muted loop playsinline class="w-full h-full object-cover" />
                <img v-else-if="ej.image" :src="ej.image" :alt="ej.name" class="w-full h-full object-cover" loading="lazy" />
                <Icon v-else icon="ph:barbell" class="w-5 h-5 text-gym-gray-400 m-auto" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="font-bold text-gym-gray-900 truncate leading-tight">{{ ej.name }}</h3>
                <p class="text-xs text-gym-gray-500 mt-0.5 truncate">{{ ej.category }}{{ ej.muscleGroup ? ' - ' + ej.muscleGroup : '' }}</p>
              </div>
              <div class="flex items-center gap-1.5">
                <button @click="editCustomExercise(ej)" class="btn-icon bg-gym-blue-100 flex-shrink-0" :aria-label="`Editar ${ej.name}`">
                  <Icon icon="ph:pencil" class="w-5 h-5 text-gym-blue" />
                </button>
                <button @click="confirmDeleteCustom(ej)" class="btn-icon bg-red-50 flex-shrink-0" :aria-label="`Eliminar ${ej.name}`">
                  <Icon icon="ph:trash" class="w-5 h-5 text-red-500" />
                </button>
              </div>
            </div>
            <p v-if="ej.instructions?.es" class="text-xs text-gym-gray-500 mt-2 line-clamp-2">{{ ej.instructions.es }}</p>
          </div>
        </div>
      </template>

      <!-- CREAR EJERCICIO PERSONALIZADO -->
      <template v-if="currentView === 'custom-exercise-form'">
        <div class="flex items-center gap-3 mb-5">
          <button @click="currentView = 'custom-exercises'" class="btn-icon bg-gym-gray-100" aria-label="Volver">
            <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
          </button>
          <div class="min-w-0">
            <h1 class="text-xl font-bold text-gym-gray-900 leading-tight">{{ editingId ? 'Editar ejercicio' : 'Nuevo ejercicio' }}</h1>
            <p class="text-sm text-gym-gray-500 mt-0.5">{{ editingId ? 'Actualizá los datos del ejercicio' : 'Grabá el GIF y completá los datos' }}</p>
          </div>
        </div>

        <div class="card p-5 space-y-5">
          <div>
            <label for="custom-nombre" class="label-field">Nombre del ejercicio <span class="text-red-500">*</span></label>
            <input id="custom-nombre" v-model="customForm.name" type="text" class="input-field" :class="customSubmitted && !customForm.name.trim() ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''" placeholder="Ej: Sentadilla con salto" />
            <p v-if="customSubmitted && !customForm.name.trim()" class="error-text"><Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> El nombre es obligatorio</p>
          </div>
          <div>
            <label for="custom-categoria" class="label-field">Categoría <span class="text-red-500">*</span></label>
            <select id="custom-categoria" v-model="customForm.category" class="select-field" style="font-size: 16px" :class="customSubmitted && !customForm.category.trim() ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''">
              <option value="">Seleccionar...</option>
              <option v-for="c in categoryOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
            <p v-if="customSubmitted && !customForm.category.trim()" class="error-text"><Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> La categoría es obligatoria</p>
          </div>
          <div>
            <label for="custom-grupo" class="label-field">Grupo muscular <span class="text-red-500">*</span></label>
            <select id="custom-grupo" v-model="customForm.muscleGroup" class="select-field" style="font-size: 16px" :class="customSubmitted && !customForm.muscleGroup.trim() ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''">
              <option value="">Seleccionar...</option>
              <option v-for="g in muscleGroupOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
            </select>
            <p v-if="customSubmitted && !customForm.muscleGroup.trim()" class="error-text"><Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> El grupo muscular es obligatorio</p>
          </div>
          <div>
            <label for="custom-equipo" class="label-field">Equipamiento <span class="font-normal text-gym-gray-400">(opcional)</span></label>
            <input id="custom-equipo" v-model="customForm.equipment" type="text" class="input-field" placeholder="Ej: barra, mancuernas, bodyweight..." />
          </div>
          <div>
            <label for="custom-instrucciones" class="label-field">Instrucciones <span class="font-normal text-gym-gray-400">(opcional)</span></label>
            <textarea id="custom-instrucciones" v-model="customForm.instructions" class="input-field min-h-[80px]" placeholder="Describí cómo se realiza el ejercicio..." />
          </div>
        </div>

        <div class="card p-5 mt-5">
          <h3 class="font-bold text-gym-gray-900 mb-4">
            {{ editingId ? 'Video del ejercicio' : 'Grabar GIF del ejercicio' }}
            <span v-if="!editingId" class="text-red-500">*</span>
          </h3>
          <template v-if="editingId && videoReady">
            <div class="bg-black rounded-xl overflow-hidden">
              <video :src="videoReady" :playbackRate="0.5" autoplay muted loop playsinline class="w-full aspect-[4/3] object-contain max-h-[300px]" />
            </div>
            <p class="text-xs text-gym-gray-400 mt-2">El video no se puede modificar</p>
          </template>
          <template v-else>
            <GifRecorder @media-ready="onMediaReady" ref="gifRecorderRef" />
            <p v-if="customSubmitted && !videoReady" class="error-text mt-2"><Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Grabá o subí un video del ejercicio</p>
          </template>
        </div>

        <p v-if="customError" class="text-sm text-red-500 font-medium text-center mt-4" role="alert">{{ customError }}</p>

        <div class="mt-6 safe-bottom">
          <button @click="saveCustomExercise" :disabled="isSaving || !isCustomValid" class="btn-primary w-full">
            {{ isSaving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar ejercicio' }}
          </button>
        </div>
      </template>
    </template>

    <!-- Confirm sheets -->
    <ConfirmSheet
      :visible="showConfirmPerson"
      title="Eliminar persona"
      :message="`¿Eliminar a ${selectedPerson?.name} ${selectedPerson?.lastName} y todos sus planes?`"
      confirm-text="Eliminar"
      variant="danger"
      @confirm="confirmDeletePerson"
      @cancel="showConfirmPerson = false"
    />

    <ConfirmSheet
      :visible="showConfirmPlan"
      title="Eliminar plan"
      message="¿Eliminar este plan? Esta acción no se puede deshacer."
      confirm-text="Eliminar"
      variant="danger"
      @confirm="confirmDeletePlan"
      @cancel="showConfirmPlan = false"
    />

    <ConfirmSheet
      :visible="showConfirmCustom"
      title="Eliminar ejercicio"
      message="Este ejercicio está asignado a uno o más planes. Se eliminará de todos ellos. ¿Continuar?"
      confirm-text="Eliminar de todo"
      variant="danger"
      :loading="deletingCustom"
      @confirm="confirmDeleteCustomExercise"
      @cancel="showConfirmCustom = false"
    />
  </div>
</template>

<script lang="ts">
import dbFirebase, { doc, setDoc, deleteDoc, updateDoc, collection, addDoc, getDocs, query, where } from '../../db'
import { useAdminStore } from '../../stores/admin'
import { useExercises, translateName, translateCategory, translateMuscleGroup } from '../../composables/useExercises'
import { defineAsyncComponent } from 'vue'
import LoginCard from '../../components/LoginCard.vue'
import PersonCard from '../../components/PersonCard.vue'
import PlanCard from '../../components/PlanCard.vue'
import ExerciseSetEditor from '../../components/ExerciseSetEditor.vue'
import ConfirmSheet from '../../components/ConfirmSheet.vue'
import EmptyState from '../../components/EmptyState.vue'
import GifRecorder from '../../components/GifRecorder.vue'
import type { Person, Plan, Exercise, ExerciseSet } from '../../types'

const ExercisesBrowser = defineAsyncComponent(() => import('../ExercisesBrowserView.vue'))

interface PersonForm {
  firebaseId: string | null
  name: string
  lastName: string
  dni: string
  address: string
  phone: string
}

interface ExerciseDataset extends Exercise {
  sets: ExerciseSet[]
}

interface ManualExercise {
  name: string
  muscleGroup: string
  sets: ExerciseSet[]
}

interface PlanForm {
  firebaseId: string | null
  name: string
  datasetExercises: ExerciseDataset[]
  manualExercises: ManualExercise[]
}

export default {
  name: 'AdminView',
  components: { ExercisesBrowser, LoginCard, PersonCard, PlanCard, ExerciseSetEditor, ConfirmSheet, EmptyState, GifRecorder },
  data() {
    return {
      loginUser: '',
      loginPass: '',
      loginError: '',
      loginSaving: false,
      isLoggedIn: false,
      currentView: 'lista' as string,
      searchQuery: '',
      persons: [] as Person[],
      plans: [] as Plan[],
      selectedPerson: null as Person | null,
      personForm: { firebaseId: null, name: '', lastName: '', dni: '', address: '', phone: '' } as PersonForm,
      planForm: { firebaseId: null, name: '', datasetExercises: [], manualExercises: [] } as PlanForm,
      showBrowser: false,
      isSaving: false,
      personSubmitted: false,
      planSubmitted: false,
      planError: '',
      showConfirmPerson: false,
      showConfirmPlan: false,
      planToDelete: null as Plan | null,
      customExercises: [] as Exercise[],
      customForm: { name: '', category: '', muscleGroup: '', equipment: '', instructions: '' },
      customError: '',
      customSubmitted: false,
      videoReady: null as string | null,
      thumbnailReady: null as string | null,
      loadingCustom: false,
      loadingData: true,
      editingId: null as string | null,
      showConfirmCustom: false,
      customExerciseToDelete: null as Exercise | null,
      deletingCustom: false
    }
  },
  computed: {
    adminStore() { return useAdminStore() },
    filteredPersons(): Person[] {
      if (!this.searchQuery.trim()) return this.sortPersons(this.persons)
      const q = this.searchQuery.toLowerCase()
      return this.sortPersons(this.persons).filter(p =>
        `${p.name} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.dni || '').includes(q)
      )
    },
    personPlans(): Plan[] {
      if (!this.selectedPerson) return []
      return this.plans.filter(p => p.personId === this.selectedPerson!.firebaseId)
    },
    isPersonValid(): boolean {
      return !!(this.personForm.name.trim() && this.personForm.lastName.trim() && this.personForm.dni.trim()) && !this.isIdDuplicate
    },
    isIdDuplicate(): boolean {
      if (!this.personForm.dni.trim()) return false
      return this.persons.some(p => p.dni === this.personForm.dni.trim() && p.firebaseId !== this.personForm.firebaseId)
    },
    isPlanValid(): boolean {
      const tiene = this.planForm.datasetExercises.length > 0 || this.planForm.manualExercises.length > 0
      return !!(this.planForm.name.trim()) && tiene
    },
    planValidationMessage(): string {
      const tiene = this.planForm.datasetExercises.length > 0 || this.planForm.manualExercises.length > 0
      if (!this.planForm.name.trim() && !tiene) return 'Ponle un nombre y agregá ejercicios'
      if (!this.planForm.name.trim()) return 'Ponle un nombre al plan'
      if (!tiene) return 'Agregá al menos un ejercicio'
      return ''
    },
    isCustomValid(): boolean {
      return !!(this.customForm.name.trim()) &&
        !!(this.customForm.category.trim()) &&
        !!(this.customForm.muscleGroup.trim()) &&
        !!this.videoReady
    },
    categoryOptions(): { value: string; label: string }[] {
      const { exercises } = useExercises()
      const cats = [...new Set(exercises.value.map(e => e.category))]
      return cats.sort().map(c => ({ value: c, label: translateCategory(c) }))
    },
    muscleGroupOptions(): { value: string; label: string }[] {
      const { exercises } = useExercises()
      const groups = [...new Set(exercises.value.map(e => e.muscleGroup))]
      return groups.sort().map(g => ({ value: g, label: translateMuscleGroup(g) }))
    }
  },
  methods: {
    translateName,
    translateCategory,
    getImgUrl(path: string): string { return `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${path}` },
    sortPersons(lista: Person[]): Person[] {
      return [...lista].sort((a, b) => {
        return ((a.lastName || '') + (a.name || '')).localeCompare((b.lastName || '') + (b.name || ''))
      })
    },
    plansFor(id: string): Plan[] { return this.plans.filter(p => p.personId === id) },
    async loadData() {
      this.loadingData = true
      const adminId = this.adminStore.adminId || ''
      try {
        const qPersons = query(collection(dbFirebase, 'persons'), where('adminId', '==', adminId))
        const snapPersons = await getDocs(qPersons)
        this.persons = snapPersons.docs.map(d => ({ firebaseId: d.id, ...d.data() })) as Person[]
      } catch {
        this.persons = []
      }
      try {
        const qPlans = query(collection(dbFirebase, 'plans'), where('adminId', '==', adminId))
        const snapPlans = await getDocs(qPlans)
        this.plans = snapPlans.docs.map(d => ({ firebaseId: d.id, ...d.data() })) as Plan[]
      } catch {
        this.plans = []
      }
      this.loadingData = false
    },

    async loginAdmin() {
      if (!this.loginUser.trim() || !this.loginPass.trim()) return
      this.loginSaving = true
      this.loginError = ''
      const ok = await this.adminStore.login(this.loginUser.trim(), this.loginPass)
      this.loginSaving = false
      if (!ok) {
        this.loginError = this.adminStore.error || ''
        return
      }
      this.isLoggedIn = true
      await this.loadData()
      await this.loadCustomExercises()
      await useExercises().loadExercises(this.adminStore.adminId || undefined)
    },
    logoutAdmin() {
      this.adminStore.logout()
      this.isLoggedIn = false
      this.persons = []
      this.plans = []
      this.currentView = 'lista'
      this.loginUser = ''
      this.loginPass = ''
    },

    newPerson() {
      this.personForm = { firebaseId: null, name: '', lastName: '', dni: '', address: '', phone: '' }
      this.personSubmitted = false
      this.currentView = 'person-form'
    },
    viewPerson(person: Person) {
      this.selectedPerson = person
      this.currentView = 'person-detail'
    },
    editPerson() {
      if (this.selectedPerson) {
        this.personForm = { firebaseId: this.selectedPerson.firebaseId || null, name: this.selectedPerson.name, lastName: this.selectedPerson.lastName, dni: this.selectedPerson.dni, address: this.selectedPerson.address || '', phone: this.selectedPerson.phone || '' }
      }
      this.personSubmitted = false
      this.currentView = 'person-form'
    },
    async savePerson() {
      this.personSubmitted = true
      if (!this.isPersonValid) return
      this.isSaving = true
      try {
        const { firebaseId, ...rest } = this.personForm
        const now = new Date().toISOString()

        if (firebaseId) {
          await setDoc(doc(dbFirebase, 'persons', firebaseId), {
            ...rest, adminId: this.adminStore.adminId, updatedAt: now
          })
        } else {
          const ref = doc(collection(dbFirebase, 'persons'))
          await setDoc(ref, { ...rest, adminId: this.adminStore.adminId, createdAt: now, updatedAt: now })
        }
        await this.loadData()
        if (this.personForm.firebaseId) {
          this.selectedPerson = this.persons.find(p => p.firebaseId === this.personForm.firebaseId) || null
          this.currentView = 'person-detail'
        } else {
          this.currentView = 'lista'
        }
      } catch (e) { console.error(e) } finally { this.isSaving = false }
    },
    async confirmDeletePerson() {
      this.showConfirmPerson = false
      if (!this.selectedPerson || !this.selectedPerson.firebaseId) return
      try {
        const plansQuery = query(collection(dbFirebase, 'plans'), where('personId', '==', this.selectedPerson.firebaseId))
        const plansSnap = await getDocs(plansQuery)
        for (const p of plansSnap.docs) {
          await deleteDoc(doc(dbFirebase, 'plans', p.id))
        }
        await deleteDoc(doc(dbFirebase, 'persons', this.selectedPerson.firebaseId))
      } catch (e) { console.error(e) }
      await this.loadData()
      this.currentView = 'lista'
    },

    newPlan() {
      this.planForm = { firebaseId: null, name: '', datasetExercises: [], manualExercises: [] }
      this.planSubmitted = false
      this.planError = ''
      this.currentView = 'plan-form'
    },
    editPlan(plan: Plan) {
      const { exercises } = useExercises()
      const dataset: ExerciseDataset[] = []
      const manuales: ManualExercise[] = []
      for (const ej of (plan.exercises || [])) {
        if (ej.fromDataset && ej.datasetId) {
          const full = exercises.value.find((e: Exercise) => e.id === ej.datasetId)
          if (full) {
            dataset.push({
              ...full,
              sets: ej.sets ? JSON.parse(JSON.stringify(ej.sets)) : [{ weight: null, reps: null }]
            })
          } else {
            dataset.push({
              id: ej.datasetId,
              name: ej.name || '',
              category: ej.muscleGroup || ej.category || '',
              equipment: ej.equipment || '',
              target: ej.target || '',
              muscleGroup: ej.muscleGroup || '',
              gifUrl: ej.gifUrl,
              image: ej.image,
              videoBase64: ej.videoBase64,
              sets: ej.sets ? JSON.parse(JSON.stringify(ej.sets)) : [{ weight: null, reps: null }]
            } as ExerciseDataset)
          }
        } else if (!ej.fromDataset) {
          manuales.push({ name: ej.name || '', muscleGroup: ej.muscleGroup || '', sets: ej.sets ? JSON.parse(JSON.stringify(ej.sets)) : [{ weight: null, reps: null }] })
        }
      }
      this.planForm = { firebaseId: plan.firebaseId || null, name: plan.name || '', datasetExercises: dataset, manualExercises: manuales }
      this.planSubmitted = false
      this.planError = ''
      this.currentView = 'plan-form'
    },
    onExerciseSelected(ej: ExerciseDataset) {
      const idx = this.planForm.datasetExercises.findIndex(e => e.id === ej.id)
      if (idx >= 0) {
        this.planForm.datasetExercises.splice(idx, 1)
      } else {
        this.planForm.datasetExercises.push({ ...ej, sets: [{ weight: null, reps: null }] })
      }
    },
    addManualExercise() {
      this.planForm.manualExercises.push({ name: '', muscleGroup: '', sets: [{ weight: null, reps: null }] })
    },
    async savePlan() {
      if (!this.isPlanValid) { this.planSubmitted = true; return }
      this.isSaving = true
      this.planError = ''
      try {
        const todos = JSON.parse(JSON.stringify([
          ...this.planForm.datasetExercises.map((e: ExerciseDataset) => ({
            datasetId: e.id,
            fromDataset: true,
            sets: e.sets,
          })),
          ...this.planForm.manualExercises
        ]))

        const { firebaseId: planId, ...planRest } = this.planForm
        const now = new Date().toISOString()

        const fbData = {
          name: planRest.name,
          exercises: todos,
          personId: this.selectedPerson!.firebaseId,
          adminId: this.adminStore.adminId,
          updatedAt: now
        }

        if (planId) {
          await setDoc(doc(dbFirebase, 'plans', planId), fbData)
        } else {
          const ref = doc(collection(dbFirebase, 'plans'))
          await setDoc(ref, { ...fbData, createdAt: now })
        }
        await this.loadData()
        this.currentView = 'person-detail'
      } catch (e) {
        console.error(e)
        this.planError = 'Error al guardar'
      } finally { this.isSaving = false }
    },
    deletePlan(plan: Plan) {
      this.planToDelete = plan
      this.showConfirmPlan = true
    },
    async confirmDeletePlan() {
      this.showConfirmPlan = false
      if (!this.planToDelete || !this.planToDelete.firebaseId) return
      try {
        await deleteDoc(doc(dbFirebase, 'plans', this.planToDelete.firebaseId))
      } catch (e) { console.error(e) }
      await this.loadData()
      this.planToDelete = null
    },

    async loadCustomExercises() {
      const adminId = this.adminStore.adminId
      if (!adminId) return
      this.loadingCustom = true
      try {
        const q = query(
          collection(dbFirebase, 'exercises'),
          where('isCustom', '==', true),
          where('adminId', '==', adminId)
        )
        const snapshot = await getDocs(q)
        this.customExercises = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Exercise[]
      } catch {
        this.customExercises = []
      } finally {
        this.loadingCustom = false
      }
    },

    newCustomExercise() {
      this.editingId = null
      this.customForm = { name: '', category: '', muscleGroup: '', equipment: '', instructions: '' }
      this.videoReady = null
      this.thumbnailReady = null
      this.customError = ''
      this.customSubmitted = false
      this.currentView = 'custom-exercise-form'
    },

    editCustomExercise(ej: Exercise) {
      this.editingId = ej.id!
      this.customForm = {
        name: ej.name || '',
        category: ej.category || '',
        muscleGroup: ej.muscleGroup || '',
        equipment: ej.equipment || '',
        instructions: (ej.instructions && ej.instructions.es) || '',
      }
      this.videoReady = ej.videoBase64 || null
      this.thumbnailReady = ej.image || null
      this.customError = ''
      this.customSubmitted = false
      this.currentView = 'custom-exercise-form'
    },

    onMediaReady(media: { videoBase64: string; image: string | null }) {
      this.videoReady = media.videoBase64
      this.thumbnailReady = media.image
    },

    async saveCustomExercise() {
      this.customSubmitted = true
      if (!this.isCustomValid) return
      this.isSaving = true
      this.customError = ''
      try {
        const data = {
          name: this.customForm.name.trim(),
          category: this.customForm.category.trim() || 'personalizado',
          bodyPart: '',
          equipment: this.customForm.equipment.trim(),
          target: this.customForm.category.trim() || 'general',
          muscleGroup: this.customForm.muscleGroup.trim(),
          secondaryMuscles: [] as string[],
          image: this.thumbnailReady || '',
          gifUrl: '',
          mediaId: '',
          instructions: this.customForm.instructions.trim()
            ? { es: this.customForm.instructions.trim() }
            : undefined,
          instructionSteps: {},
          attribution: '',
          isCustom: true,
          adminId: this.adminStore.adminId || '',
          videoBase64: this.videoReady!,
        }

        if (this.editingId) {
          await setDoc(doc(dbFirebase, 'exercises', this.editingId), data, { merge: true })
        } else {
          const now = new Date().toISOString()
          const customId = `custom_${Date.now()}`
          await setDoc(doc(dbFirebase, 'exercises', customId), { ...data, createdAt: now })
        }
        await this.loadCustomExercises()
        await useExercises().loadCustomExercises(this.adminStore.adminId!)

        this.currentView = 'custom-exercises'
      } catch (e) {
        console.error(e)
        this.customError = 'Error al guardar. Revisá tu conexión.'
      } finally {
        this.isSaving = false
      }
    },

    confirmDeleteCustom(ej: Exercise) {
      this.customExerciseToDelete = ej
      this.showConfirmCustom = true
    },

    async confirmDeleteCustomExercise() {
      this.showConfirmCustom = false
      const ej = this.customExerciseToDelete
      if (!ej?.id) return
      this.deletingCustom = true
      try {
        const q = query(
          collection(dbFirebase, 'plans'),
          where('adminId', '==', this.adminStore.adminId)
        )
        const snap = await getDocs(q)
        const updates: Promise<void>[] = []
        snap.docs.forEach(d => {
          const exercises = (d.data().exercises || []).filter(
            (e: any) => e.datasetId !== ej.id
          )
          if (exercises.length !== (d.data().exercises || []).length) {
            updates.push(updateDoc(d.ref, { exercises }))
          }
        })
        await Promise.all(updates)
        await deleteDoc(doc(dbFirebase, 'exercises', ej.id))
        await this.loadCustomExercises()
        await useExercises().loadCustomExercises(this.adminStore.adminId!)
      } catch (e) {
        console.error(e)
      } finally {
        this.deletingCustom = false
        this.customExerciseToDelete = null
      }
    }
  },
  async created() {
    if (await this.adminStore.restoreSession()) {
      this.isLoggedIn = true
      await this.loadData()
      await this.loadCustomExercises()
      await useExercises().loadExercises(this.adminStore.adminId || undefined)
    }
  }
}
</script>
