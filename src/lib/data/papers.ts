import papersData from '@/data/papers.json'
import papersEnData from '@/data/papers.en.json'
import type { CancerKey, Paper } from '@/types'

const translations = papersEnData as Record<string, Record<string, unknown>>

export const papers = papersData.map((paper) => ({
  ...paper,
  ...translations[paper.id],
})) as Paper[]

export const getPaper = (cancer: CancerKey, id: string) =>
  papers.find((paper) => paper.cancer === cancer && paper.id === id)

export const getPapersByCancer = (cancer: CancerKey) =>
  papers.filter((paper) => paper.cancer === cancer)

export const featuredPapers = papers.filter((paper) => paper.featured)
