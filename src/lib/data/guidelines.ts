import guidelinesData from '@/data/guidelines.json'
import guidelinesEnData from '@/data/guidelines.en.json'
import type { CancerKey, Guideline } from '@/types'

const translations = guidelinesEnData as Record<string, Record<string, unknown>>

export const guidelines = guidelinesData
  .map((guideline) => ({
    ...guideline,
    ...translations[guideline.id],
  }))
  // Keep the UI order deterministic even when the generated index is stale.
  .sort((a, b) => (b.year || 0) - (a.year || 0)) as Guideline[]

export const getGuideline = (cancer: CancerKey, id: string) =>
  guidelines.find((guideline) => guideline.cancer === cancer && guideline.id === id)

export const getGuidelinesByCancer = (cancer: CancerKey) =>
  guidelines.filter((guideline) => guideline.cancer === cancer || guideline.cancers?.includes(cancer))
