// The type → component switchboard. Block.jsx handles chrome (drag handle,
// sortable wiring); this decides what actually renders inside. Keyboard
// handling is created here once so every text block shares identical behavior.

import { BlockType } from '../types/blockTypes'
import { useKeyboard } from '../hooks/useKeyboard'
import ParagraphBlock from '../blocks/ParagraphBlock'
import HeadingBlock from '../blocks/HeadingBlock'
import ListBlock from '../blocks/ListBlock'
import CodeBlock from '../blocks/CodeBlock'
import QuoteBlock from '../blocks/QuoteBlock'

export default function BlockRenderer({ block, editor, onSlash, number }) {
  const onKeyDown = useKeyboard({ block, editor, onSlash })

  switch (block.type) {
    case BlockType.HEADING1:
    case BlockType.HEADING2:
    case BlockType.HEADING3:
      return <HeadingBlock block={block} editor={editor} onKeyDown={onKeyDown} />
    case BlockType.BULLETED:
    case BlockType.NUMBERED:
      return <ListBlock block={block} editor={editor} onKeyDown={onKeyDown} number={number} />
    case BlockType.CODE:
      return <CodeBlock block={block} editor={editor} />
    case BlockType.QUOTE:
      return <QuoteBlock block={block} editor={editor} onKeyDown={onKeyDown} />
    case BlockType.DIVIDER:
      // No caret can live inside a divider, so it takes focus as a whole:
      // click selects it (tinted background), Backspace/Delete removes it,
      // arrows move on. Without this a divider would be immortal — every
      // block the user can create must be deletable.
      return (
        <div
          role="button"
          tabIndex={0}
          aria-label="Divider — press Backspace to delete"
          onKeyDown={(e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
              e.preventDefault()
              editor.deleteBlock(block.id)
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault()
              editor.focusNeighbor(block.id, e.key === 'ArrowUp' ? -1 : 1)
            }
          }}
          className="py-3 flex items-center rounded outline-none cursor-pointer focus:bg-blue-500/[0.07]"
        >
          <hr className="w-full border-t border-line-strong" />
        </div>
      )
    default:
      return <ParagraphBlock block={block} editor={editor} onKeyDown={onKeyDown} />
  }
}
