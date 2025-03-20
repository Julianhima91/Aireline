import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Location } from './types';
import { EditableCell } from './EditableCell';
import { StatusSelect } from './StatusSelect';

interface LocationTableProps {
  locations: Location[];
  editingCell: { id: string; field: 'state' | 'nga_format' | 'per_format' } | null;
  editValue: string;
  saving: string | null;
  onCellClick: (location: Location, field: 'state' | 'nga_format' | 'per_format') => void;
  onCellBlur: (location: Location) => void;
  onEditValueChange: (value: string) => void;
  onStatusChange: (location: Location, status: Location['status']) => void;
}

export function LocationTable({
  locations,
  editingCell,
  editValue,
  saving,
  onCellClick,
  onCellBlur,
  onEditValueChange,
  onStatusChange
}: LocationTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              State
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nga Format
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Për Format
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Template
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {locations.map((location) => {
            const uniqueId = location.id || 
              `${location.type}-${location.city || ''}-${location.state}-${Math.random().toString(36).substr(2, 9)}`;
            
            const displayId = location.type === 'city'
              ? `city-${location.city}-${location.state}`
              : `state-${location.state}`;
              
            const isEditing = editingCell?.id === displayId;
            const isSaving = saving === (location.type === 'city' ? location.city : location.state);
            
            return (
              <tr key={uniqueId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`font-${location.type === 'state' ? 'medium' : 'normal'}`}>
                    {location.type === 'city' ? location.city : location.state}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {location.type === 'state' ? 'State' : 'City'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {location.state}
                </td>
                <EditableCell
                  isEditing={isEditing && editingCell?.field === 'nga_format'}
                  value={location.type === 'city' 
                    ? (location.nga_format || `Nga ${location.city}`)
                    : (location.nga_format || `Nga ${location.state}`)}
                  editValue={editValue}
                  onEdit={() => onCellClick(location, 'nga_format')}
                  onBlur={() => onCellBlur(location)}
                  onChange={onEditValueChange}
                />
                <EditableCell
                  isEditing={isEditing && editingCell?.field === 'per_format'}
                  value={location.type === 'city'
                    ? (location.per_format || `Per ${location.city}`)
                    : (location.per_format || `Per ${location.state}`)}
                  editValue={editValue}
                  onEdit={() => onCellClick(location, 'per_format')}
                  onBlur={() => onCellBlur(location)}
                  onChange={onEditValueChange}
                />
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusSelect
                    status={location.status}
                    onChange={(status) => onStatusChange(location, status as Location['status'])}
                    disabled={isSaving}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {location.template_created ? (
                    <a
                      href={location.template_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Template
                    </a>
                  ) : (
                    <span className="text-gray-500">Not Created</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}