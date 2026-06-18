import type { Routine } from '@/types'

export const ROUTINES: Routine[] = [
  {
    id: 'morning',
    type: 'morning',
    name: 'Rutina de Mañana',
    is_premium: false,
    steps: [
      { id: 'm1', order: 1, title: 'Despertarse', pictogram: '⏰', duration_minutes: 5 },
      { id: 'm2', order: 2, title: 'Ir al baño', pictogram: '🚽', duration_minutes: 5 },
      { id: 'm3', order: 3, title: 'Lavarse la cara', pictogram: '🚿', duration_minutes: 3 },
      { id: 'm4', order: 4, title: 'Vestirse', pictogram: '👕', duration_minutes: 10 },
      { id: 'm5', order: 5, title: 'Desayunar', pictogram: '🥣', duration_minutes: 15 },
      { id: 'm6', order: 6, title: 'Cepillarse los dientes', pictogram: '🦷', duration_minutes: 3 },
    ],
  },
  {
    id: 'school',
    type: 'school',
    name: 'Rutina de Escuela',
    is_premium: false,
    steps: [
      { id: 's1', order: 1, title: 'Llegar a la escuela', pictogram: '🏫', duration_minutes: 5 },
      { id: 's2', order: 2, title: 'Guardar la mochila', pictogram: '🎒', duration_minutes: 3 },
      { id: 's3', order: 3, title: 'Sentarse en clase', pictogram: '🪑', duration_minutes: 2 },
      { id: 's4', order: 4, title: 'Escuchar al profesor', pictogram: '👂', duration_minutes: 30 },
      { id: 's5', order: 5, title: 'Recreo', pictogram: '⚽', duration_minutes: 20 },
      { id: 's6', order: 6, title: 'Volver a clase', pictogram: '📚', duration_minutes: 30 },
    ],
  },
  {
    id: 'bath',
    type: 'bath',
    name: 'Rutina de Baño',
    is_premium: true,
    steps: [
      { id: 'b1', order: 1, title: 'Preparar ropa limpia', pictogram: '🧺', duration_minutes: 3 },
      { id: 'b2', order: 2, title: 'Entrar a la ducha', pictogram: '🚿', duration_minutes: 1 },
      { id: 'b3', order: 3, title: 'Mojar el cuerpo', pictogram: '💧', duration_minutes: 2 },
      { id: 'b4', order: 4, title: 'Lavarse el pelo', pictogram: '🧴', duration_minutes: 5 },
      { id: 'b5', order: 5, title: 'Enjuagarse', pictogram: '🌊', duration_minutes: 3 },
      { id: 'b6', order: 6, title: 'Secarse', pictogram: '🪥', duration_minutes: 5 },
      { id: 'b7', order: 7, title: 'Vestirse', pictogram: '👕', duration_minutes: 5 },
    ],
  },
  {
    id: 'sleep',
    type: 'sleep',
    name: 'Rutina de Dormir',
    is_premium: true,
    steps: [
      { id: 'sl1', order: 1, title: 'Recoger juguetes', pictogram: '🧸', duration_minutes: 10 },
      { id: 'sl2', order: 2, title: 'Ponerse pijama', pictogram: '😴', duration_minutes: 5 },
      { id: 'sl3', order: 3, title: 'Cepillarse los dientes', pictogram: '🦷', duration_minutes: 3 },
      { id: 'sl4', order: 4, title: 'Leer un cuento', pictogram: '📖', duration_minutes: 15 },
      { id: 'sl5', order: 5, title: 'Apagar la luz', pictogram: '💡', duration_minutes: 1 },
      { id: 'sl6', order: 6, title: 'Dormir', pictogram: '🌙', duration_minutes: 0 },
    ],
  },
]
