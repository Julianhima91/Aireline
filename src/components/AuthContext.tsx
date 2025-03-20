import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  error: AuthError | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  error: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (sessionError.message.includes('session_not_found')) {
            // Clear any stale session data
            await supabase.auth.signOut();
            setUser(null);
          } else {
            console.error('Session error:', sessionError);
            setError(sessionError);
          }
        } else {
          setUser(session?.user ?? null);
        }

        setLoading(false);

        // Listen for changes on auth state (signed in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            setUser(null);
            // Clear any stored tokens
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setUser(session?.user ?? null);
          }
          
          setLoading(false);
          setError(null);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Auth initialization error:', err);
        setLoading(false);
        if (err instanceof Error) {
          setError(err as AuthError);
        }
      }
    };

    initializeAuth();
  }, []);

  const signOut = async () => {
    try {
      // First try to get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Only attempt sign out if there's an active session
      if (session) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
      }
      
      // Clear any stored tokens
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Sign out error:', err);
      if (err instanceof Error) {
        setError(err as AuthError);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, error }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};