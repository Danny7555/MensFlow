import type { ReactNode } from 'react'

type MarkdownTextProps = {
  text: string
}

export function MarkdownText({ text }: MarkdownTextProps) {
  if (!text) return null

  const lines = text.split('\n')
  const elements: ReactNode[] = []
  let inList = false
  let listItems: ReactNode[] = []

  const parseInline = (str: string): ReactNode[] => {
    // Splits by **bold** text
    const parts = str.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-[var(--mf-text-strong)]">{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim()
    const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ')

    if (isBullet) {
      if (!inList) {
        inList = true
        listItems = []
      }
      const itemContent = trimmed.slice(2)
      listItems.push(
        <li key={`li-${lineIndex}`} className="ml-5 list-disc text-left my-1 text-[var(--mf-text)]">
          {parseInline(itemContent)}
        </li>
      )
    } else {
      if (inList) {
        inList = false
        elements.push(
          <ul key={`ul-${lineIndex}`} className="my-2 space-y-1 list-disc">
            {listItems}
          </ul>
        )
      }
      if (trimmed) {
        elements.push(
          <p key={`p-${lineIndex}`} className="my-2 text-left leading-relaxed text-[var(--mf-text)]">
            {parseInline(line)}
          </p>
        )
      } else {
        elements.push(<div key={`br-${lineIndex}`} className="h-2" />)
      }
    }
  })

  if (inList) {
    elements.push(
      <ul key="ul-end" className="my-2 space-y-1 list-disc">
        {listItems}
      </ul>
    )
  }

  return <div className="markdown-content">{elements}</div>
}
