// Thin wrapper around dnd-kit's plumbing so Editor.jsx reads declaratively.
// Sensors, collision strategy and the drop handler all live here.

import { useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback } from 'react'

export function useDragDrop(editor) {
  const sensors = useSensors(
    // The 4px activation distance is what lets plain clicks on the drag
    // handle (and clicks that happen to start inside a block) stay clicks —
    // a drag only begins after actual movement.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragEnd = useCallback((event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      editor.moveBlock(active.id, over.id)
    }
  }, [editor])

  return { sensors, onDragEnd }
}
