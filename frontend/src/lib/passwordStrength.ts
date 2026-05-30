export type StrengthLevel = 'Bad' | 'Good' | 'Excellent'

export interface PasswordStrengthResult {
  label: StrengthLevel
  color: string
  bgClass: string
  textClass: string
  percent: number
  isStrong: boolean
}

export function getPasswordStrength(password: string): PasswordStrengthResult | null {
  if (!password) return null

  const length = password.length
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  // Excellent: length >= 10, combines uppercase, lowercase, numbers, and special chars
  if (length >= 10 && hasUppercase && hasLowercase && hasNumbers && hasSpecial) {
    return {
      label: 'Excellent',
      color: '#10b981', // emerald-500
      bgClass: 'bg-emerald-500',
      textClass: 'text-emerald-500 dark:text-emerald-400',
      percent: 100,
      isStrong: true
    }
  }

  // Good: length >= 8, has at least 3 categories (e.g. upper, lower, numbers)
  const categoryCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length
  if (length >= 8 && categoryCount >= 3) {
    return {
      label: 'Good',
      color: '#f59e0b', // amber-500
      bgClass: 'bg-amber-500',
      textClass: 'text-amber-500 dark:text-amber-400',
      percent: 66,
      isStrong: true
    }
  }

  // Bad: length < 8, or lacks character variety
  return {
    label: 'Bad',
    color: '#ef4444', // rose-500
    bgClass: 'bg-rose-500',
    textClass: 'text-rose-500 dark:text-rose-400',
    percent: 33,
    isStrong: false
  }
}
