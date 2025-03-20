import { createClient } from '@supabase/supabase-js';

// Hardcode credentials for development
const supabaseUrl = 'https://aoagsticdrptxxrldast.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYWdzdGljZHJwdHh4cmxkYXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NzY0NjgsImV4cCI6MjA1NTU1MjQ2OH0.rFqjJnrEGbwWL0Hv7pL3daMBsE5w4bCy4q6RoDfN_WY';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        try {
          const itemStr = localStorage.getItem(key);
          if (!itemStr) return null;
          
          const item = JSON.parse(itemStr);
          const now = new Date();
          
          // Check if item is expired
          if (item.expires && new Date(item.expires) < now) {
            localStorage.removeItem(key);
            return null;
          }
          return item.value;
        } catch (err) {
          console.error('Error reading auth storage:', err);
          localStorage.removeItem(key); // Clean up potentially corrupted data
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          const item = {
            value,
            expires: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
          };
          localStorage.setItem(key, JSON.stringify(item));
        } catch (err) {
          console.error('Error writing to auth storage:', err);
          // Attempt to clean up on error
          try {
            localStorage.removeItem(key);
          } catch (cleanupErr) {
            console.error('Error cleaning up storage:', cleanupErr);
          }
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (err) {
          console.error('Error removing from auth storage:', err);
        }
      }
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  },
  global: {
    headers: {
      'x-application-name': 'flight-finder'
    },
    fetch: (url, options = {}) => {
      // Add retry logic to fetch
      const fetchWithRetry = async (retriesLeft: number): Promise<Response> => {
        try {
          const response = await fetch(url, {
            ...options,
            // Add timeout
            signal: AbortSignal.timeout(30000) // 30 second timeout
          });
          
          if (!response.ok && retriesLeft > 0) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response;
        } catch (error) {
          if (retriesLeft === 0) throw error;
          
          // Exponential backoff
          const delay = Math.min(1000 * (2 ** (3 - retriesLeft)), 8000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return fetchWithRetry(retriesLeft - 1);
        }
      };
      
      return fetchWithRetry(3); // Start with 3 retries
    }
  },
  db: {
    schema: 'public'
  }
});

// Add error handling wrapper with retries
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage = 'Operation failed',
  maxRetries = 3,
  retryDelay = 2000
): Promise<T> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      retries++;
      console.error(`${errorMessage} (Attempt ${retries}/${maxRetries}):`, error);
      
      // Check if we should retry
      const shouldRetry = error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('timeout') ||
        error.message.includes('network') ||
        error.message.includes('connection') ||
        error.message.includes('session_not_found') ||
        error.message.includes('JWT expired')
      );

      // If we have retries left and it's a retryable error, wait and try again
      if (shouldRetry && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * retries));
        
        // If it's a session error, try to refresh the session
        if (error.message.includes('session_not_found') || error.message.includes('JWT expired')) {
          try {
            const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError && session) {
              console.log('Successfully refreshed session');
            }
          } catch (refreshError) {
            console.error('Failed to refresh session:', refreshError);
          }
        }
        
        continue;
      }
      
      // If we're out of retries or it's not a retryable error, return fallback
      return fallback;
    }
  }
  
  return fallback;
}

// Helper function to check if error is retryable
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const retryableMessages = [
    'Failed to fetch',
    'timeout',
    'network',
    'connection',
    'socket',
    'offline',
    'session_not_found',
    'JWT expired'
  ];

  return retryableMessages.some(msg => 
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
}

// Helper function to format error messages
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Remove technical details for user-facing messages
    return error.message
      .replace(/^TypeError: /, '')
      .replace(/^Error: /, '')
      .replace(/\s+\(.+\)$/, '')
      .replace('Failed to fetch', 'Network connection error. Please check your internet connection.');
  }
  return 'An unexpected error occurred. Please try again.';
}

// Initialize auth state
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Clear any stored tokens
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Auth token refreshed successfully');
  }
});

// Set up auto-refresh for session
setInterval(async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (session && !error) {
    await supabase.auth.refreshSession();
  }
}, 10 * 60 * 1000); // Refresh every 10 minutes