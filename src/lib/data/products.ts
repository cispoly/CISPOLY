import productsData from '@/data/products.json'
import productsEnData from '@/data/products.en.json'
import type { Product } from '@/types'

const translations = productsEnData as Record<string, Record<string, unknown>>

export const products = productsData.map((product) => ({
  ...product,
  ...translations[product.slug],
})) as Product[]

export const getProduct = (slug: string) => products.find((product) => product.slug === slug)
