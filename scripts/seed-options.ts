import { initializeApp } from 'firebase/app'
import { getFirestore, writeBatch, doc, collection, getDocs, query, where } from 'firebase/firestore'
import { categories as catMap, equipment as eqMap, muscleGroups as muscleMap } from '../src/data/translations.js'
import type { Exercise } from '../src/types.js'

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

function translate(valor: string, mapa: Record<string, string>): string {
  return mapa[valor] || valor
}

async function seedOptions() {
  const q = query(collection(db, 'exercises'), where('isCustom', '==', false))
  const snapshot = await getDocs(q)
  const exercises: Exercise[] = snapshot.docs.map(d => ({ ...(d.data() as Exercise), id: d.id }))

  console.log(`📦 ${exercises.length} ejercicios cargados`)

  const categories = [...new Set(exercises.map(e => e.category))].sort()
  const muscleGroups = [...new Set(exercises.map(e => e.muscleGroup))].sort()

  const batch = writeBatch(db)

  for (const cat of categories) {
    const ref = doc(collection(db, 'categories'))
    batch.set(ref, { name: cat, label: translate(cat, catMap) })
  }

  for (const mg of muscleGroups) {
    const ref = doc(collection(db, 'muscleGroups'))
    batch.set(ref, { name: mg, label: translate(mg, muscleMap) })
  }

  await batch.commit()
  console.log(`✅ ${categories.length} categorías guardadas`)
  console.log(`✅ ${muscleGroups.length} grupos musculares guardados`)
  console.log('🎉 Seed completado')
}

seedOptions().catch(console.error)
