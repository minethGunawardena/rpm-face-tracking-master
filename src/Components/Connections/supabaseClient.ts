import { createClient } from '@supabase/supabase-js';

// Define your environment variables (consider using import.meta.env)
const supabaseUrl = 'https://sapauniiuubdrvkbvuty.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcGF1bmlpdXViZHJ2a2J2dXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzQ4MTUsImV4cCI6MjA2MDIxMDgxNX0.zEhtnBTg15_xErhvCjTSfz1dixw2YH0hH5h94ogCTgk';

// Create and export the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection with proper typing
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .limit(1);

    if (error) {
      console.error("❌ Supabase connection failed:", error.message);
      return { success: false, error };
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ Connection successful but no data found in 'videos' table");
      return { success: true, data: null };
    }

    console.log("✅ Supabase connected successfully. Data sample:", data[0]);
    return { success: true, data: data[0] };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error("❌ Connection test failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Run the test (optional)
testConnection().then(result => {
  console.log("Connection test completed:", result);
});

export default supabase;