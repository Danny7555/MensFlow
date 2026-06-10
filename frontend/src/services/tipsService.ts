import { get } from '../lib/apiClient'

export type ApiWellnessTip = {
  id?: string
  _id?: string
  category: 'nutrition' | 'movement' | 'rest' | 'mind'
  title: string
  summary: string
  phaseTag: string
  createdAt?: string
  updatedAt?: string
}

export const tipsApi = {
  getTips: () =>
    get<ApiWellnessTip[]>('/tips'),
}
