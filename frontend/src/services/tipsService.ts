import { get, post, put, del } from '../lib/apiClient'

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

  createTip: (tip: Omit<ApiWellnessTip, 'id' | '_id' | 'createdAt' | 'updatedAt'>) =>
    post<ApiWellnessTip>('/tips', tip),

  updateTip: (id: string, tip: Partial<Omit<ApiWellnessTip, 'id' | '_id' | 'createdAt' | 'updatedAt'>>) =>
    put<ApiWellnessTip>(`/tips/${id}`, tip),

  deleteTip: (id: string) =>
    del<{ success: boolean; message: string }>(`/tips/${id}`),
}
