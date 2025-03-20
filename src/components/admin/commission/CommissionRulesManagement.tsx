import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface CommissionRule {
  id: string;
  passenger_type: 'adult' | 'child' | 'infant_seat' | 'infant_lap';
  rate: number;
  group_discount_rules: {
    thresholds: Array<{
      min_count: number;
      rate: number;
    }>;
  } | null;
  created_at: string;
  updated_at: string;
}

export function CommissionRulesManagement() {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_rules')
        .select('*')
        .order('passenger_type');

      if (error) throw error;
      setRules(data || []);
    } catch (err) {
      console.error('Error fetching commission rules:', err);
      setError('Failed to load commission rules');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rule: CommissionRule) => {
    setEditingRule({ ...rule });
  };

  const handleCancelEdit = () => {
    setEditingRule(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!editingRule) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from('commission_rules')
        .update({
          rate: editingRule.rate,
          group_discount_rules: editingRule.group_discount_rules
        })
        .eq('id', editingRule.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setRules(rules.map(rule => 
        rule.id === editingRule.id ? editingRule : rule
      ));
      
      setTimeout(() => {
        setEditingRule(null);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error updating commission rule:', err);
      setError('Failed to update commission rule');
    } finally {
      setSaving(false);
    }
  };

  const formatPassengerType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading commission rules...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Commission Rules</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage commission rates and group discount rules
        </p>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Commission rule updated successfully!
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Passenger Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Base Rate (EUR)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Group Discounts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatPassengerType(rule.passenger_type)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingRule?.id === rule.id ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingRule.rate}
                      onChange={(e) => setEditingRule({
                        ...editingRule,
                        rate: parseFloat(e.target.value)
                      })}
                      className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{rule.rate}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {rule.group_discount_rules ? (
                    <div className="text-sm text-gray-600">
                      {rule.group_discount_rules.thresholds.map((threshold, idx) => (
                        <div key={idx}>
                          {threshold.min_count}+ passengers: {threshold.rate}%
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No group discounts</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingRule?.id === rule.id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="text-green-600 hover:text-green-800"
                        title="Save changes"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-600 hover:text-gray-800"
                        title="Cancel"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(rule)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit rule"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}