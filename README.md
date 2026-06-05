# Block Editor

A Notion-style block-based rich text editor. Every paragraph, heading, list
item, code snippet or quote is an independent block that can be added,
transformed, reordered and deleted. Clean, distraction-free writing with
markdown and PDF export — no backend, everything stays in your browser.

## Features

- **9 block types** — paragraph, headings (1–3), bulleted & numbered lists,
  syntax-highlighted code, quote, divider
- **Slash commands** — type `/` on an empty block to open the block picker,
  keep typing to filter
- **Inline formatting** — `⌘B` bold, `⌘I` italic, `⌘U` underline, `` ⌘` ``
  inline code, plus a floating toolbar on text selection
- **Drag & drop** — hover a block for the drag handle, reorder freely
- **List nesting** — `Tab` / `Shift+Tab` indent list items; numbered lists
  count per run and indent level
- **Multiple documents** — collapsible sidebar with create, rename
  (double-click) and delete
- **Autosave** — to localStorage, 2 seconds after the last edit
- **Export** — to Markdown (proper syntax, nested inline formatting) or PDF
  (print-stylesheet based, chrome-free output)

## Keyboard reference

| Key | Action |
|---|---|
| `/` (empty block) | Open block picker |
| `Enter` | New block below (`Shift+Enter` for soft break) |
| `Backspace` (empty block) | Delete block / un-list a list item |
| `Tab` / `Shift+Tab` | Indent / outdent list item |
| `↑` / `↓` | Move between blocks at line boundaries |
| `⌘B` `⌘I` `⌘U` `` ⌘` `` | Bold / italic / underline / inline code |
| `⌘Enter` (code block) | Exit to a new paragraph |

## Stack

React 18 · Vite · Tailwind CSS · [@dnd-kit](https://dndkit.com/) ·
[prism-react-renderer](https://github.com/FormidableLabs/prism-react-renderer)

## Development

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # production build in dist/
```

## Storage

Documents persist in localStorage: `nbe:index` holds the sidebar metadata,
`nbe:doc:<id>` holds each document's blocks. All persistence flows through
`src/services/storage.js`, so swapping in a real backend later is a
four-function change.
