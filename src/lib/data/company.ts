import companyData from '@/data/company.json'
import companyEnData from '@/data/company.en.json'
import type { Company } from '@/types'

export const company = { ...companyData, ...companyEnData } as Company
