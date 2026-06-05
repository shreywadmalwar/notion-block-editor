// The editor's entire block state and every operation on it. Components stay
// dumb: they call these operations and render the result. Focus is the one
// piece of "imperative" state we track here — contentEditable focus can't be
// derived from props, so after structural edits (enter, backspace, transform)
// we record which block should grab the caret and where, and the block
// components honor it on their next render.

import { useCallback, useRef, useState } from 'react'
import { BlockType, createBlock, isListBlock } from '../types/blockTypes'

export function useEditor(initialBlocks) {
  const [blocks, setBlocks] = useState(initialBlocks)

  // { id, position: 'start' | 'end' } — a one-shot request consumed by the
  // block that matches it. A ref, not state: focusing shouldn't itself cause
  // a re-render cascade, the structural change already re-rendered.
  const focusRequest = useRef(null)

  const requestFocus = useCallback((id, position = 'end') => {
    focusRequest.current = { id, position }
  }, [])

  // Blocks consume the request exactly once so a later unrelated render
  // doesn't yank the caret back.
  const consumeFocus = useCallback((id) => {
    if (focusRequest.current?.id === id) {
      const req = focusRequest.current
      focusRequest.current = null
      return req
    }
    return null
  }, [])

  const updateBlock = useCallback((id, patch) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }, [])

  // Enter: a fresh paragraph below the current block. New blocks are always
  // paragraphs (Notion behaves the same) except inside lists, where the flow
  // of "enter, enter, enter" should keep producing list items at the same
  // indent — breaking out requires backspace or the slash menu.
  const insertBlockAfter = useCallback((id) => {
    let newId = null
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx === -1) return prev
      const current = prev[idx]
      const continuesList = isListBlock(current.type) && current.content !== ''
      const fresh = continuesList
        ? createBlock(current.type, '', { indent: current.indent })
        : createBlock()
      newId = fresh.id
      return [...prev.slice(0, idx + 1), fresh, ...prev.slice(idx + 1)]
    })
    if (newId) requestFocus(newId, 'start')
  }, [requestFocus])

  // Backspace on an empty block: remove it and put the caret at the end of
  // the previous block. An empty *list* block first downgrades to a paragraph
  // (Notion's "un-list" gesture) before a second backspace deletes it. The
  // last remaining block never deletes — the document always has somewhere
  // to type.
  const deleteBlock = useCallback((id) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx === -1) return prev
      const current = prev[idx]

      if (isListBlock(current.type) || current.type === BlockType.QUOTE) {
        requestFocus(id, 'end')
        return prev.map((b) =>
          b.id === id ? { ...b, type: BlockType.PARAGRAPH, indent: 0 } : b
        )
      }

      if (prev.length === 1) return prev
      const prevBlock = prev[idx - 1] || prev[idx + 1]
      if (prevBlock) requestFocus(prevBlock.id, 'end')
      return prev.filter((b) => b.id !== id)
    })
  }, [requestFocus])

  // Slash-menu selection lands here: swap the type in place, wiping the
  // residual "/query" text the user typed to filter the menu.
  const transformBlock = useCallback((id, type) => {
    setBlocks((prev) => prev.map((b) =>
      b.id === id ? { ...b, type, content: '', indent: 0 } : b
    ))
    requestFocus(id, 'start')

    // A divider isn't editable, so immediately give the user a paragraph
    // after it to keep typing into.
    if (type === BlockType.DIVIDER) {
      const fresh = createBlock()
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === id)
        return [...prev.slice(0, idx + 1), fresh, ...prev.slice(idx + 1)]
      })
      requestFocus(fresh.id, 'start')
    }
  }, [requestFocus])

  // Tab / Shift+Tab on list blocks. Indent is capped: deeper than 4 levels
  // stops being an outline and starts being an accident.
  const indentBlock = useCallback((id, delta) => {
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== id || !isListBlock(b.type)) return b
      return { ...b, indent: Math.max(0, Math.min(4, b.indent + delta)) }
    }))
  }, [])

  // dnd-kit hands us the dragged id and the id it was dropped over.
  const moveBlock = useCallback((activeId, overId) => {
    setBlocks((prev) => {
      const from = prev.findIndex((b) => b.id === activeId)
      const to = prev.findIndex((b) => b.id === overId)
      if (from === -1 || to === -1 || from === to) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  // Arrow-key navigation between blocks: find the editable neighbor.
  const focusNeighbor = useCallback((id, direction) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      let target = idx + direction
      // Skip over dividers — there's no caret position inside them.
      while (prev[target] && prev[target].type === BlockType.DIVIDER) target += direction
      if (prev[target]) requestFocus(prev[target].id, direction > 0 ? 'start' : 'end')
      return prev
    })
  }, [requestFocus])

  return {
    blocks,
    setBlocks,
    updateBlock,
    insertBlockAfter,
    deleteBlock,
    transformBlock,
    indentBlock,
    moveBlock,
    focusNeighbor,
    requestFocus,
    consumeFocus,
  }
}
