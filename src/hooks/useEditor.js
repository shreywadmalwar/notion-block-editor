// The editor's entire block state and every operation on it. Components stay
// dumb: they call these operations and render the result.
//
// Two pieces of machinery underpin everything:
//
// 1. History. Every mutation funnels through apply(), which snapshots the
//    previous block array onto an undo stack. Structural ops (insert, delete,
//    move, transform) always snapshot; text edits group into bursts — a
//    snapshot only when typing resumes after a pause — so ⌘Z undoes a run of
//    typing, not one character. Snapshots are cheap: block objects are
//    immutable, so a "snapshot" is just an array of shared references.
//
// 2. Focus. contentEditable focus can't be derived from props, so after
//    structural edits we record which block should grab the caret and where
//    ('start', 'end', or a character offset for merges), and the block
//    components honor it on their next render.

import { useCallback, useRef, useState } from 'react'
import { BlockType, createBlock, isListBlock } from '../types/blockTypes'

const HISTORY_LIMIT = 100
const TEXT_GROUP_MS = 800

// Cheapest HTML→text the browser offers; used to decide emptiness and to
// compute caret offsets across formatting tags.
const scratch = document.createElement('div')
function plain(html) {
  scratch.innerHTML = html || ''
  return scratch.textContent
}

export function useEditor(initialBlocks) {
  const [blocks, setBlocks] = useState(initialBlocks)

  // The ref mirrors state so operations can read the *current* array without
  // living inside setState updaters — updaters must stay pure (StrictMode
  // double-invokes them), and pushing history from one would double-push.
  const blocksRef = useRef(initialBlocks)

  const past = useRef([])
  const future = useRef([])
  const lastEdit = useRef(0)

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

  // ---- History core --------------------------------------------------------

  const apply = useCallback((updater, mode = 'structural') => {
    const prev = blocksRef.current
    const next = updater(prev)
    if (next === prev) return
    const now = Date.now()
    // Text edits within a burst share one history entry; everything else
    // snapshots unconditionally. A structural op also ends the current burst
    // so the next keystroke starts a fresh undo step.
    if (mode === 'structural' || now - lastEdit.current > TEXT_GROUP_MS) {
      past.current.push(prev)
      if (past.current.length > HISTORY_LIMIT) past.current.shift()
      future.current = []
    }
    lastEdit.current = mode === 'text' ? now : 0
    blocksRef.current = next
    setBlocks(next)
  }, [])

  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(blocksRef.current)
    blocksRef.current = prev
    lastEdit.current = 0
    setBlocks(prev)
  }, [])

  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(blocksRef.current)
    blocksRef.current = next
    lastEdit.current = 0
    setBlocks(next)
  }, [])

  // ---- Operations ----------------------------------------------------------

  const updateBlock = useCallback((id, patch) => {
    apply((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)), 'text')
  }, [apply])

  // Force a render without touching history — used when a component only
  // needs the focus request consumed (e.g. clicking the canvas below the
  // last block).
  const focusBlock = useCallback((id, position) => {
    requestFocus(id, position)
    const copy = blocksRef.current.slice()
    blocksRef.current = copy
    setBlocks(copy)
  }, [requestFocus])

  // Enter. When the keyboard layer passes beforeHtml/afterHtml the block is
  // split at the caret: current keeps the text before, the new block gets the
  // rest. A mid-text split keeps the current type (splitting a heading yields
  // two headings); a split at the end produces a paragraph — except in lists,
  // where "enter, enter, enter" should keep minting items at the same indent.
  const insertBlockAfter = useCallback((id, beforeHtml = null, afterHtml = null) => {
    const current = blocksRef.current.find((b) => b.id === id)
    if (!current) return
    const splitting = beforeHtml !== null
    const before = splitting ? beforeHtml : current.content
    const after = afterHtml || ''
    const afterEmpty = plain(after) === ''

    // Enter on an empty list item un-lists it (Notion's escape-the-list
    // gesture) instead of stacking empty bullets forever.
    if (isListBlock(current.type) && plain(before) === '' && afterEmpty) {
      apply((prev) => prev.map((b) =>
        b.id === id ? { ...b, type: BlockType.PARAGRAPH, indent: 0, content: '' } : b
      ))
      requestFocus(id, 'start')
      return
    }

    const keepType = !afterEmpty || isListBlock(current.type)
    const fresh = createBlock(
      keepType ? current.type : BlockType.PARAGRAPH,
      after,
      keepType ? { indent: current.indent } : {}
    )
    apply((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      const updated = splitting
        ? prev.map((b) => (b.id === id ? { ...b, content: before } : b))
        : prev
      return [...updated.slice(0, idx + 1), fresh, ...updated.slice(idx + 1)]
    })
    requestFocus(fresh.id, 'start')
  }, [apply, requestFocus])

  // Backspace at the start of a non-empty block: flow its content into the
  // block above and place the caret at the seam — the inverse of Enter-split.
  // A divider above is consumed instead (that's how dividers die from the
  // keyboard); code blocks don't merge because their content is plain text,
  // not HTML.
  const mergeWithPrevious = useCallback((id) => {
    const all = blocksRef.current
    const idx = all.findIndex((b) => b.id === id)
    if (idx <= 0) return
    const above = all[idx - 1]
    const current = all[idx]

    if (above.type === BlockType.DIVIDER) {
      apply((prev) => prev.filter((b) => b.id !== above.id))
      requestFocus(id, 'start')
      return
    }
    if (above.type === BlockType.CODE || current.type === BlockType.CODE) return

    const seam = plain(above.content).length
    apply((prev) => prev
      .map((b) => (b.id === above.id ? { ...b, content: (b.content || '') + (current.content || '') } : b))
      .filter((b) => b.id !== id))
    requestFocus(above.id, seam)
  }, [apply, requestFocus])

  // Backspace on an empty block: remove it and put the caret at the end of
  // the previous block. An empty *list* block (or quote) first downgrades to
  // a paragraph before a second backspace deletes it. Dividers delete
  // outright. The last remaining block never deletes — the document always
  // has somewhere to type.
  const deleteBlock = useCallback((id) => {
    const all = blocksRef.current
    const idx = all.findIndex((b) => b.id === id)
    if (idx === -1) return
    const current = all[idx]

    if (current.type !== BlockType.DIVIDER &&
        (isListBlock(current.type) || current.type === BlockType.QUOTE)) {
      requestFocus(id, 'end')
      apply((prev) => prev.map((b) =>
        b.id === id ? { ...b, type: BlockType.PARAGRAPH, indent: 0 } : b
      ))
      return
    }

    if (all.length === 1) return
    const neighbor = all[idx - 1] || all[idx + 1]
    if (neighbor && neighbor.type !== BlockType.DIVIDER) {
      requestFocus(neighbor.id, 'end')
    }
    apply((prev) => prev.filter((b) => b.id !== id))
  }, [apply, requestFocus])

  // Type changes from the slash menu or markdown shortcuts. Content is
  // preserved unless the caller explicitly replaces it (the slash menu does,
  // to strip the "/query" filter text the user typed).
  const transformBlock = useCallback((id, type, content) => {
    const fresh = type === BlockType.DIVIDER ? createBlock() : null
    apply((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx === -1) return prev
      const next = prev.map((b) => (b.id === id
        ? { ...b, type, content: content !== undefined ? content : b.content, indent: 0 }
        : b))
      // A divider isn't editable, so it brings a paragraph along to keep
      // typing into — one atomic history entry for both.
      if (fresh) next.splice(idx + 1, 0, fresh)
      return next
    })
    requestFocus(fresh ? fresh.id : id, 'start')
  }, [apply, requestFocus])

  // Tab / Shift+Tab on list blocks. Indent is capped: deeper than 4 levels
  // stops being an outline and starts being an accident.
  const indentBlock = useCallback((id, delta) => {
    apply((prev) => prev.map((b) => {
      if (b.id !== id || !isListBlock(b.type)) return b
      return { ...b, indent: Math.max(0, Math.min(4, b.indent + delta)) }
    }))
  }, [apply])

  // dnd-kit hands us the dragged id and the id it was dropped over.
  const moveBlock = useCallback((activeId, overId) => {
    apply((prev) => {
      const from = prev.findIndex((b) => b.id === activeId)
      const to = prev.findIndex((b) => b.id === overId)
      if (from === -1 || to === -1 || from === to) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [apply])

  // Arrow-key navigation between blocks: find the editable neighbor. Dividers
  // are skipped here — they take focus by click, not by caret flow.
  const focusNeighbor = useCallback((id, direction) => {
    const all = blocksRef.current
    let target = all.findIndex((b) => b.id === id) + direction
    while (all[target] && all[target].type === BlockType.DIVIDER) target += direction
    if (all[target]) focusBlock(all[target].id, direction > 0 ? 'start' : 'end')
  }, [focusBlock])

  return {
    blocks,
    updateBlock,
    insertBlockAfter,
    mergeWithPrevious,
    deleteBlock,
    transformBlock,
    indentBlock,
    moveBlock,
    focusNeighbor,
    focusBlock,
    requestFocus,
    consumeFocus,
    undo,
    redo,
  }
}
