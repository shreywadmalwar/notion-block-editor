// Collapsible left rail: document list plus the export actions. When
// collapsed it shrinks to zero width (rather than unmounting) so reopening
// is instant and scroll position survives. The whole rail is print-hidden —
// PDF export must show only the document.

import DocumentList from './DocumentList'

export default function Sidebar({
  open,
  docs,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onExportMarkdown,
  onExportPDF,
}) {
  return (
    <aside
      className={`print-hidden shrink-0 overflow-hidden border-r border-black/5 bg-wash transition-[width] duration-200 ${
        open ? 'w-60' : 'w-0 border-r-0'
      }`}
    >
      {/* Fixed inner width prevents the content reflowing during the
          collapse animation — it slides out of view instead of squishing. */}
      <div className="flex h-full w-60 flex-col py-3">
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-sm font-semibold text-ink">Documents</span>
          <button
            onClick={onCreate}
            title="New document"
            className="rounded px-1.5 py-0.5 text-ink-light hover:bg-black/5 hover:text-ink"
          >
            +
          </button>
        </div>

        <DocumentList
          docs={docs}
          activeId={activeId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />

        {/* Export lives at the bottom, away from the writing flow. */}
        <div className="mt-auto flex flex-col gap-1 border-t border-black/5 px-2 pt-3">
          <button
            onClick={onExportMarkdown}
            className="rounded px-2 py-1.5 text-left text-sm text-ink/80 hover:bg-black/[0.04]"
          >
            ↓ Export Markdown
          </button>
          <button
            onClick={onExportPDF}
            className="rounded px-2 py-1.5 text-left text-sm text-ink/80 hover:bg-black/[0.04]"
          >
            ↓ Export PDF
          </button>
        </div>
      </div>
    </aside>
  )
}
