// One component for all three heading levels — they differ only in size,
// weight and breathing room, so a lookup table beats three near-identical
// files. The semantic h1/h2/h3 tag matters for the print/PDF export, where
// the browser's outline gives screen readers and PDF bookmarks real structure.

import ContentEditable from '../components/ContentEditable'
import { BlockType } from '../types/blockTypes'

const STYLES = {
  [BlockType.HEADING1]: { tag: 'h1', className: 'text-[32px] font-bold leading-tight pt-6 pb-1' },
  [BlockType.HEADING2]: { tag: 'h2', className: 'text-[25px] font-semibold leading-tight pt-4 pb-1' },
  [BlockType.HEADING3]: { tag: 'h3', className: 'text-[20px] font-semibold leading-tight pt-3 pb-0.5' },
}

export default function HeadingBlock({ block, editor, onKeyDown }) {
  const { tag, className } = STYLES[block.type]
  return (
    <ContentEditable
      block={block}
      editor={editor}
      onKeyDown={onKeyDown}
      tag={tag}
      placeholder={`Heading ${block.type.slice(-1)}`}
      className={`text-ink ${className}`}
    />
  )
}
