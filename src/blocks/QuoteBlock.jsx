// Block quote: the thick left border carries the meaning; the text styling
// stays close to body copy so quoted prose remains comfortable to read.

import ContentEditable from '../components/ContentEditable'

export default function QuoteBlock({ block, editor, onKeyDown }) {
  return (
    <blockquote className="border-l-[3px] border-ink pl-4 my-1">
      <ContentEditable
        block={block}
        editor={editor}
        onKeyDown={onKeyDown}
        placeholder="Empty quote"
        className="text-[18px] leading-8 text-ink italic py-0.5"
      />
    </blockquote>
  )
}
