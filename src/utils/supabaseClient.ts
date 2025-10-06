// Supabase client configuration
// This would be used in a real implementation to connect to Supabase

export const SUPABASE_URL = 'https://iaqyggcjvrprevburnjy.supabase.co'
export const SUPABASE_CLIENT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcXlnZ2NqdnJwcmV2YnVybmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzEwODcsImV4cCI6MjA3NTMwNzA4N30.A7gC54oGssSDG88nwkA2NeBbsoBy408tZeBLooTssXg'
export const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcXlnZ2NqdnJwcmV2YnVybmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTczMTA4NywiZXhwIjoyMDc1MzA3MDg3fQ.fQu1-6VQsYCl24ZWDmi0e2D4qgQpUlvwdgikOIEnDs0'

// In a real implementation, you would create the Supabase client like this:
// import { createClient } from '@supabase/supabase-js'
// export const supabase = createClient(SUPABASE_URL, SUPABASE_CLIENT_KEY)

// For server-side operations with service role key:
// export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)