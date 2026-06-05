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
      // Not editable, but clickable-to-delete via the handle; the hit area is
      // taller than the 1px rule so it's actually possible to interact with.
      return (
        <div className="py-3 flex items-center" role="separator">
          <hr className="w-full border-t border-black/15" />
        </div>
      )
    default:
      return <ParagraphBlock block={block} editor={editor} onKeyDown={onKeyDown} />
  }
}
