import { Component, type ErrorInfo, type ReactNode } from 'react'
import { WarningCircle, ArrowLeft } from '@phosphor-icons/react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--mf-main-bg)] p-4">
          <div className="bg-[var(--mf-card)] border border-[var(--mf-border)] rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-[440px] w-full flex flex-col items-center gap-4 text-center shadow-xl">
            <div className="size-14 rounded-2xl bg-[var(--mf-danger-soft)] flex items-center justify-center text-[var(--mf-danger)]">
              <WarningCircle size={28} weight="duotone" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-medium text-[var(--mf-text-strong)] tracking-tight">
                Something went wrong
              </h2>
              <p className="text-sm text-[var(--mf-muted)] leading-relaxed max-w-sm">
                An unexpected error occurred. You can try refreshing or return to the home page.
              </p>
            </div>

            {this.state.error && (
              <details className="w-full bg-[var(--mf-elevated)] border border-[var(--mf-border)] rounded-xl p-3 text-left">
                <summary className="text-xs font-medium text-[var(--mf-muted)] cursor-pointer uppercase tracking-wider">
                  Technical details
                </summary>
                <pre className="mt-2 text-xs text-[var(--mf-muted)] whitespace-pre-wrap break-words leading-relaxed">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 h-12 bg-[var(--mf-accent)] text-white rounded-xl text-sm font-medium hover:brightness-110 transition-all cursor-pointer border-0"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = '/' }}
                className="flex-1 h-12 flex items-center justify-center gap-2 bg-transparent text-[var(--mf-muted)] border border-[var(--mf-border)] rounded-xl text-sm font-medium hover:bg-[var(--mf-hover)] transition-all cursor-pointer"
              >
                <ArrowLeft size={14} weight="bold" />
                <span>Go home</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}