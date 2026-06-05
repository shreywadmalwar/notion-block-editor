// The top chrome above the editor: sidebar toggle, a breadcrumb-style
// document title that renames inline, export actions, and the theme toggle.
//
// The title here is the same state as the big canvas title — editing either
// updates both live. Notion does exactly this, and it matters: when the
// canvas title has scrolled away, the nav bar is how you still know (and
// change) what document you're in.

const buttonChrome =
  'rounded-md border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink-light shadow-sm transition-colors hover:border-line-strong hover:text-ink'

export default function NavBar({
  sidebarOpen,
  onToggleSidebar,
  title,
  onTitleChange,
  saveStatus,
  onExportMarkdown,
  onExportPDF,
  theme,
  onToggleTheme,
}) {
  return (
    <nav className="print-hidden flex h-11 shrink-0 items-center gap-2 border-b border-line bg-paper px-3">
      <button
        onClick={onToggleSidebar}
        title={`${sidebarOpen ? 'Collapse' : 'Open'} sidebar (⌘\\)`}
        className="rounded p-1.5 text-ink-light hover:bg-hov hover:text-ink"
      >
        {sidebarOpen ? '«' : '☰'}
      </button>

      <span className="select-none text-faint">/</span>

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
        className="max-w-[50vw] rounded bg-transparent px-1.5 py-0.5 text-sm font-medium text-ink outline-none placeholder:text-faint hover:bg-hov focus:bg-hov"
      />

      {/* Global document actions live top-right, in the chrome — and stay
          reachable with the sidebar collapsed. */}
      <div className="ml-auto flex items-center gap-1.5">
        {saveStatus === 'error' && (
          <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-500">
            Couldn&apos;t save — storage may be full
          </span>
        )}
        <button onClick={onExportMarkdown} className={buttonChrome}>
          ↓ Markdown
        </button>
        <button onClick={onExportPDF} className={buttonChrome}>
          ↓ PDF
        </button>
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
          className="rounded-md p-1.5 text-ink-light transition-colors hover:bg-hov hover:text-ink"
        >
          {theme === 'dark' ? (
            // Sun
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.3 11.3 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            // Moon
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  )
}
