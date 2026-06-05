// The single source of truth for what kinds of blocks exist. Every other part
// of the app — the renderer, the slash menu, the markdown exporter — keys off
// these strings, so adding a new block type starts here and radiates outward.

export const BlockType = {
  PARAGRAPH: 'paragraph',
  HEADING1: 'heading1',
  HEADING2: 'heading2',
  HEADING3: 'heading3',
  BULLETED: 'bulleted',
  NUMBERED: 'numbered',
  CODE: 'code',
  QUOTE: 'quote',
  DIVIDER: 'divider',
}

// A block is deliberately tiny: id for React keys and dnd-kit, type to pick a
// renderer, content as an HTML string (so inline bold/italic/underline survive
// a reload), indent for list nesting, and language only meaningful for code
// blocks. Keeping content as HTML rather than a rich AST is the pragmatic
// trade-off: contentEditable speaks HTML natively, and the markdown exporter
// walks it with DOMParser when it's time to leave.
export function createBlock(type = BlockType.PARAGRAPH, content = '', extra = {}) {
  return {
    id: crypto.randomUUID(),
    type,
    content,
    indent: 0,
    language: 'javascript',
    ...extra,
  }
}

// Which blocks hold editable rich text. Dividers hold nothing, and code blocks
// manage their own plain-text editing — everyone else shares the same
// contentEditable machinery.
export function isTextBlock(type) {
  return type !== BlockType.DIVIDER && type !== BlockType.CODE
}

export function isListBlock(type) {
  return type === BlockType.BULLETED || type === BlockType.NUMBERED
}

// The slash-menu catalogue. Order matters: it's the order users see, so the
// most common types come first. `keywords` feed the fuzzy filter — typing
// "/h1" or "/code" narrows instantly.
export const SLASH_MENU_ITEMS = [
  { type: BlockType.PARAGRAPH, label: 'Text', icon: 'Aa', keywords: 'text paragraph plain' },
  { type: BlockType.HEADING1, label: 'Heading 1', icon: 'H1', keywords: 'heading h1 title big' },
  { type: BlockType.HEADING2, label: 'Heading 2', icon: 'H2', keywords: 'heading h2 subtitle' },
  { type: BlockType.HEADING3, label: 'Heading 3', icon: 'H3', keywords: 'heading h3 small' },
  { type: BlockType.BULLETED, label: 'Bulleted list', icon: '•', keywords: 'bullet list unordered ul' },
  { type: BlockType.NUMBERED, label: 'Numbered list', icon: '1.', keywords: 'number list ordered ol' },
  { type: BlockType.CODE, label: 'Code', icon: '</>', keywords: 'code snippet programming' },
  { type: BlockType.QUOTE, label: 'Quote', icon: '"', keywords: 'quote blockquote citation' },
  { type: BlockType.DIVIDER, label: 'Divider', icon: '—', keywords: 'divider separator hr line' },
]
