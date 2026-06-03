import { useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { CaretUp } from '@phosphor-icons/react'

const scrollToTop = () => {
  const container = document.querySelector('.app-canvas')
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

export function ScrollToTop() {
  const [show, setShow] = useState(() => {
    if (typeof document !== 'undefined') {
      const container = document.querySelector('.app-canvas')
      return container ? container.scrollTop > 400 : false
    }
    return false
  })

  useEffect(() => {
    const container = document.querySelector('.app-canvas')
    if (!container) return

    const handleScroll = () => {
      setShow(container.scrollTop > 400)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <m.button
      type="button"
      className={`scroll-top-btn ${!show ? 'scroll-top-btn--hidden' : ''}`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
      initial={false}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ pointerEvents: show ? 'auto' : 'none' }}
    >
      <CaretUp size={22} weight="bold" />
    </m.button>
  )
}