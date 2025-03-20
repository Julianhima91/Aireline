import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, CheckCircle, XCircle, Key } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { SalesAgentModal } from './SalesAgentModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ConfirmDialog } from '../../common/ConfirmDialog';

interface SalesAgent {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  created_at: string;
  is_active?: boolean;
}

export function SalesAgentManagement() {
  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<SalesAgent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<SalesAgent | null>(null);
  const [agentForPasswordChange, setAgentForPasswordChange] = useState<SalesAgent | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (err) {
      setError('Failed to load sales agents');
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = () => {
    setSelectedAgent(null);
    setIsModalOpen(true);
  };

  const handleEditAgent = (agent: SalesAgent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  const handleChangePassword = (agent: SalesAgent) => {
    setAgentForPasswordChange(agent);
    setIsPasswordModalOpen(true);
  };

  const handleDeleteAgent = (agent: SalesAgent) => {
    setAgentToDelete(agent);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!agentToDelete) return;

    try {
      const { error } = await supabase
        .from('sales_agents')
        .delete()
        .eq('id', agentToDelete.id);

      if (error) throw error;

      setAgents(agents.filter(agent => agent.id !== agentToDelete.id));
      setIsDeleteDialogOpen(false);
      setAgentToDelete(null);
    } catch (err) {
      console.error('Error deleting agent:', err);
      setError('Failed to delete agent');
    }
  };

  const handleToggleStatus = async (agent: SalesAgent) => {
    try {
      const { error } = await supabase
        .from('sales_agents')
        .update({ is_active: !agent.is_active })
        .eq('id', agent.id);

      if (error) throw error;

      setAgents(agents.map(a => 
        a.id === agent.id ? { ...a, is_active: !agent.is_active } : a
      ));
    } catch (err) {
      console.error('Error toggling agent status:', err);
      setError('Failed to update agent status');
    }
  };

  const handleModalClose = (refreshNeeded: boolean) => {
    setIsModalOpen(false);
    if (refreshNeeded) {
      fetchAgents();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading agents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Sales Agents</h2>
            </div>
            <button
              onClick={handleAddAgent}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Agent
            </button>
          </div>

          {error && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {agent.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{agent.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {agent.phone_number || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(agent)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          agent.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {agent.is_active ? (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        {agent.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEditAgent(agent)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit agent"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleChangePassword(agent)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Change password"
                        >
                          <Key className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete agent"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SalesAgentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        agent={selectedAgent}
      />

      {agentForPasswordChange && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setAgentForPasswordChange(null);
          }}
          agentId={agentForPasswordChange.id}
          agentEmail={agentForPasswordChange.email}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Sales Agent"
        message="Are you sure you want to delete this sales agent? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}