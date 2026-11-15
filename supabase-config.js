// ============================================================
//  NEARTIME — Supabase Configuration
//  Replace the values below with your actual Supabase project
//  credentials from: https://supabase.com/dashboard/project/_/settings/api
// ============================================================

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';  // <-- replace
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';            // <-- replace

// Initialize Supabase client (requires supabase CDN script loaded first)
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.db = supabaseClient;
