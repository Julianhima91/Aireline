import React, { useState, useEffect } from 'react';
import { AlertTriangle, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export function ApiModeControl() {
  const [useIncompleteApi, setUseIncompleteApi] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settingId, setSettingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSetting();
  }, []);

  const fetchSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('id, setting_value')
        .eq('setting_name', 'use_incomplete_api')
        .single();

      if (error) throw error;
      if (data) {
        setSettingId(data.id);
        setUseIncompleteApi(data.setting_value);
      }
    } catch (err) {
      console.error('Error fetching API mode setting:', err);
      setError('Failed to load API mode setting');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: saveError } = await supabase
        .from('system_settings')
        .upsert({
          id: settingId || undefined, // Only include id if we have one
          setting_name: 'use_incomplete_api',
          setting_value: useIncompleteApi,
          description: 'Use incomplete API endpoint for flight search results',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_name'
        });

      if (saveError) throw saveError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving API mode setting:', err);
      setError('Failed to save API mode setting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">API Mode Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure how flight search results are fetched from the API
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
            Settings saved successfully!
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useIncompleteApi}
                onChange={(e) => setUseIncompleteApi(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Use Incomplete API Mode</span>
            </label>
            <p className="mt-2 text-sm text-gray-500">
              When enabled, the system will use the incomplete API endpoint which provides real-time updates as results come in.
              When disabled, only the initial results will be shown.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`
                flex items-center px-4 py-2 rounded-lg font-medium text-white
                ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}