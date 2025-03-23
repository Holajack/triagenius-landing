
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

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
    // Get database credentials from environment
    const connectionString = Deno.env.get("SUPABASE_DB_URL") as string;
    
    if (!connectionString) {
      throw new Error("Database connection string not found in environment variables");
    }
    
    const { sql_query } = await req.json();
    
    if (!sql_query) {
      return new Response(
        JSON.stringify({ error: "SQL query is required" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Create a database pool
    const pool = new Pool(connectionString, 1, true);
    
    try {
      // Connect to the database
      const connection = await pool.connect();
      
      try {
        // Execute the SQL query
        await connection.queryObject(sql_query);
        
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: corsHeaders }
        );
      } finally {
        connection.release();
      }
    } finally {
      await pool.end();
    }
    
  } catch (error) {
    console.error('Error executing SQL:', error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
