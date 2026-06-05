// The chrome around every block: dnd-kit sortable registration plus the
// drag handle that fades in on hover. The handle is the *only* drag
// activator — making the whole block draggable would fight with text
// selection inside contentEditable.

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import BlockRenderer from './BlockRenderer'

export default function Block({ block, editor, onSlash, number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id })

  return (
    <div
      ref={setNodeRef}
      // The id lets floating UIs (slash menu) re-find this block's DOM node
      // to track it through scrolling.
      data-block-id={block.id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        // The dragged block stays visible but ghosted in place while its
        // siblings animate around it — clearer than dnd-kit's default of
        // moving the original.
        opacity: isDragging ? 0.4 : 1,
      }}
      // group/block scopes the hover reveal to this block alone; a plain
      // `group` would collide with the code block's own hover group. The
      // faint hover tint ties the far-left drag handle visually to the block
      // it belongs to on wide screens.
      className="group/block relative flex items-start rounded transition-colors duration-100 hover:bg-black/[0.02]"
    >
      {/* Drag handle gutter: lives in negative margin so block text stays
          perfectly aligned with the title above. Invisible until hover —
          the "distraction-free" promise means chrome appears only on demand. */}
      <div className="absolute -left-8 top-0.5 flex h-7 items-center print-hidden">
        <button
          // attributes includes tabIndex={0} and the sortable aria props —
          // keeping it focusable is what makes dnd-kit's keyboard sensor
          // reachable (space to lift, arrows to move, space to drop).
          {...attributes}
          {...listeners}
          title="Drag to move"
          aria-label="Drag to reorder — space to lift, arrows to move"
          className="cursor-grab active:cursor-grabbing rounded px-0.5 py-1 text-ink-light opacity-0 group-hover/block:opacity-100 focus-visible:opacity-100 coarse:opacity-60 hover:bg-black/5 transition-opacity select-none"
        >
          {/* Six-dot grip, drawn with text — no icon dependency needed. */}
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="2.5" cy="3" r="1.4" /><circle cx="7.5" cy="3" r="1.4" />
            <circle cx="2.5" cy="8" r="1.4" /><circle cx="7.5" cy="8" r="1.4" />
            <circle cx="2.5" cy="13" r="1.4" /><circle cx="7.5" cy="13" r="1.4" />
          </svg>
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <BlockRenderer block={block} editor={editor} onSlash={onSlash} number={number} />
      </div>
    </div>
  )
}
