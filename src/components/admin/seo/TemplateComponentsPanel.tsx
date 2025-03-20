import React, { useState, useEffect } from 'react';
import { GripVertical, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface TemplateComponent {
  id: string;
  component_name: string;
  display_order: number;
  status: 'active' | 'inactive';
}

interface TemplateComponentsPanelProps {
  templateId: string;
  onUpdate?: () => void;
}

const AVAILABLE_COMPONENTS = [
  { name: 'SEOHead', label: 'SEO Meta Tags' },
  { name: 'HeaderComponent', label: 'Header' },
  { name: 'FlightSearchComponent', label: 'Flight Search' },
  { name: 'PricingTableComponent', label: 'City-City Pricing' },
  { name: 'StateCityPricingComponent', label: 'State-City Pricing' },
  { name: 'StatePricingComponent', label: 'State Pricing' },
  { name: 'RouteInfoComponent', label: 'City Route Information' },
  { name: 'StateRouteInfoComponent', label: 'State Route Information' },
  { name: 'FAQComponent', label: 'City FAQ Section' },
  { name: 'StateFAQComponent', label: 'State FAQ Section' },
  { name: 'RelatedDestinationsComponent', label: 'Related Destinations' },
  { name: 'FooterComponent', label: 'Footer' }
];

export function TemplateComponentsPanel({ templateId, onUpdate }: TemplateComponentsPanelProps) {
  const [components, setComponents] = useState<TemplateComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (templateId) {
      fetchComponents();
    } else {
      // For new templates, initialize with default components
      setComponents(
        AVAILABLE_COMPONENTS.map((c, idx) => ({
          id: `temp-${idx}`,
          component_name: c.name,
          display_order: idx + 1,
          status: 'inactive'
        }))
      );
      setLoading(false);
    }
  }, [templateId]);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('seo_template_components')
        .select('*')
        .eq('template_id', templateId)
        .order('display_order');

      if (error) throw error;

      // Ensure all available components exist
      const existingComponents = new Set(data?.map(c => c.component_name));
      const missingComponents = AVAILABLE_COMPONENTS.filter(c => !existingComponents.has(c.name));

      if (missingComponents.length > 0 && templateId) {
        // Add missing components
        const { error: insertError } = await supabase
          .from('seo_template_components')
          .insert(
            missingComponents.map((c, idx) => ({
              template_id: templateId,
              component_name: c.name,
              display_order: (data?.length || 0) + idx + 1,
              status: 'inactive'
            }))
          );

        if (insertError) throw insertError;

        // Refetch all components
        const { data: updatedData, error: refetchError } = await supabase
          .from('seo_template_components')
          .select('*')
          .eq('template_id', templateId)
          .order('display_order');

        if (refetchError) throw refetchError;
        setComponents(updatedData || []);
      } else {
        setComponents(data || []);
      }
    } catch (err) {
      console.error('Error fetching components:', err);
      setError('Failed to load template components');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newComponents = [...components];
    const draggedComponent = newComponents[draggedIndex];
    
    // Remove dragged component
    newComponents.splice(draggedIndex, 1);
    // Insert at new position
    newComponents.splice(index, 0, draggedComponent);
    
    // Update display order
    newComponents.forEach((c, idx) => {
      c.display_order = idx + 1;
    });

    setComponents(newComponents);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    setDraggedIndex(null);

    // Don't try to save if template hasn't been created yet
    if (!templateId) return;

    try {
      setSaving(true);
      
      // Update all component orders with all required fields
      const updates = components.map(component => ({
        id: component.id,
        template_id: templateId,
        component_name: component.component_name,
        display_order: component.display_order,
        status: component.status
      }));

      const { error } = await supabase
        .from('seo_template_components')
        .upsert(updates);

      if (error) throw error;
      
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating component order:', err);
      setError('Failed to update component order');
      // Revert changes on error
      await fetchComponents();
    } finally {
      setSaving(false);
    }
  };

  const toggleComponentStatus = async (componentId: string, currentStatus: string) => {
    // Don't try to save if template hasn't been created yet
    if (!templateId) return;

    try {
      setSaving(true);
      setError(null);

      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('seo_template_components')
        .update({ status: newStatus })
        .eq('id', componentId)
        .eq('template_id', templateId);

      if (error) throw error;

      setComponents(components.map(c => 
        c.id === componentId ? { ...c, status: newStatus } : c
      ));

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error toggling component status:', err);
      setError('Failed to update component status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Template Components</h3>
        {saving && (
          <div className="flex items-center text-sm text-blue-600">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving changes...
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {!templateId && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
          Save the template first to enable component management.
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        {components.map((component, index) => {
          const componentInfo = AVAILABLE_COMPONENTS.find(c => c.name === component.component_name);
          if (!componentInfo) return null;

          return (
            <div
              key={component.id}
              draggable={!!templateId}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-4 p-4 border-b border-gray-100 last:border-0
                ${draggedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'}
                ${templateId ? 'cursor-move' : 'cursor-not-allowed opacity-75'}
              `}
            >
              <div className="text-gray-400">
                <GripVertical className="w-5 h-5" />
              </div>

              <div className="flex-1">
                <div className="font-medium text-gray-900">{componentInfo.label}</div>
                <div className="text-sm text-gray-500">{component.component_name}</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500">
                  Order: {component.display_order}
                </div>

                <button
                  onClick={() => toggleComponentStatus(component.id, component.status)}
                  disabled={saving || !templateId}
                  className={`
                    flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
                    ${!templateId ? 'opacity-50 cursor-not-allowed' : ''}
                    ${component.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }
                  `}
                >
                  {component.status === 'active' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Active
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Inactive
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-sm text-gray-500">
        {templateId 
          ? 'Drag and drop components to reorder. Click the status button to enable/disable components.'
          : 'Save the template to enable component management.'}
      </div>
    </div>
  );
}