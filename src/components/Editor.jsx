// The document surface: title, the sortable block list, and the two floating
// UIs (slash menu, formatting toolbar). This is where the editor's pieces
// meet — useEditor owns block state, dnd-kit owns reordering, and this
// component orchestrates who is visible when.
//
// App remounts this component (key={doc.id}) on every document switch, so all
// transient state here — menu open, selection, focus — resets for free.

import { useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { useEditor } from '../hooks/useEditor'
import { useDragDrop } from '../hooks/useDragDrop'
import { selectionInsideCode } from '../hooks/useKeyboard'
import { BlockType } from '../types/blockTypes'
import Block from './Block'
import SlashMenu, { filterSlashItems } from './SlashMenu'
import FloatingToolbar from './FloatingToolbar'

// Strip tags to get the plain text of an HTML content string — used for the
// slash query and the word count. A detached div is the cheapest HTML parser
// the browser offers.
const scratch = document.createElement('div')
function plainText(html) {
  scratch.innerHTML = html
  return scratch.textContent
}

export default function Editor({ doc, onBlocksChange, onTitleChange }) {
  const editor = useEditor(doc.blocks)
  const { sensors, onDragEnd } = useDragDrop(editor)
  const contentRef = useRef(null)

  // Bubble block changes up for autosave. useEditor is the source of truth
  // while this document is mounted; App just persists what it's told.
  useEffect(() => {
    onBlocksChange(editor.blocks)
  }, [editor.blocks, onBlocksChange])

  // ---- Slash menu ---------------------------------------------------------
  // Open state anchors to a block; the query is *derived* from that block's
  // live content (everything after the "/"), so typing filters naturally and
  // deleting the "/" dissolves the menu — no parallel query state to desync.
  const [slash, setSlash] = useState(null) // { blockId, anchorRect }
  const [slashIndex, setSlashIndex] = useState(0)

  const slashBlock = slash && editor.blocks.find((b) => b.id === slash.blockId)
  const slashText = slashBlock ? plainText(slashBlock.content) : ''
  const slashOpen = !!slash && !!slashBlock && slashText.startsWith('/')
  const slashQuery = slashOpen ? slashText.slice(1) : ''
  const slashItems = useMemo(() => filterSlashItems(slashQuery), [slashQuery])

  // Reset highlight whenever the result set narrows past it.
  useEffect(() => {
    if (slashIndex >= slashItems.length) setSlashIndex(0)
  }, [slashItems.length, slashIndex])

  const openSlash = (blockId, el) => {
    setSlash({ blockId, anchorRect: el.getBoundingClientRect() })
    setSlashIndex(0)
  }

  const selectSlashItem = (type) => {
    // Explicitly clear content: the block holds the "/query" filter text the
    // user typed, which must not survive into the transformed block.
    editor.transformBlock(slash.blockId, type, '')
    setSlash(null)
  }

  // Capture-phase keys, in priority order: undo/redo first (they must work
  // everywhere in the editor, and must beat the browser's native undo, which
  // knows nothing about block structure), then slash-menu navigation while
  // the menu is open. Everything else falls through to the blocks.
  const onKeyDownCapture = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      // The title textarea keeps its own native undo — its text isn't part
      // of the block history.
      if (e.target.dataset?.title) return
      e.preventDefault()
      e.stopPropagation()
      if (e.shiftKey) editor.redo()
      else editor.undo()
      return
    }
    if (!slashOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault(); e.stopPropagation()
      setSlashIndex((i) => Math.min(i + 1, slashItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); e.stopPropagation()
      setSlashIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault(); e.stopPropagation()
      if (slashItems[slashIndex]) selectSlashItem(slashItems[slashIndex].type)
    } else if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation()
      setSlash(null)
    }
  }

  // ---- Floating toolbar ---------------------------------------------------
  // Track the live selection; show the toolbar only for real (non-collapsed)
  // selections inside a *single* rich-text block, and never while the slash
  // menu has the stage. Cross-block selections are excluded deliberately:
  // execCommand can't format across separate contentEditable roots, and a
  // toolbar that visibly does nothing erodes trust in every other button.
  const [selectionRect, setSelectionRect] = useState(null)
  const [activeFormats, setActiveFormats] = useState({})

  useEffect(() => {
    const editableOf = (node) => {
      if (!node) return null
      const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
      return el?.closest('[contenteditable]') || null
    }
    const update = () => {
      const sel = window.getSelection()
      if (
        !sel || sel.isCollapsed || sel.rangeCount === 0 ||
        !contentRef.current?.contains(sel.anchorNode)
      ) {
        setSelectionRect(null)
        return
      }
      const anchorEditable = editableOf(sel.anchorNode)
      const focusEditable = editableOf(sel.focusNode)
      if (!anchorEditable || anchorEditable !== focusEditable) {
        setSelectionRect(null)
        return
      }
      // queryCommandState reads the formatting at the selection so the
      // toolbar can show which formats are already on — pressing B on bold
      // text should look like "turn off", not a no-op mystery.
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        code: !!selectionInsideCode(),
      })
      setSelectionRect(sel.getRangeAt(0).getBoundingClientRect())
    }
    document.addEventListener('selectionchange', update)
    return () => document.removeEventListener('selectionchange', update)
  }, [])

  // Both floating UIs anchor to fixed-position rects captured at open time;
  // scrolling would leave them hovering over the wrong content. Re-measure
  // on every scroll of the editor column.
  const onScroll = () => {
    if (slash) {
      const el = document.querySelector(`[data-block-id="${slash.blockId}"]`)
      if (el) setSlash((s) => s && { ...s, anchorRect: el.getBoundingClientRect() })
    }
    if (selectionRect) {
      const sel = window.getSelection()
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        setSelectionRect(sel.getRangeAt(0).getBoundingClientRect())
      }
    }
  }

  // ---- Derived display data ----------------------------------------------
  // Numbered-list counters: each numbered block's number is its position in
  // the unbroken run of numbered blocks at the same indent directly above it.
  const numbers = useMemo(() => {
    const map = {}
    editor.blocks.forEach((block, i) => {
      if (block.type !== BlockType.NUMBERED) return
      let count = 1
      for (let j = i - 1; j >= 0; j--) {
        const prev = editor.blocks[j]
        if (prev.type !== BlockType.NUMBERED) break
        if (prev.indent === block.indent) count++
        // A deeper-indented numbered item doesn't break the run; a shallower
        // one does — its parent list resumed.
        else if (prev.indent < block.indent) break
      }
      map[block.id] = count
    })
    return map
  }, [editor.blocks])

  const wordCount = useMemo(() => {
    const text = editor.blocks
      .map((b) => (b.type === BlockType.CODE ? b.content : plainText(b.content)))
      .join(' ')
    return (text.match(/\S+/g) || []).length
  }, [editor.blocks])

  // Clicking the empty space under the last block focuses it (or creates a
  // paragraph if the doc ends in something non-editable) — the page should
  // feel like one continuous canvas, not a list with dead zones.
  const onCanvasClick = (e) => {
    if (e.target !== e.currentTarget) return
    const last = editor.blocks[editor.blocks.length - 1]
    if (last && last.type !== BlockType.DIVIDER && last.type !== BlockType.CODE) {
      editor.focusBlock(last.id, 'end')
    } else if (last) {
      editor.insertBlockAfter(last.id)
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto" onKeyDownCapture={onKeyDownCapture} onScroll={onScroll}>
      <div className="mx-auto w-full max-w-[720px] flex-1 px-8 pb-32 pt-16 print-content" onClick={onCanvasClick}>
        {/* Document title — an input, not contentEditable: titles are plain
            text and inputs give us placeholder + selection behavior for free. */}
        <input
          data-title="true"
          value={doc.title}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => {
            // Enter in the title drops into the first block, like Notion.
            if (e.key === 'Enter') {
              e.preventDefault()
              const first = editor.blocks[0]
              if (first) editor.focusBlock(first.id, 'start')
            }
          }}
          placeholder="Untitled"
          className="mb-6 w-full bg-transparent text-[40px] font-bold leading-tight text-ink outline-none placeholder:text-ink-light/40 print-title"
        />

        <div ref={contentRef}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={editor.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {editor.blocks.map((block) => (
                <Block
                  key={block.id}
                  block={block}
                  editor={editor}
                  onSlash={openSlash}
                  number={numbers[block.id]}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {slashOpen && (
        <SlashMenu
          anchorRect={slash.anchorRect}
          query={slashQuery}
          items={slashItems}
          activeIndex={slashIndex}
          onSelect={selectSlashItem}
          onClose={() => setSlash(null)}
        />
      )}

      {/* Toolbar yields to the slash menu — two floating UIs at once is noise. */}
      {!slashOpen && <FloatingToolbar rect={selectionRect} active={activeFormats} />}

      {/* Bottom status bar: word count, pinned to the editor's bottom edge. */}
      <div className="print-hidden sticky bottom-0 flex justify-end border-t border-black/5 bg-paper/90 px-4 py-1.5 text-xs text-ink-light backdrop-blur">
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </div>
    </div>
  )
}
