import { get, post, put, del } from '../lib/apiClient'

export type ApiEducationArticle = {
  id?: string
  _id?: string
  title: string
  description: string
  category: 'Hormones' | 'Phases' | 'Care'
  readTime: string
  iconName: string
  image?: string
  url: string
  createdAt?: string
  updatedAt?: string
}

export const educationApi = {
  getArticles: () =>
    get<ApiEducationArticle[]>('/education'),

  createArticle: (article: Omit<ApiEducationArticle, 'id' | '_id' | 'createdAt' | 'updatedAt'>) =>
    post<ApiEducationArticle>('/education', article),

  updateArticle: (id: string, article: Partial<Omit<ApiEducationArticle, 'id' | '_id' | 'createdAt' | 'updatedAt'>>) =>
    put<ApiEducationArticle>(`/education/${id}`, article),

  deleteArticle: (id: string) =>
    del<{ success: boolean; message: string }>(`/education/${id}`),
}
