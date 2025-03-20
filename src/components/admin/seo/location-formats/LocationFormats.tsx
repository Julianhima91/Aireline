import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useLocationFormats } from './useLocationFormats';
import { LocationTable } from './LocationTable';
import { FilterBar } from './FilterBar';
import { Pagination } from './Pagination';
import { StatusFilter, TypeFilter } from './types';

export function LocationFormats() {
  const {
    locations,
    loading,
    error,
    saving,
    totalCount,
    currentPage,
    itemsPerPage,
    fetchLocations,
    handlePageChange,
    handleStatusChange,
    handleSave
  } = useLocationFormats();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: 'state' | 'nga_format' | 'per_format';
  } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Fetch locations when filters or page changes
  useEffect(() => {
    fetchLocations(currentPage, typeFilter, statusFilter, searchTerm);
  }, [fetchLocations, currentPage, typeFilter, statusFilter, searchTerm]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading && !locations.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Locations Table */}
      <LocationTable
        locations={locations}
        editingCell={editingCell}
        editValue={editValue}
        saving={saving}
        onCellClick={(location, field) => {
          setEditingCell({ 
            id: location.id || 
              (location.type === 'city' 
                ? `city-${location.city}-${location.state}`
                : `state-${location.state}`),
            field 
          });
          setEditValue(location[field] || '');
        }}
        onCellBlur={(location) => {
          if (editingCell) {
            handleSave({
              ...location,
              [editingCell.field]: editValue || null
            });
            setEditingCell(null);
          }
        }}
        onEditValueChange={setEditValue}
        onStatusChange={handleStatusChange}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        loading={loading}
      />
    </div>
  );
}