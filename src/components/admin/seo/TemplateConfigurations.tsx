import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, RefreshCw, HelpCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { TemplateComponentsPanel } from './TemplateComponentsPanel';

interface TemplateType {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'inactive';
}

interface Template {
  id: string;
  template_type_id: string;
  url_structure: string;
  seo_title: string;
  meta_description: string;
}

interface PreviewData {
  city?: string;
  state?: string;
  nga_city?: string;
  per_city?: string;
  nga_state?: string;
  per_state?: string;
}

export function TemplateConfigurations() {
  const [templateTypes, setTemplateTypes] = useState<TemplateType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData>({
    city: 'Tirana',
    state: 'Albania',
    nga_city: 'Nga Tirana',
    per_city: 'Për Tirana',
    nga_state: 'Nga Albania',
    per_state: 'Për Albania'
  });

  useEffect(() => {
    fetchTemplateTypes();
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetchTemplate(selectedType);
    }
  }, [selectedType]);

  const fetchTemplateTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_template_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplateTypes(data || []);
      
      if (data?.[0]) {
        setSelectedType(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching template types:', err);
      setError('Failed to load template types');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplate = async (typeId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('seo_page_templates')
        .select('*')
        .eq('template_type_id', typeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setTemplate(data);
      } else {
        // Create empty template
        setTemplate({
          id: '',
          template_type_id: typeId,
          url_structure: '',
          seo_title: '',
          meta_description: ''
        });
      }
    } catch (err) {
      console.error('Error fetching template:', err);
      setError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { error: saveError } = await supabase
        .from('seo_page_templates')
        .upsert({
          template_type_id: selectedType,
          url_structure: template.url_structure,
          seo_title: template.seo_title,
          meta_description: template.meta_description
        }, {
          onConflict: 'template_type_id'
        });

      if (saveError) throw saveError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const replacePlaceholders = (text: string) => {
    return text
      .replace(/{nga_city}/g, previewData.nga_city || '')
      .replace(/{per_city}/g, previewData.per_city || '')
      .replace(/{nga_state}/g, previewData.nga_state || '')
      .replace(/{per_state}/g, previewData.per_state || '');
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
      {/* Template Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Template Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {templateTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      {/* Placeholder Help */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-2">Available Placeholders</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
              <div>
                <code className="bg-blue-100 px-1.5 py-0.5 rounded">{'{nga_city}'}</code>
                <span className="ml-2">Nga format for cities</span>
              </div>
              <div>
                <code className="bg-blue-100 px-1.5 py-0.5 rounded">{'{per_city}'}</code>
                <span className="ml-2">Për format for cities</span>
              </div>
              <div>
                <code className="bg-blue-100 px-1.5 py-0.5 rounded">{'{nga_state}'}</code>
                <span className="ml-2">Nga format for states</span>
              </div>
              <div>
                <code className="bg-blue-100 px-1.5 py-0.5 rounded">{'{per_state}'}</code>
                <span className="ml-2">Për format for states</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Template saved successfully!
        </div>
      )}

      {template && (
        <div className="space-y-6">
          {/* URL Structure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Structure
            </label>
            <input
              type="text"
              value={template.url_structure}
              onChange={(e) => setTemplate({ ...template, url_structure: e.target.value })}
              placeholder="/bileta-avioni-{nga_city}-ne-{per_city}/"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Preview: {replacePlaceholders(template.url_structure)}
            </p>
          </div>

          {/* SEO Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEO Title
            </label>
            <input
              type="text"
              value={template.seo_title}
              onChange={(e) => setTemplate({ ...template, seo_title: e.target.value })}
              placeholder="Bileta Avioni {nga_city} në {per_city} | Rezervo Online"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Preview: {replacePlaceholders(template.seo_title)}
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
            </label>
            <textarea
              value={template.meta_description}
              onChange={(e) => setTemplate({ ...template, meta_description: e.target.value })}
              placeholder="Rezervoni biletën tuaj {nga_city} në {per_city} me çmimet më të mira..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Preview: {replacePlaceholders(template.meta_description)}
            </p>
          </div>

          {/* Template Components */}
          <div className="pt-6 border-t border-gray-200">
            <TemplateComponentsPanel 
              templateId={template.id} 
              onUpdate={() => setSuccess(true)}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setTemplate({
                  ...template,
                  url_structure: '',
                  seo_title: '',
                  meta_description: ''
                });
              }}
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center px-6 py-2 rounded-lg text-white ${
                saving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}