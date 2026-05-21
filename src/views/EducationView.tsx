import { useState, useEffect, Fragment } from 'react'
import { useQueryState, parseAsStringEnum } from 'nuqs'
import { cn } from '../lib/utils'
import { EDUCATION_ARTICLES, EDUCATION_CATEGORIES } from '../data/educationData'
import type { EduCategory } from '../data/educationData'
import { useAuth } from "@/context/useAuth"
import { TipsSkeleton } from '../components/skeletons/TipsSkeleton'
import { DailyQuiz } from '../components/dashboard/DailyCheckIn'

export function EducationView() {
  const { isAuthenticated, openAuthModal } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const [activeCategory, setActiveCategory] = useQueryState(
    'topic',
    parseAsStringEnum<EduCategory>(EDUCATION_CATEGORIES as unknown as EduCategory[])
      .withDefault('All')
      .withOptions({ shallow: false })
  )

  if (isLoading) {
    return <TipsSkeleton />
  }

  const filteredArticles = EDUCATION_ARTICLES.filter(
    (art) => activeCategory === 'All' || art.category === activeCategory
  )

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-6 space-y-8 animate-in fade-in duration-500 relative">
      
      {/* Category Filter */}
      <section aria-label="Filter guides by category" className="flex flex-wrap gap-2 justify-center">
        {EDUCATION_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-normal border transition-all duration-200 cursor-pointer",
              activeCategory === cat
                ? "bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border-[var(--mf-accent-border)]"
                : "bg-card text-muted-foreground border-border hover:border-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </section>

      <div className="relative">
        {/* Article Grid */}
        <section aria-label="Educational Guides" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Show Daily Quiz as the first item if not in 'All' category, to maintain visibility */}
          {activeCategory !== 'All' && (
            <div className="h-full flex flex-col md:col-span-2 lg:col-span-1">
              <DailyQuiz />
            </div>
          )}
          {filteredArticles.map((article, index) => {
            const Icon = article.icon
            const isFeatured = activeCategory === 'All' && index === 0

            return (
              <Fragment key={article.id}>
                <article 
                  className={cn(
                    "dash-panel p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 h-full",
                    isFeatured && "md:col-span-2 lg:col-span-2 md:flex-row gap-8 items-center bg-gradient-to-br from-card via-card to-[var(--mf-accent-soft)]/30 min-h-[280px]"
                  )}
                >
                  {/* Large Background Image for Featured */}
                  {isFeatured ? (
                    <div className="absolute -right-8 -bottom-8 opacity-[0.15] pointer-events-none rotate-6">
                      {article.image ? (
                        <img src={article.image} alt="" className="size-[300px] object-cover rounded-full" />
                      ) : (
                        <Icon size={340} weight="duotone" className="text-[var(--mf-accent)]" />
                      )}
                    </div>
                  ) : (
                    <div className="absolute -right-4 -bottom-4 opacity-[0.1] pointer-events-none">
                      {article.image ? (
                        <img src={article.image} alt="" className="size-[120px] object-cover rounded-full" />
                      ) : (
                        <Icon size={180} weight="duotone" />
                      )}
                    </div>
                  )}

                  <div className={cn("flex flex-col gap-4 relative z-10 w-full h-full justify-between", isFeatured && "md:flex-1 md:py-4")}>
                    <div>
                      <div className="flex items-center justify-between">
                        <div className={cn(
                          "text-foreground",
                          isFeatured && "text-[var(--mf-accent)]"
                        )}>
                          {article.image ? (
                            <div className="size-12 rounded-xl overflow-hidden">
                              <img src={article.image} alt="" className="size-full object-cover" />
                            </div>
                          ) : (
                            <Icon size={isFeatured ? 44 : 32} weight="duotone" />
                          )}
                        </div>
                        <span className="text-[10px] font-normal uppercase tracking-[0.15em] text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                          {article.category}
                        </span>
                      </div>
                      
                      <div className="flex-1 space-y-4 mt-2">
                        <h3 className={cn(
                          "text-lg font-normal text-foreground leading-tight",
                          isFeatured && "text-3xl md:text-4xl tracking-tight max-w-[80%]"
                        )}>
                          {article.title}
                        </h3>
                        <p className={cn(
                          "text-sm text-muted-foreground leading-relaxed",
                          isFeatured && "text-base md:text-lg max-w-[500px] opacity-90"
                        )}>
                          {article.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border/50 flex justify-between items-center text-[11px] text-muted-foreground font-normal uppercase tracking-widest">
                      <span className="flex items-center gap-2">
                        {article.readTime}
                      </span>
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
                
                {/* Insert Daily Quiz right after the featured article in 'All' category */}
                {isFeatured && (
                  <div className="h-full flex flex-col md:col-span-2 lg:col-span-1">
                    <DailyQuiz />
                  </div>
                )}
              </Fragment>
            )
          })}
        </section>

        {!isAuthenticated && (
          <div className="absolute inset-x-0 bottom-0 top-[200px] bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20 flex flex-col items-center justify-center pt-24">
            <div className="w-full h-full backdrop-blur-[6px] opacity-100" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-auto">
               <div className="bg-card border border-border p-8 rounded-3xl text-center max-w-[400px] mx-auto">
                <h3 className="text-xl font-normal mb-2">Read all guides</h3>
                <p className="text-muted-foreground text-sm mb-6">Unlock our full library of expert-reviewed menstrual health guides by signing in.</p>
                <button 
                  onClick={openAuthModal}
                  className="btn btn-primary px-8 py-3 rounded-full"
                >
                  Log in to access
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
