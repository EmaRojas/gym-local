import nombreTranslations from './nombreTranslations'

export const categorias: Record<string, string> = {
  'back': 'Espalda',
  'cardio': 'Cardio',
  'chest': 'Pecho',
  'lower arms': 'Antebrazos',
  'lower legs': 'Pantorrillas',
  'neck': 'Cuello',
  'shoulders': 'Hombros',
  'upper arms': 'Brazos',
  'upper legs': 'Muslos',
  'waist': 'Abdomen'
}

export const equipos: Record<string, string> = {
  'assisted': 'Asistida',
  'band': 'Banda elástica',
  'barbell': 'Barra',
  'body weight': 'Peso corporal',
  'bosu ball': 'Pelota BOSU',
  'cable': 'Polea',
  'dumbbell': 'Mancuerna',
  'elliptical machine': 'Elíptica',
  'ez barbell': 'Barra EZ',
  'hammer': 'Martillo',
  'kettlebell': 'Pesa rusa',
  'leverage machine': 'Máquina palanca',
  'medicine ball': 'Balón medicinal',
  'olympic barbell': 'Barra olímpica',
  'resistance band': 'Banda de resistencia',
  'roller': 'Rodillo',
  'rope': 'Cuerda',
  'skierg machine': 'Máquina esquí',
  'sled machine': 'Trineo',
  'smith machine': 'Smith',
  'stability ball': 'Pelota de estabilidad',
  'stationary bike': 'Bicicleta estática',
  'stepmill machine': 'Escaladora',
  'tire': 'Cubierta',
  'trap bar': 'Barra hexagonal',
  'upper body ergometer': 'Ergómetro superior',
  'weighted': 'Con peso',
  'wheel roller': 'Rodillo de rueda'
}

export const targets: Record<string, string> = {
  'abductors': 'Abductores',
  'abs': 'Abdominales',
  'adductors': 'Aductores',
  'biceps': 'Bíceps',
  'calves': 'Pantorrillas',
  'cardiovascular system': 'Sistema cardiovascular',
  'delts': 'Deltoides',
  'forearms': 'Antebrazos',
  'glutes': 'Glúteos',
  'hamstrings': 'Isquiotibiales',
  'lats': 'Dorsales',
  'levator scapulae': 'Elevador de escápula',
  'pectorals': 'Pectorales',
  'quads': 'Cuádriceps',
  'serratus anterior': 'Serrato anterior',
  'spine': 'Columna',
  'traps': 'Trapecios',
  'triceps': 'Tríceps',
  'upper back': 'Espalda alta'
}

export const muscleGroups: Record<string, string> = {
  'abdominals': 'Abdominales',
  'ankle stabilizers': 'Estabilizadores de tobillo',
  'ankles': 'Tobillos',
  'biceps': 'Bíceps',
  'calves': 'Pantorrillas',
  'chest': 'Pecho',
  'core': 'Core',
  'deltoids': 'Deltoides',
  'forearms': 'Antebrazos',
  'glutes': 'Glúteos',
  'hamstrings': 'Isquiotibiales',
  'hands': 'Manos',
  'hip flexors': 'Flexores de cadera',
  'latissimus dorsi': 'Dorsal ancho',
  'lats': 'Dorsales',
  'lower back': 'Espalda baja',
  'obliques': 'Oblicuos',
  'quadriceps': 'Cuádriceps',
  'rhomboids': 'Romboides',
  'rotator cuff': 'Manguito rotador',
  'shoulders': 'Hombros',
  'soleus': 'Sóleo',
  'trapezius': 'Trapecio',
  'traps': 'Trapecios',
  'triceps': 'Tríceps',
  'upper back': 'Espalda alta',
  'wrist extensors': 'Extensores de muñeca',
  'wrist flexors': 'Flexores de muñeca',
  'wrists': 'Muñecas'
}

export function traducirNombre(nombre: string): string {
  if (!nombre) return nombre
  const lower = nombre.toLowerCase().trim()
  return nombreTranslations[lower] || nombre
    .replace(/\b\w/g, (c: string) => c.toUpperCase())
}

export function traducir(valor: string, mapa: Record<string, string>): string {
  return mapa[valor] || valor
}
