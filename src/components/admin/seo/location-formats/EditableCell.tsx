import React, { useCallback } from 'react';

interface EditableCellProps {
  isEditing: boolean;
  value: string;
  editValue: string;
  onEdit: () => void;
  onBlur: () => void;
  onChange: (value: string) => void;
}

export const EditableCell = React.memo(function EditableCell({
  isEditing,
  value,
  editValue,
  onEdit,
  onBlur,
  onChange
}: EditableCellProps) {
  // Memoize the change handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  // Prevent event bubbling when clicking input
  const handleInputClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <td 
      className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer hover:bg-gray-100"
      onClick={onEdit}
    >
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={handleChange}
          onBlur={onBlur}
          onClick={handleInputClick}
          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      ) : (
        <span className="text-gray-900">{value}</span>
      )}
    </td>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.value === nextProps.value &&
    (
      // Only compare editValue if we're editing
      !nextProps.isEditing ||
      prevProps.editValue === nextProps.editValue
    )
  );
});