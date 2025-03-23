
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    // Initialize Supabase client with service role key (for admin privileges)
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const { table_name } = await req.json();
    
    if (!table_name) {
      return new Response(
        JSON.stringify({ error: "Table name is required" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Check if the table is 'messages' and ensure it has a conversation_id column
    if (table_name === 'messages') {
      // Check if conversation_id column exists
      const { data: columnExists, error: columnCheckError } = await supabase.rpc(
        'execute_sql',
        {
          sql_query: `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'messages' 
            AND column_name = 'conversation_id';
          `
        }
      );
      
      if (columnCheckError) {
        console.error('Error checking for conversation_id column:', columnCheckError);
      } else {
        // If the column doesn't exist, add it
        if (!columnExists || (Array.isArray(columnExists) && columnExists.length === 0)) {
          const { error: addColumnError } = await supabase.rpc(
            'execute_sql',
            {
              sql_query: `
                ALTER TABLE public.messages 
                ADD COLUMN IF NOT EXISTS conversation_id TEXT;
              `
            }
          );
          
          if (addColumnError) {
            console.error('Error adding conversation_id column:', addColumnError);
          } else {
            console.log('Added conversation_id column to messages table');
          }
        }
      }
    }
    
    // Execute SQL to set REPLICA IDENTITY FULL for the table
    const { error: replicaError } = await supabase.rpc(
      'execute_sql', 
      { 
        sql_query: `ALTER TABLE IF EXISTS public.${table_name} REPLICA IDENTITY FULL;` 
      }
    );
    
    if (replicaError) {
      console.error('Error setting REPLICA IDENTITY:', replicaError);
      return new Response(
        JSON.stringify({ error: replicaError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Add the table to the supabase_realtime publication
    const { error: publicationError } = await supabase.rpc(
      'execute_sql',
      {
        sql_query: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = '${table_name}'
            ) THEN
              EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.${table_name}';
            END IF;
          END
          $$;
        `
      }
    );
    
    if (publicationError) {
      console.error('Error adding table to publication:', publicationError);
      return new Response(
        JSON.stringify({ error: publicationError.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, message: `Realtime enabled for ${table_name}` }),
      { status: 200, headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
