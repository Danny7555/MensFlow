import { useState } from 'react'
import { cn } from '../lib/utils'
import { EDUCATION_ARTICLES, EDUCATION_CATEGORIES } from '../data/educationData'
import type { EduCategory } from '../data/educationData'

export function EducationView() {
  const [activeCategory, setActiveCategory] = useState<EduCategory>('All')

  const filteredArticles = EDUCATION_ARTICLES.filter(
    (art) => activeCategory === 'All' || art.category === activeCategory
  )

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">


      {/* Category Filter */}
      <section aria-label="Filter guides by category" className="flex flex-wrap gap-2 justify-center">
        {EDUCATION_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer",
              activeCategory === cat
                ? "bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border-[var(--mf-accent-border)] shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Article Grid */}
      <section aria-label="Educational Guides" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {filteredArticles.map((article, index) => {
          const Icon = article.icon
          const isFeatured = activeCategory === 'All' && index === 0

          return (
            <article 
              key={article.id} 
              className={cn(
                "dash-panel p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-300",
                isFeatured && "md:col-span-2 lg:col-span-2 md:flex-row gap-8 items-center bg-gradient-to-br from-card via-card to-[var(--mf-accent-soft)]/30 min-h-[280px]"
              )}
            >
              {/* Large Background Icon for Featured */}
              {isFeatured ? (
                <div className="absolute -right-12 -bottom-12 opacity-[0.08] pointer-events-none rotate-12">
                  <Icon size={340} weight="duotone" className="text-[var(--mf-accent)]" />
                </div>
              ) : (
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none">
                  <Icon size={180} weight="duotone" />
                </div>
              )}

              <div className={cn("flex flex-col gap-4 relative z-10 w-full", isFeatured && "md:flex-1 md:py-4")}>
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "p-3 bg-muted rounded-xl text-foreground",
                    isFeatured && "p-4 bg-[var(--mf-accent-soft)] text-[var(--mf-accent)]"
                  )}>
                    <Icon size={isFeatured ? 36 : 24} weight="duotone" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                    {article.category}
                  </span>
                </div>
                
                <div className="flex-1 space-y-4 mt-2">
                  <h3 className={cn(
                    "text-lg font-semibold text-foreground leading-tight",
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

                <div className="mt-6 pt-6 border-t border-border/50 flex justify-between items-center text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    {article.readTime}
                  </span>
                  <span className="text-[var(--mf-accent)] flex items-center gap-1 group cursor-pointer hover:underline">
                    Read guide <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
