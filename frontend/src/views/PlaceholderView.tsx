type PlaceholderViewProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function PlaceholderView({
  title,
  description,
  actionLabel,
  onAction,
}: PlaceholderViewProps) {
  return (
    <div className="placeholder-view">
      <h1 className="placeholder-title">{title}</h1>
      <p className="placeholder-desc">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
