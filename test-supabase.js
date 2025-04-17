const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aomdacjzdfgueepwwsze.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbWRhY2p6ZGZndWVlcHd3c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NzQyNzYsImV4cCI6MjA1OTU1MDI3Nn0.eQ6Rl924rs3iAJWWhTC8uXd3b3HoGQygK-xN8SHmEiY';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase client initialized:', !!supabase);