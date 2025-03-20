import React, { useState } from 'react';
import { Book, Globe, Settings, MapPin, Layout, Share2 } from 'lucide-react';
import { StateSelection } from './StateSelection';
import { LocationFormats } from './LocationFormats';
import { TemplateTypes } from './TemplateTypes';
import { TemplateConfigurations } from './TemplateConfigurations';
import { RouteConnections } from './RouteConnections';
import { ManageSeoPages } from './ManageSeoPages';

type TabType = 'pages' | 'states' | 'templates' | 'formats' | 'types' | 'routes';

interface TabProps {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabProps[] = [
  {
    id: 'pages',
    label: 'Manage SEO Pages',
    icon: <Book className="w-5 h-5" />
  },
  {
    id: 'states',
    label: 'Select States for SEO',
    icon: <Globe className="w-5 h-5" />
  },
  {
    id: 'templates',
    label: 'SEO Templates & Configurations',
    icon: <Settings className="w-5 h-5" />
  },
  {
    id: 'formats',
    label: 'Location Formats',
    icon: <MapPin className="w-5 h-5" />
  },
  {
    id: 'types',
    label: 'Template Types',
    icon: <Layout className="w-5 h-5" />
  },
  {
    id: 'routes',
    label: 'Route Connections',
    icon: <Share2 className="w-5 h-5" />
  }
];

export function SeoPages() {
  const [activeTab, setActiveTab] = useState<TabType>('pages');

  const renderContent = () => {
    switch (activeTab) {
      case 'states':
        return <StateSelection />;
      case 'formats':
        return <LocationFormats />;
      case 'types':
        return <TemplateTypes />;
      case 'templates':
        return <TemplateConfigurations />;
      case 'routes':
        return <RouteConnections />;
      case 'pages':
        return <ManageSeoPages />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">SEO Pages Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your SEO pages, states, and templates
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 
                ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
}