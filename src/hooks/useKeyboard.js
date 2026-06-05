// Keyboard behavior for text blocks, centralized so every block type gets
// identical handling. Returns a keydown handler plus the inline-format
// helpers shared with the floating toolbar.
//
// On execCommand: yes, it's deprecated — but it remains implemented in every
// shipping browser, it integrates with the native undo stack for free, and
// replacing it means hand-rolling Range surgery for bold/italic/underline.
// For a local-first editor this is the right trade.

import { useCallback } from 'react'
import { isListBlock } from '../types/blockTypes'

// Is the caret sitting inside a <code> element? Drives the inline-code toggle
// and the toolbar's active state.
export function selectionInsideCode() {
  const sel = window.getSelection()
  if (!sel || !sel.anchorNode) return null
  let node = sel.anchorNode
  while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode
  return node?.closest('code') || null
}

// Toggle a <code> wrap around the current selection. execCommand has no
// concept of inline code, so this one we do by hand: wrap via insertHTML
// going in, and unwrap by replacing the <code> element with its children
// coming out.
export function toggleInlineCode() {
  const existing = selectionInsideCode()
  if (existing) {
    const parent = existing.parentNode
    while (existing.firstChild) parent.insertBefore(existing.firstChild, existing)
    parent.removeChild(existing)
    parent.normalize()
    return
  }
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) return
  const text = sel.toString()
  // Escape the selected text — it's about to be re-inserted as HTML.
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  document.execCommand('insertHTML', false, `<code>${escaped}</code>`)
}

export function applyFormat(command) {
  if (command === 'code') toggleInlineCode()
  else document.execCommand(command, false)
}

// Caret-position probe: true when nothing precedes the (collapsed) caret.
// Backspace uses it to decide between deleting text and merging blocks.
function caretAtStart(el) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return false
  const range = sel.getRangeAt(0).cloneRange()
  range.selectNodeContents(el)
  range.setEnd(sel.anchorNode, sel.anchorOffset)
  return range.toString() === ''
}

// Serialize the HTML on each side of the caret — the raw material for
// Enter-splitting a block. cloneContents keeps formatting tags intact, so
// splitting inside a bold run leaves both halves bold.
function splitAtCaret(el) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  const beforeRange = range.cloneRange()
  beforeRange.selectNodeContents(el)
  beforeRange.setEnd(range.startContainer, range.startOffset)
  const afterRange = range.cloneRange()
  afterRange.selectNodeContents(el)
  afterRange.setStart(range.endContainer, range.endOffset)

  const serialize = (fragment) => {
    const div = document.createElement('div')
    div.appendChild(fragment)
    return div.innerHTML
  }
  return {
    before: serialize(beforeRange.cloneContents()),
    after: serialize(afterRange.cloneContents()),
  }
}

export function useKeyboard({ block, editor, onSlash }) {
  return useCallback((e) => {
    const mod = e.metaKey || e.ctrlKey

    // Inline formatting shortcuts: Ctrl/Cmd+B, I, U, and ` for inline code.
    if (mod) {
      const command = { b: 'bold', i: 'italic', u: 'underline', '`': 'code' }[e.key]
      if (command) {
        e.preventDefault()
        applyFormat(command)
        return
      }
    }

    switch (e.key) {
      case 'Enter':
        // Plain Enter splits the block at the caret — text after the cursor
        // moves into the new block, exactly like every editor users know.
        // Shift+Enter falls through to the browser's soft line-break.
        if (!e.shiftKey) {
          e.preventDefault()
          const parts = splitAtCaret(e.currentTarget)
          if (parts) editor.insertBlockAfter(block.id, parts.before, parts.after)
          else editor.insertBlockAfter(block.id)
        }
        break

      case 'Backspace': {
        const el = e.currentTarget
        if (el.textContent === '') {
          // Empty block → remove it (lists downgrade first; see deleteBlock).
          e.preventDefault()
          editor.deleteBlock(block.id)
        } else if (caretAtStart(el)) {
          // Caret at the very start with content → flow this block's text
          // into the one above. The inverse of Enter-split.
          e.preventDefault()
          editor.mergeWithPrevious(block.id)
        }
        break
      }

      case 'Tab':
        // Indentation is a list concept; in other blocks Tab keeps its
        // browser default (focus move) suppressed to avoid jarring jumps.
        e.preventDefault()
        if (isListBlock(block.type)) {
          editor.indentBlock(block.id, e.shiftKey ? -1 : 1)
        }
        break

      case 'ArrowUp':
      case 'ArrowDown': {
        // Multi-line blocks should keep native caret movement within
        // themselves; only hop blocks at the boundary. A cheap proxy: compare
        // the caret's rect against the block's — if moving up while on the
        // first line (or down on the last), cross over.
        const sel = window.getSelection()
        if (!sel || sel.rangeCount === 0) break
        const rects = sel.getRangeAt(0).getClientRects()
        const caretRect = rects[rects.length - 1] || e.currentTarget.getBoundingClientRect()
        const blockRect = e.currentTarget.getBoundingClientRect()
        const lineHeight = parseFloat(getComputedStyle(e.currentTarget).lineHeight) || 24

        if (e.key === 'ArrowUp' && caretRect.top - blockRect.top < lineHeight) {
          e.preventDefault()
          editor.focusNeighbor(block.id, -1)
        } else if (e.key === 'ArrowDown' && blockRect.bottom - caretRect.bottom < lineHeight) {
          e.preventDefault()
          editor.focusNeighbor(block.id, 1)
        }
        break
      }

      case '/':
        // Only an empty block summons the menu — mid-sentence slashes (dates,
        // paths, "and/or") must type normally. The "/" still gets typed; the
        // menu tracks and strips it on selection.
        if (e.currentTarget.textContent === '') {
          onSlash(block.id, e.currentTarget)
        }
        break

      default:
        break
    }
  }, [block.id, block.type, editor, onSlash])
}
