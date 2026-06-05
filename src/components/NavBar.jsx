// The top chrome above the editor: sidebar toggle, a breadcrumb-style
// document title that renames inline, and the save-failure indicator.
//
// The title here is the same state as the big canvas title — editing either
// updates both live. Notion does exactly this, and it matters: when the
// canvas title has scrolled away, the nav bar is how you still know (and
// change) what document you're in.

export default function NavBar({
  sidebarOpen,
  onToggleSidebar,
  title,
  onTitleChange,
  saveStatus,
  onExportMarkdown,
  onExportPDF,
}) {
  return (
    <nav className="print-hidden flex h-11 shrink-0 items-center gap-2 border-b border-black/5 bg-paper px-3">
      <button
        onClick={onToggleSidebar}
        title={`${sidebarOpen ? 'Collapse' : 'Open'} sidebar (⌘\\)`}
        className="rounded p-1.5 text-ink-light hover:bg-black/5 hover:text-ink"
      >
        {sidebarOpen ? '«' : '☰'}
      </button>

      <span className="select-none text-ink-light/60">/</span>

      {/* Inline rename: an undecorated input that reveals itself as editable
          on hover/focus. Sized to its content so the breadcrumb hugs the
          text like a label rather than stretching across the bar. */}
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur()
        }}
        placeholder="Untitled"
        aria-label="Document title"
        size={Math.max((title || 'Untitled').length, 4)}
        className="max-w-[50vw] rounded px-1.5 py-0.5 text-sm font-medium text-ink outline-none bg-transparent hover:bg-black/[0.04] focus:bg-black/[0.04] placeholder:text-ink-light/60"
      />

      {/* Export actions live top-right — global document actions belong in
          the chrome, not buried at the bottom of the document list. */}
      <div className="ml-auto flex items-center gap-1.5">
        {saveStatus === 'error' && (
          <span className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-600">
            Couldn&apos;t save — storage may be full
          </span>
        )}
        <button
          onClick={onExportMarkdown}
          className="rounded-md border border-[#e3e1dc] bg-[#fbfbfa] px-2.5 py-1 text-xs font-medium text-[#79766f] shadow-sm transition-colors hover:border-[#d6d3cc] hover:bg-white hover:text-[#37352f]"
        >
          ↓ Markdown
        </button>
        <button
          onClick={onExportPDF}
          className="rounded-md border border-[#e3e1dc] bg-[#fbfbfa] px-2.5 py-1 text-xs font-medium text-[#79766f] shadow-sm transition-colors hover:border-[#d6d3cc] hover:bg-white hover:text-[#37352f]"
        >
          ↓ PDF
        </button>
      </div>
    </nav>
  )
}
