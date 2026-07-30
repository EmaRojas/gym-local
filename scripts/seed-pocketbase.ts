import PocketBase from 'pocketbase'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import nombreTranslations from '../src/data/nombreTranslations.js'
import { categories as catMap, equipment as eqMap, targets as targetMap, muscleGroups as muscleMap } from '../src/data/translations.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PB_URL = process.env.VITE_PB_URL || 'http://localhost:8090'

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

function translate(valor: string, mapa: Record<string, string>): string {
  return mapa[valor] || valor
}

function translateName(nombre: string): string {
  if (!nombre) return nombre
  const lower = nombre.toLowerCase().trim()
  return nombreTranslations[lower] || nombre.replace(/\b\w/g, (c: string) => c.toUpperCase())
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const pb = new PocketBase(PB_URL)
  pb.autoCancellation(false)

  // Authenticate as superuser (needed to write to collections)
  const SUPERUSER_EMAIL = process.env.PB_SUPERUSER_EMAIL || 'admin@admin.gym'
  const SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD || 'admin123'

  try {
    await pb.admins.authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASSWORD)
    console.log('✓ Authenticated as superuser\n')
  } catch {
    console.error('✗ Failed to authenticate. Run pocketbase serve first and create a superuser.')
    process.exit(1)
  }

  // Read exercises JSON
  const filePath = join(__dirname, '..', 'src', 'data', 'exercises.json')
  const raw = readFileSync(filePath, 'utf-8')
  const exercises: ExerciseJson[] = JSON.parse(raw)
  console.log(`📦 ${exercises.length} exercises loaded\n`)

  // Track unique values for seeding
  const categoriesSet = new Set<string>()
  const muscleGroupsSet = new Set<string>()

  // Import exercises
  console.log('Importing exercises...')
  const BATCH_SIZE = 200
  let imported = 0
  let skipped = 0

  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const chunk = exercises.slice(i, i + BATCH_SIZE)

    const promises = chunk.map(async (ex) => {
      categoriesSet.add(ex.category)
      muscleGroupsSet.add(ex.muscle_group)

      const data = {
        name: translateName(ex.name),
        category: translate(ex.category, catMap),
        equipment: translate(ex.equipment, eqMap),
        target: translate(ex.target, targetMap),
        muscleGroup: translate(ex.muscle_group, muscleMap),
        bodyPart: ex.body_part,
        secondaryMuscles: ex.secondary_muscles,
        image: ex.image,
        gifUrl: ex.gif_url,
        mediaId: ex.media_id,
        instructions: ex.instructions,
        instructionSteps: ex.instruction_steps,
        attribution: ex.attribution,
        isCustom: false,
        adminId: null,
        videoUrl: null,
      }

      try {
        await pb.collection('exercises').create(data)
        return 'created'
      } catch (e: any) {
        if (e.status === 400 && e.data?.data?.id?.code === 'validation_not_unique') {
          return 'skipped'
        }
        throw e
      }
    })

    const results = await Promise.all(promises)
    const created = results.filter(r => r === 'created').length
    const skip = results.filter(r => r === 'skipped').length
    imported += created
    skipped += skip

    console.log(`  ${imported + skipped}/${exercises.length} (${created} new, ${skip} skipped)`)
    await sleep(2000)
  }

  console.log(`\n✅ Exercises: ${imported} created, ${skipped} skipped\n`)

  // Seed categories
  console.log('Seeding categories...')
  let catCount = 0
  for (const cat of [...categoriesSet].sort()) {
    const label = translate(cat, catMap)
    try {
      await pb.collection('categories').create({ name: cat, label })
      catCount++
    } catch (e: any) {
      if (e.status === 400 && e.data?.data?.name?.code === 'validation_not_unique') {
        // already exists
      } else {
        throw e
      }
    }
  }
  console.log(`  ✅ ${catCount} categories created`)

  // Seed muscle groups
  console.log('Seeding muscle groups...')
  let mgCount = 0
  for (const mg of [...muscleGroupsSet].sort()) {
    const label = translate(mg, muscleMap)
    try {
      await pb.collection('muscleGroups').create({ name: mg, label })
      mgCount++
    } catch (e: any) {
      if (e.status === 400 && e.data?.data?.name?.code === 'validation_not_unique') {
        // already exists
      } else {
        throw e
      }
    }
  }
  console.log(`  ✅ ${mgCount} muscle groups created`)

  console.log('\n🎉 Seed completed!')
  console.log(`   ${imported} exercises`)
  console.log(`   ${catCount} categories`)
  console.log(`   ${mgCount} muscle groups`)
}

main().catch(console.error)
