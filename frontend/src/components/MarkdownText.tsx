import type { ReactNode } from 'react'

type MarkdownTextProps = {
  text: string
}

const parseInline = (str: string, lineId: string): ReactNode[] => {
  // Splits by **bold** text
  const parts = str.split(/(\*\*[^*]+\*\*)/g)
  let boldCount = 0
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      boldCount++
      return (
        <strong key={`${lineId}-b-${boldCount}`} className="font-semibold text-[var(--mf-text-strong)]">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

export function MarkdownText({ text }: MarkdownTextProps) {
  if (!text) return null

  const lines = text.split('\n').map((line, idx) => ({
    id: `ln-${idx}-${line.slice(0, 8)}`,
    text: line
  }))
  const elements: ReactNode[] = []
  let inList = false
  let listItems: ReactNode[] = []

  lines.forEach((lineObj) => {
    const line = lineObj.text
    const trimmed = line.trim()
    const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ')

    if (isBullet) {
      if (!inList) {
        inList = true
        listItems = []
      }
      const itemContent = trimmed.slice(2)
      listItems.push(
        <li key={`li-${lineObj.id}`} className="ml-5 list-disc text-left my-1 text-[var(--mf-text)]">
          {parseInline(itemContent, lineObj.id)}
        </li>
      )
    } else {
      if (inList) {
        inList = false
        elements.push(
          <ul key={`ul-${lineObj.id}`} className="my-2 space-y-1 list-disc">
            {listItems}
          </ul>
        )
      }
      if (trimmed) {
        elements.push(
          <p key={`p-${lineObj.id}`} className="my-2 text-left leading-relaxed text-[var(--mf-text)]">
            {parseInline(line, lineObj.id)}
          </p>
        )
      } else {
        elements.push(<div key={`br-${lineObj.id}`} className="h-2" />)
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
