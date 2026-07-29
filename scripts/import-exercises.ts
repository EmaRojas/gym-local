import { initializeApp } from 'firebase/app'
import { getFirestore, writeBatch, doc, collection } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import nombreTranslations from '../src/data/nombreTranslations.js'
import { categorias, equipos, targets, muscleGroups } from '../src/data/translations.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const firebaseConfig = {
  apiKey: 'AIzaSyCrEOdGHhi_fCGMPMgpxltPlErRzyzOPVE',
  authDomain: 'gyum-e7454.firebaseapp.com',
  projectId: 'gyum-e7454',
  storageBucket: 'gyum-e7454.firebasestorage.app',
  messagingSenderId: '21940366601',
  appId: '1:21940366601:web:2e96950a991ed0bcb0b7d8',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

interface ExerciseJson {
  id: string
  name: string
  category: string
  body_part: string
  equipment: string
  instructions: Record<string, string>
  instruction_steps: Record<string, string[]>
  muscle_group: string
  secondary_muscles: string[]
  target: string
  image: string
  gif_url: string
  media_id: string
  created_at: string
  attribution: string
}

function traducirNombre(nombre: string): string {
  if (!nombre) return nombre
  const lower = nombre.toLowerCase().trim()
  return nombreTranslations[lower] || nombre.replace(/\b\w/g, (c: string) => c.toUpperCase())
}

function traducir(valor: string, mapa: Record<string, string>): string {
  return mapa[valor] || valor
}

async function importExercises() {
  const filePath = join(__dirname, '..', 'src', 'data', 'exercises.json')
  const raw = readFileSync(filePath, 'utf-8')
  const exercises: ExerciseJson[] = JSON.parse(raw)

  console.log(`📦 ${exercises.length} ejercicios para importar`)

  const BATCH_SIZE = 200
  let imported = 0

  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const chunk = exercises.slice(i, i + BATCH_SIZE)

    for (const ex of chunk) {
      const ref = doc(collection(db, 'ejercicios'), ex.id)
      batch.set(ref, {
        id: ex.id,
        name: traducirNombre(ex.name),
        category: traducir(ex.category, categorias),
        body_part: ex.body_part,
        equipment: traducir(ex.equipment, equipos),
        target: traducir(ex.target, targets),
        muscle_group: traducir(ex.muscle_group, muscleGroups),
        secondary_muscles: ex.secondary_muscles,
        image: ex.image,
        gif_url: ex.gif_url,
        media_id: ex.media_id,
        instructions: ex.instructions,
        instruction_steps: ex.instruction_steps,
        attribution: ex.attribution,
        created_at: ex.created_at,
        es_personalizado: false,
        adminId: null,
        video_base64: null,
      })
    }

    await batch.commit()
    imported += chunk.length
    console.log(`✅ ${imported}/${exercises.length} importados`)
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('🎉 Importación completada')
}

importExercises().catch(console.error)
