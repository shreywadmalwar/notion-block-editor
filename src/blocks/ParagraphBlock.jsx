// The default block — plain prose. Also the only block that advertises the
// slash command in its placeholder, and only while focused, so an empty
// document doesn't shout "Type / for commands" from every line.

import { useState } from 'react'
import ContentEditable from '../components/ContentEditable'

export default function ParagraphBlock({ block, editor, onKeyDown }) {
  const [focused, setFocused] = useState(false)
  return (
    <div onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
      <ContentEditable
        block={block}
        editor={editor}
        onKeyDown={onKeyDown}
        placeholder={focused ? "Type '/' for commands…" : ''}
        className="text-[18px] leading-8 text-ink py-0.5"
      />
    </div>
  )
}
