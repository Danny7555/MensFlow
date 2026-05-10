import { useState } from 'react'
import { BookOpen } from '@phosphor-icons/react'
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
      <header className="page-hero mt-2">
        <div className="page-hero-icon">
          <BookOpen size={26} weight="duotone" aria-hidden />
        </div>
        <h1 className="page-hero-title">Education</h1>
        <p className="page-hero-desc">
          Structured guides on hormones, phases, and when to seek care.
        </p>
      </header>

      {/* Category Filter */}
      <section aria-label="Filter guides by category" className="flex flex-wrap gap-2">
        {EDUCATION_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer",
              activeCategory === cat
                ? "bg-[#2ebcc5] text-white border-[#2ebcc5] shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Article Grid */}
      <section aria-label="Educational Guides" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => {
          const Icon = article.icon
          return (
            <article 
              key={article.id} 
              className="dash-panel p-6 flex flex-col gap-4 cursor-pointer hover:border-foreground transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-muted rounded-xl text-foreground group-hover:bg-[#2ebcc5] group-hover:text-white transition-colors duration-300">
                  <Icon size={24} weight="duotone" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-md">
                  {article.category}
                </span>
              </div>
              
              <div className="flex-1 space-y-2 mt-2">
                <h3 className="text-lg font-semibold text-foreground leading-tight">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {article.description}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-muted-foreground font-medium">
                <span>{article.readTime}</span>
                <span className="text-[#2ebcc5] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Read guide →
                </span>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
