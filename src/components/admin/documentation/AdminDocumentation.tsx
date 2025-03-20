import React, { useState } from 'react';
import { Book, Database, Code, GitBranch, Star, Settings, Shield, Users, TrendingUp, Beaker, Globe } from 'lucide-react';
import { 
  ModuleOverview,
  DatabaseDocs,
  ApiDocs,
  DataFlowDocs,
  ScoringDocs,
  UiDocs,
  AuthDocs,
  AgentDocs,
  TrackingDocs,
  TestDocs,
  SEODocs
} from './sections';

const SECTIONS = [
  { id: 'modules', title: 'Module Overview', icon: Book, component: ModuleOverview },
  { id: 'auth', title: 'Authentication', icon: Shield, component: AuthDocs },
  { id: 'agents', title: 'Agent Tools', icon: Users, component: AgentDocs },
  { id: 'tracking', title: 'Route Tracking', icon: TrendingUp, component: TrackingDocs },
  { id: 'database', title: 'Database Integration', icon: Database, component: DatabaseDocs },
  { id: 'api', title: 'API Endpoints', icon: Code, component: ApiDocs },
  { id: 'dataflow', title: 'Data Flow', icon: GitBranch, component: DataFlowDocs },
  { id: 'scoring', title: 'Scoring Logic', icon: Star, component: ScoringDocs },
  { id: 'ui', title: 'UI Components', icon: Settings, component: UiDocs },
  { id: 'testing', title: 'Test Cases', icon: Beaker, component: TestDocs },
  { id: 'seo', title: 'SEO System', icon: Globe, component: SEODocs }
];

export function AdminDocumentation() {
  const [activeSection, setActiveSection] = useState('modules');

  const ActiveComponent = SECTIONS.find(s => s.id === activeSection)?.component || ModuleOverview;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Documentation</h2>
        <p className="text-sm text-gray-600 mt-1">
          Comprehensive documentation for the flight search and booking system
        </p>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r border-gray-200 p-4">
          <nav className="space-y-1">
            {SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium
                    ${activeSection === section.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {section.title}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}