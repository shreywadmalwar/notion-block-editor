// Collapsible left rail: document list plus the new-document and search
// controls. When collapsed it shrinks to zero width (rather than unmounting)
// so reopening is instant and scroll position survives. The whole rail is
// print-hidden — PDF export must show only the document.
//
// All colors are semantic tokens (wash, line, ink-light…) so the rail
// re-skins automatically when the theme flips.

import { useState } from 'react'
import DocumentList from './DocumentList'

export default function Sidebar({
  open,
  docs,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onClose,
}) {
  // Title search — a flat list stops scaling past ~10 documents. Filtering
  // here keeps DocumentList dumb and the query out of App.
  const [query, setQuery] = useState('')
  const visible = query.trim()
    ? docs.filter((d) => (d.title || 'untitled').toLowerCase().includes(query.toLowerCase()))
    : docs

  return (
    <>
      {/* On phones the rail floats over the document instead of sharing the
          row — a 240px column would leave a sliver of editor. The scrim is
          heavy (60% + blur): a light dim reads as a rendering bug, a real
          scrim reads as a layer. It covers the nav bar too — half-dimmed
          chrome that still looks tappable is worse than none. ≥ md it never
          renders and the rail sits in-flow. */}
      {open && (
        <div
          className="print-hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    <aside
      className={`print-hidden fixed inset-y-0 left-0 z-40 shrink-0 overflow-hidden border-r border-line bg-wash transition-[width] duration-200 md:static md:z-auto ${
        open ? 'w-[min(80vw,320px)] md:w-60' : 'w-0 border-r-0'
      }`}
    >
      {/* Fixed inner width prevents the content reflowing during the
          collapse animation — it slides out of view instead of squishing.
          Must mirror the outer open width exactly, per breakpoint. */}
      <div className="flex h-full w-[min(80vw,320px)] flex-col pb-3 pt-4 md:w-60">
        {/* A quiet uppercase label with a bordered + that reads as a real
            control, not a stray glyph. */}
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-light">
            Documents
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCreate}
              title="New document"
              aria-label="New document"
              className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-paper text-[15px] leading-none text-ink-light shadow-sm transition-colors hover:border-line-strong hover:text-ink coarse:h-9 coarse:w-9 coarse:text-lg"
            >
              +
            </button>
            {/* Overlay mode needs its own close control: the ☰ that opened
                the drawer is now buried underneath it, and the tap-outside
                scrim is real but undiscoverable on its own. In-flow (≥ md)
                the nav toggle is visible, so this never renders there. */}
            <button
              onClick={onClose}
              title="Close sidebar"
              aria-label="Close sidebar"
              className="flex h-6 w-6 items-center justify-center rounded-md text-[15px] leading-none text-ink-light transition-colors hover:bg-hov hover:text-ink coarse:h-9 coarse:w-9 coarse:text-lg md:hidden"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search sits flush in the wash as a soft inset field, sharpening
            to the paper surface only when focused. */}
        <div className="px-3 pb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-md border border-transparent bg-field px-2.5 py-1.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-line-strong focus:bg-paper"
          />
        </div>

        <DocumentList
          docs={visible}
          activeId={activeId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
    </aside>
    </>
  )
}
