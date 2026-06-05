// The "/" command palette. Editor owns when it's open and what the query is
// (the query is whatever the user typed after "/" — it lands in the block's
// own content, so the menu just reads it); this component renders the
// filtered list and handles its own arrow-key navigation.
//
// Keyboard events while the menu is open are intercepted at the Editor level
// via a capture-phase listener, so typing keeps flowing into the block (which
// updates the filter) while Enter/arrows/Escape are diverted here.

import { useEffect, useRef, useState } from 'react'
import { SLASH_MENU_ITEMS } from '../types/blockTypes'

export function filterSlashItems(query) {
  const q = query.toLowerCase().trim()
  if (!q) return SLASH_MENU_ITEMS
  return SLASH_MENU_ITEMS.filter(
    (item) => item.label.toLowerCase().includes(q) || item.keywords.includes(q)
  )
}

export default function SlashMenu({ anchorRect, query, onSelect, onClose, activeIndex, items }) {
  const menuRef = useRef(null)

  // Flip above the anchor when the menu would spill past the bottom of the
  // viewport — measured after first paint, since we need the real height.
  const [flipUp, setFlipUp] = useState(false)
  useEffect(() => {
    if (menuRef.current && anchorRect) {
      const height = menuRef.current.offsetHeight
      setFlipUp(anchorRect.bottom + height + 8 > window.innerHeight)
    }
  }, [anchorRect, items.length])

  // Click-away dismissal; mousedown beats click so the menu closes before a
  // click lands somewhere else and double-fires.
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  if (!anchorRect) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 max-h-72 overflow-y-auto rounded-lg border border-black/10 bg-white py-1.5 shadow-xl shadow-black/10 print-hidden"
      style={{
        left: Math.min(anchorRect.left, window.innerWidth - 270),
        top: flipUp ? undefined : anchorRect.bottom + 6,
        bottom: flipUp ? window.innerHeight - anchorRect.top + 6 : undefined,
      }}
    >
      <div className="px-3 pb-1 pt-0.5 text-xs font-medium uppercase tracking-wide text-ink-light">
        Blocks{query ? ` · "${query}"` : ''}
      </div>
      {items.length === 0 && (
        <div className="px-3 py-2 text-sm text-ink-light">No results</div>
      )}
      {items.map((item, i) => (
        <button
          key={item.type}
          // mousedown + preventDefault keeps focus in the block, so the
          // caret survives the menu selection.
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(item.type)
          }}
          className={`flex w-full items-center gap-3 px-3 py-1.5 text-left text-sm text-ink ${
            i === activeIndex ? 'bg-black/5' : 'hover:bg-black/[0.03]'
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-black/10 bg-wash font-mono text-xs text-ink-light">
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  )
}
