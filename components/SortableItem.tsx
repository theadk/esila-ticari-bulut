import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  isEditMode?: boolean;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children, className, isEditMode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${className} relative group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow`}>
      {isEditMode && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-800 text-white p-1 rounded-md cursor-grab active:cursor-grabbing hover:bg-gray-700 z-10 shadow-lg"
        >
          <GripHorizontal size={16} />
        </div>
      )}
      <div className={`h-full ${isEditMode ? 'opacity-80 pointer-events-none border-2 border-dashed border-gray-300 rounded-xl' : ''}`}>
        {children}
      </div>
    </div>
  );
}
