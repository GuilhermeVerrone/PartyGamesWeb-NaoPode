import type { CategoryId } from './types'

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'comida', label: 'Comida' },
  { id: 'lugares', label: 'Lugares' },
  { id: 'objetos', label: 'Objetos' },
  { id: 'profissoes', label: 'Profissões' },
  { id: 'animais', label: 'Animais' },
  { id: 'esportes', label: 'Esportes' },
  { id: 'cultura', label: 'Cultura' },
  { id: 'acoes', label: 'Ações' },
  { id: 'festas', label: 'Festas' },
  { id: 'tecnologia', label: 'Tecnologia' },
  { id: 'natureza', label: 'Natureza' },
  { id: 'pessoas', label: 'Pessoas' },
]

export const ALL_CATEGORY_IDS = CATEGORIES.map((c) => c.id)
