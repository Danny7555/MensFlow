import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, del } from '../lib/apiClient'
import { isLoggedIn } from '../lib/auth-token'

export type ApiCommunityPost = {
  _id: string
  userId: string
  title: string
  body: string
  category: string
  tags: string[]
  isAnonymous: boolean
  location?: string
  aiReplied: boolean
  pinned: boolean
  commentCount: number
  createdAt: string
  updatedAt: string
  author: { name: string; avatar?: string; role: string }
}

export type ApiCommunityComment = {
  _id: string
  postId: string
  body: string
  isAnonymous: boolean
  isAI?: boolean
  createdAt: string
  author: { name: string; avatar?: string; role: string }
}

export type ApiPostList = {
  posts: ApiCommunityPost[]
  total: number
  page: number
  totalPages: number
}

export type ApiPostDetail = {
  post: ApiCommunityPost
  comments: ApiCommunityComment[]
}

export const communityKeys = {
  posts: (category?: string, page?: number) => ['community', 'posts', category, page] as const,
  post: (id: string) => ['community', 'post', id] as const,
}

export const communityApi = {
  listPosts: (category?: string, page = 1) =>
    get<ApiPostList>(`/community?${category && category !== 'all' ? `category=${category}&` : ''}page=${page}`),

  getPost: (id: string) =>
    get<ApiPostDetail>(`/community/${id}`),

  createPost: (data: { title: string; body: string; category: string; tags?: string[]; isAnonymous?: boolean; location?: string }) =>
    post<ApiCommunityPost>('/community', data),

  addComment: (postId: string, data: { body: string; isAnonymous?: boolean }) =>
    post<ApiCommunityComment>(`/community/${postId}/comments`, data),

  deletePost: (postId: string) =>
    del<{ success: boolean }>(`/community/${postId}`),
}

export function useCommunityPosts(category?: string, page = 1) {
  return useQuery({
    queryKey: communityKeys.posts(category, page),
    queryFn: () => communityApi.listPosts(category, page),
    enabled: isLoggedIn(),
    staleTime: 1000 * 60 * 2,
  })
}

export function useCommunityPost(id: string) {
  return useQuery({
    queryKey: communityKeys.post(id),
    queryFn: () => communityApi.getPost(id),
    enabled: isLoggedIn() && !!id,
    staleTime: 1000 * 60,
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; body: string; category: string; tags?: string[]; isAnonymous?: boolean; location?: string }) =>
      communityApi.createPost(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', 'posts'] })
    },
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: { body: string; isAnonymous?: boolean } }) =>
      communityApi.addComment(postId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['community', 'post', vars.postId] })
      qc.invalidateQueries({ queryKey: ['community', 'posts'] })
    },
  })
}
