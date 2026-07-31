<template>
  <div v-if="view === 'list'">
    <div class="flex items-center gap-3 mb-6 lg:mb-8">
      <button @click="$emit('back')" class="btn-icon bg-gym-gray-100" aria-label="Volver">
        <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="text-xl lg:text-2xl font-bold text-gym-gray-900 leading-tight">Ejercicios personalizados</h1>
        <p class="text-sm text-gym-gray-500 mt-0.5 tabular-nums">{{ exercises.length }} ejercicios</p>
      </div>
    </div>

    <button @click="newExercise" class="card card-hover p-4 flex items-center gap-3.5 mb-4 w-full">
      <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon icon="ph:plus" class="w-6 h-6 text-white" />
      </div>
      <div class="min-w-0 flex-1 text-left">
        <h3 class="font-bold text-gym-gray-900 leading-tight">Nuevo ejercicio</h3>
        <p class="text-xs text-gym-gray-500 mt-0.5">Grabá un GIF y creá tu propio ejercicio</p>
      </div>
      <Icon icon="ph:caret-right" class="w-5 h-5 text-gym-gray-400 flex-shrink-0" />
    </button>

    <div v-if="loading" class="text-center py-12">
      <Icon icon="ph:spinner" class="w-8 h-8 text-gym-blue mx-auto mb-3 animate-spin" />
      <p class="text-sm text-gym-gray-400">Cargando ejercicios personalizados...</p>
    </div>
    <div v-else-if="exercises.length === 0">
      <EmptyState icon="ph:barbell" title="No tenés ejercicios personalizados" />
    </div>

    <div v-else class="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
      <div v-for="ej in exercises" :key="ej.id" class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 rounded-xl overflow-hidden bg-gym-gray-100 flex-shrink-0">
            <img v-if="ej.gifUrl || ej.image" :src="ej.gifUrl || ej.image" :alt="ej.name" class="w-full h-full object-cover" loading="lazy" />
            <Icon v-else icon="ph:barbell" class="w-5 h-5 text-gym-gray-400 m-auto" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-bold text-gym-gray-900 truncate leading-tight">{{ ej.name }}</h3>
            <p class="text-xs text-gym-gray-500 mt-0.5 truncate">{{ translateCategory(ej.category) }}{{ ej.muscleGroup ? ' - ' + translateMuscleGroup(ej.muscleGroup) : '' }}</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button @click="editExercise(ej)" class="btn-icon bg-gym-blue-100 flex-shrink-0" :aria-label="`Editar ${ej.name}`">
              <Icon icon="ph:pencil" class="w-5 h-5 text-gym-blue" />
            </button>
            <button @click="confirmDelete(ej)" class="btn-icon bg-red-50 flex-shrink-0" :aria-label="`Eliminar ${ej.name}`">
              <Icon icon="ph:trash" class="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
        <p v-if="ej.instructions?.es" class="text-xs text-gym-gray-500 mt-2 line-clamp-2">{{ ej.instructions.es }}</p>
      </div>
    </div>

    <ConfirmSheet
      :visible="showConfirm"
      title="Eliminar ejercicio"
      message="Este ejercicio está asignado a uno o más planes. Se eliminará de todos ellos. ¿Continuar?"
      confirm-text="Eliminar de todo"
      variant="danger"
      :loading="deleting"
      @confirm="confirmDeleteExercise"
      @cancel="showConfirm = false"
    />
  </div>

  <div v-else>
    <div class="flex items-center gap-3 mb-6 lg:mb-8">
      <button @click="view = 'list'" class="btn-icon bg-gym-gray-100" aria-label="Volver">
        <Icon icon="ph:arrow-left" class="w-5 h-5 text-gym-gray-600" />
      </button>
      <div class="min-w-0">
        <h1 class="text-xl lg:text-2xl font-bold text-gym-gray-900 leading-tight">{{ editingId ? 'Editar ejercicio' : 'Nuevo ejercicio' }}</h1>
        <p class="text-sm text-gym-gray-500 mt-0.5">{{ editingId ? 'Actualizá los datos del ejercicio' : 'Grabá el GIF y completá los datos' }}</p>
      </div>
    </div>

    <div class="card p-5 space-y-5">
      <div>
        <label for="custom-nombre" class="label-field">Nombre del ejercicio <span class="text-red-500">*</span></label>
        <input id="custom-nombre" v-model="form.name" type="text" class="input-field" :class="submitted && !form.name.trim() ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''" placeholder="Ej: Sentadilla con salto" />
        <p v-if="submitted && !form.name.trim()" class="error-text"><Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> El nombre es obligatorio</p>
      </div>
      <div>
        <label for="custom-categoria" class="label-field">Categoría <span class="text-red-500">*</span></label>
        <select id="custom-categoria" v-model="form.category" class="select-field" style="font-size: 16px" :class="submitted && !form.category.trim() ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''">
          <option value="">Seleccionar...</option>
          <option v-for="c in categoryOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
        <p v-if="submitted && !form.category.trim()" class="error-text"><Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> La categoría es obligatoria</p>
      </div>
      <div>
        <label for="custom-grupo" class="label-field">Grupo muscular <span class="text-red-500">*</span></label>
        <select id="custom-grupo" v-model="form.muscleGroup" class="select-field" style="font-size: 16px" :class="submitted && !form.muscleGroup.trim() ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''">
          <option value="">Seleccionar...</option>
          <option v-for="g in muscleGroupOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
        </select>
        <p v-if="submitted && !form.muscleGroup.trim()" class="error-text"><Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> El grupo muscular es obligatorio</p>
      </div>
      <div>
        <label for="custom-equipo" class="label-field">Equipamiento <span class="font-normal text-gym-gray-400">(opcional)</span></label>
        <input id="custom-equipo" v-model="form.equipment" type="text" class="input-field" placeholder="Ej: barra, mancuernas, bodyweight..." />
      </div>
      <div>
        <label for="custom-instrucciones" class="label-field">Instrucciones <span class="font-normal text-gym-gray-400">(opcional)</span></label>
        <textarea id="custom-instrucciones" v-model="form.instructions" class="input-field min-h-[80px]" placeholder="Describí cómo se realiza el ejercicio..." />
      </div>
    </div>

    <div class="card p-5 mt-5">
      <h3 class="font-bold text-gym-gray-900 mb-4">
        {{ editingId ? 'Imagen del ejercicio' : 'Grabar GIF del ejercicio' }}
        <span v-if="!editingId" class="text-red-500">*</span>
      </h3>
      <template v-if="editingId && mediaReady">
        <div class="bg-black rounded-xl overflow-hidden">
          <video v-if="mediaReady.startsWith('data:video')" :src="mediaReady" :playbackRate="0.5" autoplay muted loop playsinline class="w-full aspect-[4/3] object-contain max-h-[300px]" />
          <img v-else :src="mediaReady" class="w-full aspect-[4/3] object-contain max-h-[300px]" />
        </div>
        <p class="text-xs text-gym-gray-400 mt-2">El GIF no se puede modificar</p>
      </template>
      <template v-else>
        <GifRecorder @media-ready="onMediaReady" ref="gifRecorderRef" />
        <p v-if="submitted && !mediaReady" class="error-text mt-2"><Icon icon="ph:warning-circle" class="w-3.5 h-3.5" /> Grabá o subí un GIF del ejercicio</p>
      </template>
    </div>

    <p v-if="error" class="text-sm text-red-500 font-medium text-center mt-4" role="alert">{{ error }}</p>

    <div class="mt-6 safe-bottom">
      <button @click="save" :disabled="saving || !isValid" class="btn-primary w-full">
        {{ saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar ejercicio' }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import pb from '../../db/pocketbase'
import { useExercises, translateCategory, translateMuscleGroup } from '../../composables/useExercises'
import GifRecorder from '../../components/GifRecorder.vue'
import EmptyState from '../../components/EmptyState.vue'
import ConfirmSheet from '../../components/ConfirmSheet.vue'
import type { Exercise } from '../../types'

interface CustomForm {
  name: string
  category: string
  muscleGroup: string
  equipment: string
  instructions: string
}

export default {
  name: 'CustomExerciseView',
  components: { GifRecorder, EmptyState, ConfirmSheet },
  props: {
    adminId: { type: String, default: '' }
  },
  emits: ['back'],
  data() {
    return {
      view: 'list' as 'list' | 'form',
      exercises: [] as Exercise[],
      loading: false,
      showConfirm: false,
      exerciseToDelete: null as Exercise | null,
      deleting: false,
      editingId: null as string | null,
      form: { name: '', category: '', muscleGroup: '', equipment: '', instructions: '' } as CustomForm,
      submitted: false,
      error: '',
      mediaReady: null as string | null,
      gifBlob: null as Blob | null,
      saving: false,
      categoryOptions: [] as { value: string; label: string; en: string }[],
      muscleGroupOptions: [] as { value: string; label: string }[]
    }
  },
  computed: {
    isValid(): boolean {
      return !!(this.form.name.trim()) &&
        !!(this.form.category.trim()) &&
        !!(this.form.muscleGroup.trim()) &&
        !!this.mediaReady
    }
  },
  methods: {
    translateCategory,
    translateMuscleGroup,
    async loadExercises() {
      if (!this.adminId) return
      this.loading = true
      try {
        const records = await pb.collection('exercises').getFullList({
          filter: `isCustom = true && adminId = "${this.adminId}"`
        })
        this.exercises = records as unknown as Exercise[]
      } catch {
        this.exercises = []
      } finally {
        this.loading = false
      }
    },
    async loadDropdownOptions() {
      try {
        const cats = await pb.collection('categories').getFullList()
        this.categoryOptions = cats.map((c: any) => ({ value: c.label, label: c.label, en: c.name }))
        const groups = await pb.collection('muscleGroups').getFullList()
        this.muscleGroupOptions = groups.map((g: any) => ({ value: g.label, label: g.label }))
      } catch {
        this.categoryOptions = []
        this.muscleGroupOptions = []
      }
    },
    newExercise() {
      this.editingId = null
      this.form = { name: '', category: '', muscleGroup: '', equipment: '', instructions: '' }
      this.mediaReady = null
      this.gifBlob = null
      this.error = ''
      this.submitted = false
      this.view = 'form'
      this.loadDropdownOptions()
    },
    editExercise(ej: Exercise) {
      this.editingId = ej.id!
      this.form = {
        name: ej.name || '',
        category: ej.category || '',
        muscleGroup: ej.muscleGroup || '',
        equipment: ej.equipment || '',
        instructions: (ej.instructions && (ej.instructions as any).es) || '',
      }
      this.mediaReady = ej.gifUrl || ej.image || ej.videoUrl || null
      this.gifBlob = null
      this.error = ''
      this.submitted = false
      this.view = 'form'
    },
    onMediaReady(media: { gifUrl: string; gifBlob?: Blob | null }) {
      this.mediaReady = media.gifUrl
      this.gifBlob = media.gifBlob || null
    },
    async save() {
      this.submitted = true
      if (!this.isValid) return
      this.saving = true
      this.error = ''
      try {
        const selectedCategory = this.categoryOptions.find(c => c.value === this.form.category.trim())

        const base: Record<string, unknown> = {
          name: this.form.name.trim(),
          category: this.form.category.trim() || 'personalizado',
          bodyPart: selectedCategory?.en || '',
          equipment: this.form.equipment.trim() || 'Peso corporal',
          target: this.form.category.trim() || 'general',
          muscleGroup: this.form.muscleGroup.trim(),
          secondaryMuscles: [] as string[],
          instructions: this.form.instructions.trim()
            ? { es: this.form.instructions.trim() }
            : undefined,
          instructionSteps: {},
          attribution: '',
          isCustom: true,
          adminId: this.adminId,
        }

        if (this.gifBlob) {
          // Nuevo GIF: se sube como archivo al campo "gif" (evita el límite de 5000 chars de los campos texto)
          const fd = new FormData()
          for (const [key, value] of Object.entries(base)) {
            if (value !== undefined) {
              fd.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
            }
          }
          fd.append('gif', this.gifBlob, 'exercise.gif')
          const record = this.editingId
            ? await pb.collection('exercises').update(this.editingId, fd)
            : await pb.collection('exercises').create(fd)
          const url = pb.files.getURL(record, (record as any).gif)
          await pb.collection('exercises').update(record.id, { gifUrl: url, image: url })
        } else if (this.editingId) {
          base.gifUrl = this.mediaReady || ''
          base.image = this.mediaReady || ''
          await pb.collection('exercises').update(this.editingId, base)
        } else {
          base.gifUrl = ''
          base.image = ''
          base.videoUrl = ''
          base.mediaId = ''
          await pb.collection('exercises').create(base)
        }
        await this.loadExercises()
        await useExercises().loadCustomExercises(this.adminId)
        this.view = 'list'
      } catch (e: any) {
        console.error(e)
        const fields = e?.data?.data || e?.response?.data?.data || {}
        const fieldMsg = Object.values(fields)
          .map((f: any) => (f?.message ? String(f.message) : ''))
          .filter(Boolean)
          .join(' · ')
        this.error = 'No se pudo guardar el ejercicio.' + (fieldMsg ? ' ' + fieldMsg : ' ' + String(e?.message || e).slice(0, 200))
      } finally {
        this.saving = false
      }
    },
    confirmDelete(ej: Exercise) {
      this.exerciseToDelete = ej
      this.showConfirm = true
    },
    async confirmDeleteExercise() {
      this.showConfirm = false
      const ej = this.exerciseToDelete
      if (!ej?.id) return
      this.deleting = true
      try {
        const plans = await pb.collection('plans').getFullList({
          filter: `adminId = "${this.adminId}"`
        })
        const updates = plans.map((p: any) => {
          const exercises = (p.exercises || []).filter((e: any) => e.datasetId !== ej.id)
          if (exercises.length !== (p.exercises || []).length) {
            return pb.collection('plans').update(p.id, { exercises })
          }
          return Promise.resolve()
        })
        await Promise.all(updates)
        await pb.collection('exercises').delete(ej.id)
        await this.loadExercises()
        await useExercises().loadCustomExercises(this.adminId)
      } catch (e) {
        console.error(e)
      } finally {
        this.deleting = false
        this.exerciseToDelete = null
      }
    }
  },
  async created() {
    await this.loadExercises()
  }
}
</script>
