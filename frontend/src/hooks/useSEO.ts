import { useEffect } from 'react'

export interface SEOOptions {
  title: string
  description?: string
  keywords?: string
}

export function useSEO({ title, description, keywords }: SEOOptions) {
  useEffect(() => {
    const originalTitle = document.title
    const originalDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
    const originalKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || ''
    const originalOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || ''
    const originalOgDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || ''
    const originalTwitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || ''
    const originalTwitterDescription = document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') || ''

    // Update title
    document.title = title ? `${title} | MensFlow` : 'MensFlow — menstrual health companion'

    // Update standard description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    const targetDesc = description || 'MensFlow is your personalized menstrual cycle and wellness companion, offering cycle tracking, symptom insights, educational resources, and supportive guidance.'
    metaDescription.setAttribute('content', targetDesc)

    // Update standard keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.setAttribute('name', 'keywords')
        document.head.appendChild(metaKeywords)
      }
      metaKeywords.setAttribute('content', keywords)
    }

    // Update Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (!ogTitle) {
      ogTitle = document.createElement('meta')
      ogTitle.setAttribute('property', 'og:title')
      document.head.appendChild(ogTitle)
    }
    ogTitle.setAttribute('content', title)

    let ogDescription = document.querySelector('meta[property="og:description"]')
    if (!ogDescription) {
      ogDescription = document.createElement('meta')
      ogDescription.setAttribute('property', 'og:description')
      document.head.appendChild(ogDescription)
    }
    ogDescription.setAttribute('content', targetDesc)

    // Update Twitter tags
    let twitterTitle = document.querySelector('meta[name="twitter:title"]')
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta')
      twitterTitle.setAttribute('name', 'twitter:title')
      document.head.appendChild(twitterTitle)
    }
    twitterTitle.setAttribute('content', title)

    let twitterDescription = document.querySelector('meta[name="twitter:description"]')
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta')
      twitterDescription.setAttribute('name', 'twitter:description')
      document.head.appendChild(twitterDescription)
    }
    twitterDescription.setAttribute('content', targetDesc)

    return () => {
      // Restore original tags
      document.title = originalTitle
      if (originalDescription) {
        document.querySelector('meta[name="description"]')?.setAttribute('content', originalDescription)
      } else {
        const d = document.querySelector('meta[name="description"]')
        if (d) document.head.removeChild(d)
      }

      if (originalKeywords) {
        document.querySelector('meta[name="keywords"]')?.setAttribute('content', originalKeywords)
      } else {
        const k = document.querySelector('meta[name="keywords"]')
        if (k) document.head.removeChild(k)
      }

      if (originalOgTitle) {
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', originalOgTitle)
      }
      if (originalOgDescription) {
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', originalOgDescription)
      }
      if (originalTwitterTitle) {
        document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', originalTwitterTitle)
      }
      if (originalTwitterDescription) {
        document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', originalTwitterDescription)
      }
    }
  }, [title, description, keywords])
}
