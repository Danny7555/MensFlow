import { type ReactNode } from 'react'
import { m } from 'framer-motion'
import { useLocation } from 'react-router-dom'

interface Props {
  children: ReactNode
  className?: string
}

const iosTransition = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 32,
  mass: 1,
}

const iosVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

export function PageTransition({ children, className }: Props) {
  const { pathname } = useLocation()

  return (
    <m.div
      key={pathname}
      variants={iosVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={iosTransition}
      className={className}
      style={{ height: '100%', width: '100%' }}
    >
      {children}
    </m.div>
  )
}
