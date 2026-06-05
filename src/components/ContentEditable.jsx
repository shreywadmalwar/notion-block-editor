// The one place in the app that touches contentEditable directly. Every text
// block (paragraph, headings, lists, quote) renders through this.
//
// The cardinal rule of contentEditable in React: never let React re-render
// the element's children while the user is typing, or the caret resets to the
// start on every keystroke. So this component is deliberately *uncontrolled* —
// React writes innerHTML only when the model content genuinely diverges from
// what's already in the DOM (a block transform, an undo, a document switch),
// and otherwise lets the browser own the subtree. onInput reports changes
// back up to state, which the DOM-equality check then recognizes as already
// applied and leaves alone.

import { useEffect, useLayoutEffect, useRef } from 'react'

// Put the caret at the start or end of an element's content.
function placeCaret(el, position) {
  el.focus()
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(position === 'start')
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

export default function ContentEditable({
  block,
  editor,
  onKeyDown,
  className = '',
  placeholder = '',
  tag: Tag = 'div',
}) {
  const ref = useRef(null)

  // Sync model → DOM, but only on real divergence (see header comment).
  useLayoutEffect(() => {
    if (ref.current && ref.current.innerHTML !== block.content) {
      ref.current.innerHTML = block.content
    }
  }, [block.content])

  // Honor a pending focus request for this block — a one-shot handoff from
  // useEditor after Enter/Backspace/transform restructured the document.
  useEffect(() => {
    const req = editor.consumeFocus(block.id)
    if (req && ref.current) placeCaret(ref.current, req.position)
  })

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      // The placeholder is rendered by CSS (:empty::before) off this data
      // attribute — contentEditable has no native placeholder support.
      data-placeholder={placeholder}
      className={`outline-none whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-ink-light/60 empty:before:pointer-events-none ${className}`}
      onInput={(e) => editor.updateBlock(block.id, { content: e.currentTarget.innerHTML })}
      onKeyDown={onKeyDown}
      // Pasting styled HTML from other apps would smuggle in fonts, colors
      // and divs that break the clean look — flatten everything to plain
      // text and let users re-apply formatting natively.
      onPaste={(e) => {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, text)
      }}
    />
  )
}
