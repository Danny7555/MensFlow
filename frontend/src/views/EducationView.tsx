import { useState, useEffect, Fragment, useCallback } from 'react'
import { useQueryState, parseAsStringEnum } from 'nuqs'
import { cn } from '../lib/utils'
import { useAuth } from '@/context/useAuth'
import { resolveAssetUrl } from '../lib/apiClient'
import { TipsSkeleton } from '../components/skeletons/TipsSkeleton'
import { DailyQuiz } from '../components/dashboard/DailyCheckIn'
import { educationApi } from '../services/educationService'
import type { ApiEducationArticle } from '../services/educationService'
import { toast } from 'sonner'
import { EducationFormModal } from '../components/education/EducationFormModal'
import { useSEO } from '../hooks/useSEO'
import { HormoneSimulator } from '../components/education/HormoneSimulator'
import {
  Brain,
  Drop,
  Moon,
  Heartbeat,
  ShieldPlus,
  Sparkle,
  BookOpen,
} from '@phosphor-icons/react'

// Categories
const EDUCATION_CATEGORIES = ['All', 'Hormones', 'Phases', 'Care'] as const
type EduCategory = (typeof EDUCATION_CATEGORIES)[number]

// Icon Map for dynamic lookup
const ICON_MAP: Record<string, React.ElementType> = {
  Brain, Drop, Moon, Heartbeat, ShieldPlus, Sparkle, BookOpen,
}

// ─── Article Card ─────────────────────────────────────────────────────────────
interface ArticleCardProps {
  article: ApiEducationArticle
  isFeatured: boolean
}

function ArticleCard({ article, isFeatured }: ArticleCardProps) {
  const IconComponent = ICON_MAP[article.iconName] || BookOpen
  const [imageError, setImageError] = useState(false)

  return (
    <Fragment>
      <article
        className={cn(
          'dash-panel p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 h-full group/card',
          isFeatured && 'md:col-span-2 lg:col-span-2 md:flex-row gap-8 items-center bg-gradient-to-br from-card via-card to-[var(--mf-accent-soft)]/30 min-h-[280px]',
        )}
      >

        {isFeatured ? (
          <div className="absolute -right-8 -bottom-8 opacity-[0.15] pointer-events-none rotate-6">
            {article.image && !imageError ? (
              <img loading="lazy" src={resolveAssetUrl(article.image)} alt="" className="size-[300px] object-cover rounded-full" onError={() => setImageError(true)} />
            ) : (
              <IconComponent size={340} weight="duotone" className="text-[var(--mf-accent)]" />
            )}
          </div>
        ) : (
          <div className="absolute -right-4 -bottom-4 opacity-[0.1] pointer-events-none">
            {article.image && !imageError ? (
              <img loading="lazy" src={resolveAssetUrl(article.image)} alt="" className="size-[120px] object-cover rounded-full" onError={() => setImageError(true)} />
            ) : (
              <IconComponent size={180} weight="duotone" />
            )}
          </div>
        )}

        <div className={cn('flex flex-col gap-4 relative z-10 w-full h-full justify-between', isFeatured && 'md:flex-1 md:py-4')}>
          <div>
            <div className="flex items-center justify-between">
              <div className={cn('text-foreground', isFeatured && 'text-[var(--mf-accent)]')}>
                {article.image && !imageError ? (
                  <div className="size-12 rounded-xl overflow-hidden border border-border/30">
                    <img loading="lazy" src={resolveAssetUrl(article.image)} alt="" className="size-full object-cover" onError={() => setImageError(true)} />
                  </div>
                ) : (
                  <IconComponent size={isFeatured ? 44 : 32} weight="duotone" />
                )}
              </div>
              <span className="text-[10px] font-normal uppercase tracking-[0.15em] text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                {article.category}
              </span>
            </div>

            <div className="flex-1 space-y-4 mt-2">
              <h3 className={cn(
                'text-lg font-normal text-foreground leading-tight',
                isFeatured && 'text-3xl md:text-4xl tracking-tight max-w-[80%]',
              )}>
                {article.title}
              </h3>
              <p className={cn(
                'text-sm text-muted-foreground leading-relaxed',
                isFeatured && 'text-base md:text-lg max-w-[500px] opacity-90',
              )}>
                {article.description}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border/50 flex justify-between items-center text-[11px] text-muted-foreground font-normal uppercase tracking-widest">
            <span className="flex items-center gap-2">{article.readTime}</span>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--mf-accent)] flex items-center gap-1 group cursor-pointer hover:underline"
            >
              Read guide <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>
      </article>
    </Fragment>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────
export function EducationView() {
  useSEO({
    title: 'Educational Guides',
    description: 'Browse expert-reviewed medical guides on hormones, cycle phases, and care suggestions.',
    keywords: 'menstrual education, hormone guides, cycle phases, phase care, women health guides'
  })
  const { isAuthenticated, openAuthModal } = useAuth()
  const [state, setState] = useState({
    articles: [] as ApiEducationArticle[],
    isLoading: true,
    errored: false,
    activeTab: 'guides' as 'guides' | 'simulator',
    isModalOpen: false,
  })
  const { articles, isLoading, errored, activeTab, isModalOpen } = state
  const editingArticle: ApiEducationArticle | null = null

  const fetchArticles = useCallback(async () => {
    try {
      const data = await educationApi.getArticles()
      setState(prev => ({ ...prev, articles: data, isLoading: false }))
    } catch (err) {
      console.error('Failed to load articles:', err)
      toast.error('Could not fetch educational guides from server.')
      setState(prev => ({ ...prev, errored: true, isLoading: false }))
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { fetchArticles() }, 0)
    return () => clearTimeout(timer)
  }, [fetchArticles])

  const [activeCategory] = useQueryState(
    'topic',
    parseAsStringEnum<EduCategory>(EDUCATION_CATEGORIES as unknown as EduCategory[])
      .withDefault('All')
      .withOptions({ shallow: false }),
  )


  if (isLoading) {
    return <TipsSkeleton />
  }

  if (errored) {
    return (
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-6 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="size-16 rounded-2xl bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center">
            <BookOpen size={32} weight="thin" />
          </div>
          <div className="text-center space-y-1.5 max-w-xs">
            <p className="text-base font-semibold text-[var(--mf-text-strong)]">Could not load guides</p>
            <p className="text-sm text-muted-foreground">Something went wrong. Please try again.</p>
            <button
              type="button"
              onClick={fetchArticles}
              className="mt-4 px-6 py-2.5 rounded-full bg-[var(--mf-accent)] text-white text-sm font-medium hover:brightness-110 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const filteredArticles = articles.filter(
    (art) => activeCategory === 'All' || art.category === activeCategory,
  )

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-6 space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex flex-col gap-1.5 text-left">
        <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--mf-text-strong)]" id="education-title">Educational Guides</h1>
        <p className="text-xs text-muted-foreground">Expert-reviewed resources on hormones, cycle phases, and self-care.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60 mb-6 w-full justify-start gap-1">
        <button
          type="button"
          onClick={() => setState(prev => ({ ...prev, activeTab: 'guides' }))}
          className={cn(
            'px-6 py-2.5 text-sm font-normal border-b-2 transition-all cursor-pointer outline-none',
            activeTab === 'guides'
              ? 'border-[var(--mf-accent)] text-[var(--mf-accent)] font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Educational Guides
        </button>
        <button
          type="button"
          onClick={() => setState(prev => ({ ...prev, activeTab: 'simulator' }))}
          className={cn(
            'px-6 py-2.5 text-sm font-normal border-b-2 transition-all cursor-pointer outline-none',
            activeTab === 'simulator'
              ? 'border-[var(--mf-accent)] text-[var(--mf-accent)] font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Hormone Simulator
        </button>
      </div>

      {activeTab === 'simulator' ? (
        <HormoneSimulator />
      ) : (
        <>
          {/* Daily Quiz Integration */}
          <section className="w-full" aria-labelledby="education-title">
            <DailyQuiz />
          </section>

          <div className="relative">
            {filteredArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="size-16 rounded-2xl bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center">
                  <BookOpen size={32} weight="thin" />
                </div>
                <div className="text-center space-y-1.5 max-w-xs">
                  <p className="text-base font-semibold text-[var(--mf-text-strong)]">No guides found</p>
                  <p className="text-sm text-muted-foreground">Nothing here yet, but there's always more to explore. Try another category!</p>
                </div>
              </div>
            ) : (
              <>
                <section aria-label="Educational Guides" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {filteredArticles.map((article, index) => {
                    const isFeatured = index === 0
                    return (
                      <ArticleCard
                        key={article.id || article._id}
                        article={article}
                        isFeatured={isFeatured}
                      />
                    )
                  })}
                </section>

                {!isAuthenticated && (
                  <div className="absolute inset-x-0 bottom-0 top-[200px] bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20 flex flex-col items-center justify-center pt-24">
                    <div className="w-full h-full backdrop-blur-[6px] opacity-100" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-auto">
                      <div className="bg-card border border-border p-8 rounded-3xl text-center max-w-[400px] mx-auto">
                        <h3 className="text-xl font-normal mb-2">Read all guides</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                          Unlock our full library of expert-reviewed menstrual health guides by signing in.
                        </p>
                        <button
                          type="button"
                          onClick={() => openAuthModal()}
                          className="btn btn-primary px-8 py-3 rounded-full"
                        >
                          Log in to access
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      <EducationFormModal
        open={isModalOpen}
        editingArticle={editingArticle}
        onClose={() => setState(prev => ({ ...prev, isModalOpen: false }))}
        onSaved={fetchArticles}
      />
    </div>
  )
}
