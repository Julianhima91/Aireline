import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client with retries
const createSupabaseClient = (retries = 3) => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

async function withRetry(operation, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

async function generateSeoPages() {
  const supabase = createSupabaseClient();
  
  try {
    console.log('🔄 Starting SEO page generation...');

    // Get all active connections
    const { data: connections, error: connError } = await withRetry(() => 
      supabase
        .from('seo_location_connections')
        .select(`
          *,
          from_location:from_location_id(
            id, type, city, state, nga_format, per_format
          ),
          to_location:to_location_id(
            id, type, city, state, nga_format, per_format
          ),
          template_type:template_type_id(
            id, name, slug
          )
        `)
        .eq('status', 'active')
    );

    if (connError) throw connError;

    console.log(`Found ${connections?.length || 0} active connections`);

    // Process each connection
    for (const connection of connections || []) {
      try {
        const fromName = connection.from_location.city || connection.from_location.state;
        const toName = connection.to_location.city || connection.to_location.state;
        
        console.log(`\nProcessing connection: ${fromName} → ${toName}`);
        console.log(`Current URL: ${connection.template_url || 'Not set'}`);

        // Skip if URL is already set
        if (connection.template_url) {
          console.log('✓ URL already exists, skipping...');
          continue;
        }

        // Generate URL based on location types
        const url = connection.from_location.type === 'city' 
          ? `/bileta-avioni-${fromName.toLowerCase()}-ne-${toName.toLowerCase()}/`
          : `/fluturime-${fromName.toLowerCase()}-ne-${toName.toLowerCase()}/`;

        console.log(`Generated URL: ${url}`);

        // Update connection with URL
        const { error: updateError } = await withRetry(() =>
          supabase
            .from('seo_location_connections')
            .update({ template_url: url })
            .eq('id', connection.id)
        );

        if (updateError) {
          console.error('Error updating connection:', updateError);
          continue;
        }

        console.log('✅ Successfully updated connection');
      } catch (err) {
        console.error(`Error processing connection ${connection.id}:`, err);
      }
    }

    console.log('\n✨ SEO page generation complete!');
  } catch (err) {
    console.error('Error generating SEO pages:', err);
    process.exit(1);
  }
}

// Run the generator
generateSeoPages()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });