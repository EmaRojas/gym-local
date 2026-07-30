import PocketBase from 'pocketbase'

const PB_URL = process.env.VITE_PB_URL || 'http://localhost:8090'
const SUPERUSER_EMAIL = process.env.PB_SUPERUSER_EMAIL || 'admin@admin.gym'
const SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD || 'admin123'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function createCollection(pb: PocketBase, collection: any) {
  try {
    const { schema, ...rest } = collection
    // Create collection without schema first
    const created = await pb.collections.create(rest)
    // Then update with schema (avoids schema not being applied)
    if (schema && schema.length > 0) {
      await pb.collections.update(created.id, { schema })
    }
    return created
  } catch (e: any) {
    if (e.status === 400 && e.data?.data?.name?.code === 'validation_not_unique') {
      console.log(`  - "${collection.name}" already exists`)
      const existing = (await pb.collections.getFullList()).find((c: any) => c.name === collection.name)
      // Ensure schema is up to date
      if (existing && collection.schema) {
        const currentFields = (existing.schema || []).map((f: any) => f.name)
        const missingFields = collection.schema.filter((f: any) => !currentFields.includes(f.name))
        if (missingFields.length > 0) {
          await pb.collections.update(existing.id, { schema: collection.schema })
          console.log(`  ✓ Updated schema for "${collection.name}" (${missingFields.length} fields added)`)
        }
      }
    } else {
      throw e
    }
  }
}

async function main() {
  console.log(`\nConnecting to PocketBase at ${PB_URL}...`)
  const pb = new PocketBase(PB_URL)

  // Authenticate as superuser
  try {
    await pb.admins.authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASSWORD)
    console.log('  ✓ Authenticated as superuser\n')
  } catch {
    console.error('  ✗ Failed to authenticate. Make sure PocketBase is running and create a superuser first.')
    console.error('    Run: pocketbase superups 8090 --create "admin@admin.gym" "admin123"')
    process.exit(1)
  }

  // Create collections
  console.log('Creating collections...')

  const collections = [
    {
      name: 'admins',
      type: 'auth',
      schema: [
        { name: 'name', type: 'text' },
        { name: 'logo', type: 'text' },
      ],
      options: {
        allowEmailAuth: true,
        allowUsernameAuth: false,
        requireEmail: true,
        minPasswordLength: 4,
      },
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    },
    {
      name: 'persons',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
        { name: 'dni', type: 'text', required: true, unique: true },
        { name: 'address', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'adminId', type: 'text' },
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    },
    {
      name: 'plans',
      type: 'base',
      schema: [
        { name: 'personId', type: 'text' },
        { name: 'adminId', type: 'text' },
        { name: 'name', type: 'text', required: true },
        { name: 'exercises', type: 'json' },
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    },
    {
      name: 'exercises',
      type: 'base',
      schema: [
        { name: 'name', type: 'text' },
        { name: 'category', type: 'text' },
        { name: 'equipment', type: 'text' },
        { name: 'target', type: 'text' },
        { name: 'muscleGroup', type: 'text' },
        { name: 'bodyPart', type: 'text' },
        { name: 'secondaryMuscles', type: 'json' },
        { name: 'gifUrl', type: 'text' },
        { name: 'image', type: 'text' },
        { name: 'videoUrl', type: 'text' },
        { name: 'instructions', type: 'json' },
        { name: 'instructionSteps', type: 'json' },
        { name: 'mediaId', type: 'text' },
        { name: 'attribution', type: 'text' },
        { name: 'isCustom', type: 'bool' },
        { name: 'adminId', type: 'text' },
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    },
    {
      name: 'categories',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true, unique: true },
        { name: 'label', type: 'text' },
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    },
    {
      name: 'muscleGroups',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true, unique: true },
        { name: 'label', type: 'text' },
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    },
  ]

  for (const col of collections) {
    const created = await createCollection(pb, col)
    if (created) {
      console.log(`  ✓ Created "${col.name}"`)
    }
    await sleep(200)
  }

  // Verify collections were created
  console.log('\nVerifying collections...')
  const existing = await pb.collections.getFullList()
  const names = existing.map((c: any) => c.name).sort()
  console.log(`  Existing collections: ${names.join(', ')}`)

  console.log('\n✓ Setup complete!')
  console.log('\nNext steps:')
  console.log('  1. Go to http://localhost:8090/_/ to manage your PocketBase instance')
  console.log('  2. Create an admin user in the "admins" collection (username + password)')
  console.log('  3. Run the app: npm run dev')
}

main().catch(console.error)
