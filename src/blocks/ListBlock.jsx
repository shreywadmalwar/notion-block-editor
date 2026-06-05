// A list block is a single item, Notion-style — there is no <ul>/<ol>
// wrapper in the editor. Consecutive list blocks simply look like a list.
// That makes reordering and transforming items trivial (each is independent),
// at the cost of computing numbered-list counters externally: Editor counts
// the run of preceding numbered siblings and passes the result as `number`.

import ContentEditable from '../components/ContentEditable'
import { BlockType } from '../types/blockTypes'

export default function ListBlock({ block, editor, onKeyDown, number }) {
  // Each indent level steps in by 24px — enough to read the hierarchy,
  // shallow enough that level 4 still fits comfortably in the 720px column.
  const indentPx = (block.indent || 0) * 24

  return (
    <div className="flex items-start py-0.5" style={{ paddingLeft: indentPx }}>
      <span className="w-6 shrink-0 select-none text-[18px] leading-8 text-ink text-center">
        {block.type === BlockType.BULLETED ? '•' : `${number}.`}
      </span>
      <ContentEditable
        block={block}
        editor={editor}
        onKeyDown={onKeyDown}
        placeholder="List item"
        className="flex-1 text-[18px] leading-8 text-ink"
      />
    </div>
  )
}
