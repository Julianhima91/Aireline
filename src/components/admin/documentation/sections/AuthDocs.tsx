import React from 'react';
import { Shield, Users, Lock, Key } from 'lucide-react';

const AUTH_ROLES = [
  {
    name: 'Admin',
    description: 'Full system access with ability to manage all settings and users',
    permissions: [
      'Manage system settings',
      'View all user data',
      'Manage sales agents',
      'Configure commission rules',
      'Access analytics dashboard'
    ]
  },
  {
    name: 'Sales Agent',
    description: 'Access to booking and commission management features',
    permissions: [
      'View flight search results',
      'Access commission information',
      'Create bookings',
      'View own performance metrics',
      'Use WhatsApp integration'
    ]
  },
  {
    name: 'Anonymous',
    description: 'Basic search functionality without authentication',
    permissions: [
      'Search flights',
      'View public flight results',
      'Access cached prices',
      'View basic route information'
    ]
  }
];

const SECURITY_FEATURES = [
  {
    title: 'Row Level Security',
    icon: Shield,
    description: 'Database-level security ensuring users can only access authorized data',
    details: [
      'Automatic filtering based on user ID',
      'Role-based access policies',
      'Granular permission control'
    ]
  },
  {
    title: 'User Authentication',
    icon: Users,
    description: 'Secure authentication flow using Supabase Auth',
    details: [
      'Email/password authentication',
      'Secure password hashing',
      'Session management',
      'Token-based authentication'
    ]
  },
  {
    title: 'Access Control',
    icon: Lock,
    description: 'Role-based access control system',
    details: [
      'Role-based route protection',
      'Component-level access control',
      'API endpoint protection',
      'Database policy enforcement'
    ]
  },
  {
    title: 'API Security',
    icon: Key,
    description: 'Secure API access and data transmission',
    details: [
      'API key management',
      'Rate limiting',
      'Request validation',
      'CORS configuration'
    ]
  }
];

export function AuthDocs() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication & Authorization</h3>
        <p className="text-gray-600 mb-4">
          The system implements a comprehensive security model using Supabase Auth
          and Row Level Security (RLS) to ensure secure access control and data protection.
        </p>
      </div>

      {/* User Roles */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">User Roles</h4>
        <div className="grid gap-6">
          {AUTH_ROLES.map((role, index) => (
            <div key={index} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
              <h5 className="font-medium text-gray-800 mb-2">{role.name}</h5>
              <p className="text-sm text-gray-600 mb-4">{role.description}</p>
              <div className="space-y-2">
                {role.permissions.map((permission, idx) => (
                  <div key={idx} className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                    {permission}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECURITY_FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">{feature.title}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
              <div className="space-y-2">
                {feature.details.map((detail, idx) => (
                  <div key={idx} className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Authentication Flow */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Authentication Flow</h4>
        <div className="space-y-6">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Sign Up Process</h5>
            <div className="space-y-2 text-sm text-gray-600">
              <p>1. User submits registration form with email and password</p>
              <p>2. Supabase Auth creates new user account</p>
              <p>3. User profile created in public.users table</p>
              <p>4. For agents, additional profile created in sales_agents table</p>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Sign In Process</h5>
            <div className="space-y-2 text-sm text-gray-600">
              <p>1. User submits login credentials</p>
              <p>2. Supabase Auth validates credentials</p>
              <p>3. JWT token generated with user role and permissions</p>
              <p>4. Client stores session in local storage</p>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-gray-800 mb-2">Session Management</h5>
            <div className="space-y-2 text-sm text-gray-600">
              <p>1. JWT token used for all authenticated requests</p>
              <p>2. Token refresh handled automatically by Supabase client</p>
              <p>3. Session expiry after 12 hours of inactivity</p>
              <p>4. Automatic sign out on token expiration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}