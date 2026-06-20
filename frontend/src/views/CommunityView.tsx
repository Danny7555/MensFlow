import React, { useState, useRef, useEffect, useReducer } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  Plus, ArrowLeft, Trash,
  Heart, FlowerLotus, CalendarBlank, Sparkle, ChatCircleDots,
  DotsThree, PaperPlaneTilt, MapPin
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useStore } from '../store/useStore'
import { useCommunityPosts, useCommunityPost, useCreatePost, useAddComment, communityApi } from '../services/communityService'
import { cn } from '../lib/utils'
import { resolveAssetUrl } from '../lib/apiClient'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const CATEGORIES = [
  { id: 'all', label: 'All', Icon: Sparkle },
  { id: 'cycles', label: 'Cycles', Icon: CalendarBlank },
  { id: 'symptoms', label: 'Symptoms', Icon: Heart },
  { id: 'wellness', label: 'Wellness', Icon: FlowerLotus },
  { id: 'relationships', label: 'Relationships', Icon: Heart },
  { id: 'general', label: 'General', Icon: DotsThree },
  { id: 'ask', label: 'Ask', Icon: ChatCircleDots },
] as const

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

const AVATAR_COLORS = ['#f43f5e', '#0d9488', '#d97706', '#7c3aed', '#0284c7', '#a21caf', '#059669']

function AvatarCircle({ name, avatar, size = 'md' }: { name: string; avatar?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'size-7' : 'size-10'
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-sm'
  const src = resolveAssetUrl(avatar)

  if (src) {
    return <img src={src} alt={name} className={`${dim} rounded-full object-cover shrink-0 border-2 border-white dark:border-gray-800`} />
  }

  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length]
  return (
    <div className={`${dim} ${textSize} rounded-full flex items-center justify-center font-semibold text-white shrink-0 border-2 border-white/50`} style={{ backgroundColor: color }}>
      {getInitials(name)}
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) return 'Today'
  if (diff < 172800000) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function timeAgo(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return formatDate(iso)
}

type CreatePostState = {
  title: string
  body: string
  category: string
  anonymous: boolean
  location: string
  locating: boolean
}

type CreatePostAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_BODY'; payload: string }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_ANONYMOUS'; payload: boolean }
  | { type: 'SET_LOCATION'; payload: string }
  | { type: 'SET_LOCATING'; payload: boolean }
  | { type: 'RESET' }

function createPostReducer(state: CreatePostState, action: CreatePostAction): CreatePostState {
  switch (action.type) {
    case 'SET_TITLE': return { ...state, title: action.payload }
    case 'SET_BODY': return { ...state, body: action.payload }
    case 'SET_CATEGORY': return { ...state, category: action.payload }
    case 'SET_ANONYMOUS': return { ...state, anonymous: action.payload }
    case 'SET_LOCATION': return { ...state, location: action.payload }
    case 'SET_LOCATING': return { ...state, locating: action.payload }
    case 'RESET': return { title: '', body: '', category: 'cycles', anonymous: false, location: '', locating: false }
    default: return state
  }
}

function CreatePostModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, dispatch] = useReducer(createPostReducer, {
    title: '', body: '', category: 'cycles', anonymous: false, location: '', locating: false,
  })
  const { title, body, category, anonymous, location, locating } = state
  const createPost = useCreatePost()

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    dispatch({ type: 'SET_LOCATING', payload: true })
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&zoom=10&accept-language=en`,
            { headers: { 'User-Agent': 'MensFlow/1.0' } },
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || ''
          const country = data.address?.country || ''
          dispatch({ type: 'SET_LOCATION', payload: city ? `${city}, ${country}` : country })
        } catch {
          toast.error('Could not detect your location')
        }
        dispatch({ type: 'SET_LOCATING', payload: false })
      },
      () => {
        toast.error('Location permission denied')
        dispatch({ type: 'SET_LOCATING', payload: false })
      },
      { timeout: 10000, enableHighAccuracy: false },
    )
  }

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return
    try {
      await createPost.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        category,
        isAnonymous: anonymous,
        location: location || undefined,
      })
      toast.success('Posted!', { description: 'Your post is live.' })
      dispatch({ type: 'RESET' })
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create post')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close modal" className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer border-0 p-0" onClick={onClose} onKeyDown={e => { if (e.key === 'Escape') onClose() }} />
      <m.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 sm:relative sm:max-w-lg sm:mx-auto sm:mt-[8vh] sm:rounded-3xl bg-white dark:bg-[var(--mf-card)] rounded-t-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--mf-text-strong)]">Create post</h2>
          <button type="button" onClick={onClose} className="size-8 rounded-full bg-[var(--mf-elevated)] flex items-center justify-center text-muted-foreground hover:text-[var(--mf-text-strong)] transition-colors cursor-pointer">✕</button>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="post-title" className="text-xs font-medium text-muted-foreground">Title</label>
          <input
            id="post-title"
            value={title}
            onChange={e => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
            placeholder="What's on your mind?"
            className="w-full h-12 px-4 rounded-2xl bg-[var(--mf-elevated)] border border-[var(--mf-border)] text-sm text-[var(--mf-text-strong)] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--mf-ring)] transition-all"
            maxLength={200}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="post-description" className="text-xs font-medium text-muted-foreground">Description</label>
          <div className="relative">
            <textarea
              id="post-description"
              value={body}
              onChange={e => dispatch({ type: 'SET_BODY', payload: e.target.value })}
              placeholder="Share your experience or ask a question..."
              className="w-full h-28 px-4 py-3 rounded-2xl bg-[var(--mf-elevated)] border border-[var(--mf-border)] text-sm text-[var(--mf-text-strong)] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--mf-ring)] transition-all resize-none"
              maxLength={10000}
            />
            {body.toLowerCase().includes('@men') && !body.toLowerCase().includes('@mensflow') && (
              <div className="absolute -bottom-2 left-3 translate-y-full bg-white dark:bg-gray-800 border border-[var(--mf-border)] rounded-xl px-3 py-2 text-xs text-muted-foreground flex items-center gap-2 z-10 animate-in fade-in slide-in-from-top-1">
                <span className="text-purple-500 font-semibold">@mensflow</span>
                <span>— Ask MensFlow AI to answer</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Sparkle size={12} className="text-purple-500" />
            Include <span className="font-semibold text-purple-500">@mensflow</span> in your post to get an AI-powered response
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            {location ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-[var(--mf-elevated)] rounded-xl px-3 py-2 border border-[var(--mf-border)]">
                <MapPin size={14} className="text-[var(--mf-accent)]" />
                <span className="truncate">{location}</span>
                <button type="button" onClick={() => dispatch({ type: 'SET_LOCATION', payload: '' })} className="ml-auto text-muted-foreground hover:text-[var(--mf-text-strong)] cursor-pointer">✕</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLocate}
                disabled={locating}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[var(--mf-accent)] transition-colors cursor-pointer disabled:opacity-40"
              >
                <MapPin size={14} />
                {locating ? 'Detecting...' : 'Add your location'}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground block">Category</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.flatMap(cat => {
              if (cat.id === 'all') return []
              const active = category === cat.id
              return [(
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => dispatch({ type: 'SET_CATEGORY', payload: cat.id })}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium transition-all cursor-pointer border',
                    active
                      ? 'bg-[var(--mf-accent)] text-white border-[var(--mf-accent)]'
                      : 'bg-[var(--mf-elevated)] text-muted-foreground border-[var(--mf-border)] hover:border-[var(--mf-accent-border)]',
                  )}
                >
                  {React.createElement(cat.Icon, { size: 14, className: active ? 'text-white' : 'text-[var(--mf-accent)]' })}
                  {cat.label}
                </button>
              )]
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_ANONYMOUS', payload: !anonymous })}
          className="flex items-center gap-3 py-2 w-full text-left bg-transparent border-0 cursor-pointer rounded-lg hover:bg-[var(--mf-elevated)] transition-colors"
        >
          <div className={cn(
            'size-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
            anonymous ? 'bg-[var(--mf-accent)] border-[var(--mf-accent)]' : 'border-[var(--mf-border)]',
          )}>
            {anonymous && <span className="text-white text-[10px] font-bold">✓</span>}
          </div>
          <div className="select-none">
            <span className="text-sm text-[var(--mf-text-strong)] font-medium">Post anonymously</span>
            <p className="text-[11px] text-muted-foreground">Your name won't be visible</p>
          </div>
        </button>

        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !body.trim() || createPost.isPending}
          className="w-full h-12 rounded-2xl bg-[var(--mf-accent)] text-white font-semibold text-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {createPost.isPending ? (
            <div className="size-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <>
              <PaperPlaneTilt size={16} weight="fill" />
              Post
            </>
          )}
        </button>
      </m.div>
    </div>
  )
}

function PostCard({ post, onClick }: { post: import('../services/communityService').ApiCommunityPost; onClick: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }
      }}
      className="w-full text-left bg-white dark:bg-[var(--mf-card)] rounded-2xl border border-[var(--mf-border)] p-4 md:p-5 space-y-3 cursor-pointer hover:border-[var(--mf-accent-border)] transition-all active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <AvatarCircle name={post.author.name} avatar={post.author.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-semibold text-[var(--mf-text-strong)]">{post.author.name}</span>
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] font-medium capitalize text-[11px]">{post.category}</span>
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--mf-text-strong)] leading-snug">{post.title}</h3>
          <p className="text-sm text-[var(--mf-muted)] line-clamp-2 mt-1.5 leading-relaxed">{post.body}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ChatCircleDots size={15} weight="regular" />
              {post.commentCount} {post.commentCount === 1 ? 'reply' : 'replies'}
            </span>
            {post.aiReplied && (
              <span className="flex items-center gap-1 text-purple-500">
                <Sparkle size={12} weight="fill" />
                AI replied
              </span>
            )}
            {post.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {post.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CommunityView() {
  const { user } = useStore()
  const qc = useQueryClient()
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentAnonymous, setCommentAnonymous] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionResults, setMentionResults] = useState<Array<{ id: string; name: string; role: string }>>([])
  const [showMentions, setShowMentions] = useState(false)
  const mentionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showMentions || !mentionQuery) {
      setMentionResults([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const data = await communityApi.searchUsers(mentionQuery)
        setMentionResults(data.users)
      } catch {
        setMentionResults([])
      }
    }, 200)
    return () => clearTimeout(t)
  }, [mentionQuery, showMentions])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mentionRef.current && !mentionRef.current.contains(e.target as Node)) {
        setShowMentions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: list, isLoading } = useCommunityPosts(category === 'all' ? undefined : category, page)
  const { data: detail } = useCommunityPost(selectedPostId || '')
  const addComment = useAddComment()

  const handlePostClick = (id: string) => {
    setSelectedPostId(id)
    setCommentText('')
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !selectedPostId) return
    try {
      await addComment.mutateAsync({ postId: selectedPostId, data: { body: commentText.trim(), isAnonymous: commentAnonymous } })
      setCommentText('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add comment')
    }
  }

  const handleDeletePost = async (postId: string) => {
    setConfirmDeleteId(postId)
  }

  const confirmDelete = async () => {
    if (!confirmDeleteId) return
    try {
      await communityApi.deletePost(confirmDeleteId)
      qc.setQueryData<import('../services/communityService').ApiPostList>(['community', 'posts', undefined, 1], (old) => {
        if (!old) return old
        return { ...old, posts: old.posts.filter(p => p._id !== confirmDeleteId), total: old.total - 1 }
      })
      toast.success('Post deleted')
      setSelectedPostId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete post')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  if (selectedPostId && detail) {
    return (
      <div className="dashboard-flo-theme relative min-h-screen animate-in fade-in duration-200">
        <main className="flo-main-container pb-24 md:pb-32 pt-6 md:pt-10">
          <div className="flo-content-inner max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-5 px-1">
              <button
                type="button"
                onClick={() => setSelectedPostId(null)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--mf-text-strong)] transition-colors cursor-pointer"
              >
                <ArrowLeft size={18} weight="bold" />
                <span>Back</span>
              </button>
              {detail.post.userId === user?.id && (
                <button
                  type="button"
                  onClick={() => handleDeletePost(detail.post._id)}
                  className="flex items-center gap-1.5 text-xs text-[var(--mf-danger)] hover:opacity-80 transition-colors cursor-pointer"
                >
                  <Trash size={14} />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-[var(--mf-card)] rounded-3xl border border-[var(--mf-border)] p-5 md:p-7 space-y-4">
              <div className="flex items-center gap-3">
                <AvatarCircle name={detail.post.author.name} avatar={detail.post.author.avatar} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--mf-text-strong)]">{detail.post.author.name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-full bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] font-medium capitalize text-[11px]">{detail.post.category}</span>
                    <span>·</span>
                    <span>{timeAgo(detail.post.createdAt)}</span>
                    {detail.post.location && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1"><MapPin size={12} />{detail.post.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <h1 className="text-xl md:text-2xl font-semibold text-[var(--mf-text-strong)] leading-tight">{detail.post.title}</h1>
              <p className="text-sm text-[var(--mf-text)] leading-relaxed whitespace-pre-wrap">{detail.post.body}</p>
            </div>

            <div className="mt-6 md:mt-8 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--mf-text-strong)] px-1">
                {detail.comments.length > 0
                  ? `${detail.comments.length} ${detail.comments.length === 1 ? 'reply' : 'replies'}`
                  : 'No replies yet'}
              </h3>

              <div className="space-y-3">
                {detail.comments.map(c => (
                  <div
                    key={c._id}
                    className="bg-white dark:bg-[var(--mf-card)] rounded-2xl border border-[var(--mf-border)] p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      {c.isAI ? (
                        <div className="size-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">AI</div>
                      ) : (
                        <AvatarCircle name={c.author.name} avatar={c.author.avatar} size="sm" />
                      )}
                      <span className="text-sm font-semibold text-[var(--mf-text-strong)]">{c.author.name}</span>
                      {c.isAI && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-purple-500 font-medium">Assistant</span>}
                      <span className="text-xs text-muted-foreground ml-auto">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[var(--mf-text)] leading-relaxed pl-9">{c.body}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-[var(--mf-card)] rounded-2xl border border-[var(--mf-border)] p-4 space-y-3">
                <div className="relative">
                  <textarea
                    aria-label="Write a comment"
                    value={commentText}
                    onChange={e => {
                      const val = e.target.value
                      setCommentText(val)
                      const cursorPos = e.target.selectionStart
                      const textBefore = val.slice(0, cursorPos)
                      const atMatch = textBefore.match(/@(\w*)$/)
                      if (atMatch) {
                        setMentionQuery(atMatch[1])
                        setShowMentions(true)
                      } else {
                        setShowMentions(false)
                      }
                    }}
                    placeholder="Write a reply..."
                    className="w-full min-h-[80px] px-4 py-3 rounded-2xl bg-[var(--mf-elevated)] border border-[var(--mf-border)] text-sm text-[var(--mf-text-strong)] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--mf-ring)] resize-none transition-all"
                    maxLength={5000}
                  />
                  {showMentions && mentionResults.length > 0 && (
                    <div ref={mentionRef} className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-[var(--mf-border)] rounded-xl shadow-lg overflow-hidden z-20 max-h-36 overflow-y-auto">
                      {mentionResults.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onMouseDown={e => {
                            e.preventDefault()
                            setCommentText(prev => {
                              const before = prev.replace(/@\w*$/, `@${u.name} `)
                              return before
                            })
                            setShowMentions(false)
                            setMentionQuery('')
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--mf-accent-soft)] transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <div className="size-6 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[10px] font-semibold text-[var(--mf-accent)]">
                            {u.name[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-[var(--mf-text-strong)]">{u.name}</span>
                          <span className="text-muted-foreground ml-auto">{u.role === 'partner' ? 'Partner' : 'Member'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {commentText.toLowerCase().includes('@men') && !commentText.toLowerCase().includes('@mensflow') && (
                    <div className="absolute -bottom-2 left-3 translate-y-full bg-white dark:bg-gray-800 border border-[var(--mf-border)] rounded-xl shadow-lg px-3 py-2 text-xs text-muted-foreground flex items-center gap-2 z-10 animate-in fade-in slide-in-from-top-1">
                      <span className="text-purple-500 font-semibold">@mensflow</span>
                      <span>— Ask MensFlow AI to answer</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                      <input type="checkbox" checked={commentAnonymous} onChange={e => setCommentAnonymous(e.target.checked)} className="accent-[var(--mf-accent)]" />
                      Reply anonymously
                    </label>
                    <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                      <Sparkle size={10} className="text-purple-500" />
                      @mensflow
                    </span>
                  </div>
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || addComment.isPending}
                    className="h-9 px-5 rounded-xl bg-[var(--mf-accent)] text-white text-sm font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {addComment.isPending ? (
                      <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      'Reply'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
          <DialogContent className="sm:max-w-[360px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Delete post?</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={confirmDelete} className="flex-1 rounded-xl bg-[var(--mf-danger)] hover:bg-[var(--mf-danger)]/90 text-white">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="dashboard-flo-theme relative min-h-screen">
      <main className="flo-main-container pt-6 md:pt-10 pb-24 md:pb-32">
        <div className="flo-content-inner max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-gradient-to-br from-[var(--mf-accent-soft)] to-[var(--mf-accent-soft)]/60 flex items-center justify-center text-[var(--mf-accent)]">
                <ChatCircleDots size={22} weight="bold" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--mf-text-strong)] tracking-tight">Community</h1>
                <p className="text-xs text-muted-foreground">Connect with others on their journey</p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreate(true)}
              size="sm"
              className="rounded-xl gap-1.5 h-9 text-xs"
            >
              <Plus size={16} weight="bold" />
              New Post
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 md:-mx-0 px-4 md:px-0 scrollbar-hide no-scrollbar mb-6">
            {CATEGORIES.map(cat => {
              const active = category === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setCategory(cat.id); setPage(1) }}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer border shrink-0',
                    active
                      ? 'bg-[var(--mf-accent)] text-white border-[var(--mf-accent)]'
                      : 'bg-white/70 dark:bg-[var(--mf-card)]/80 text-muted-foreground border-[var(--mf-border)] backdrop-blur-sm hover:border-[var(--mf-accent-border)]',
                  )}
                >
                  {React.createElement(cat.Icon, { size: 14, className: active ? 'text-white' : 'text-[var(--mf-accent)]' })}
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="size-10 rounded-full border-3 border-[var(--mf-border)] border-t-[var(--mf-accent)] animate-spin" />
            </div>
          ) : list && list.posts.length > 0 ? (
            <div className="space-y-3 pb-4">
              {list.posts.map(post => (
                <PostCard key={post._id} post={post} onClick={() => handlePostClick(post._id)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-5 px-4">
              <div className="size-20 rounded-2xl bg-gradient-to-br from-[var(--mf-accent-soft)] to-[var(--mf-accent-soft)]/40 flex items-center justify-center text-[var(--mf-accent)] border border-[var(--mf-accent-border)]">
                <ChatCircleDots size={36} weight="thin" />
              </div>
              <div className="text-center space-y-1.5 max-w-xs">
                <p className="text-base font-semibold text-[var(--mf-text-strong)]">No discussions yet</p>
                <p className="text-sm text-muted-foreground">Be the first to start a conversation!</p>
              </div>
              <Button
                onClick={() => setShowCreate(true)}
                className="rounded-xl gap-1.5"
              >
                <Plus size={16} weight="bold" />
                Create a Post
              </Button>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showCreate && <CreatePostModal open={showCreate} onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete post?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-xl">Cancel</Button>
            <Button onClick={confirmDelete} className="flex-1 rounded-xl bg-[var(--mf-danger)] hover:bg-[var(--mf-danger)]/90 text-white">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
