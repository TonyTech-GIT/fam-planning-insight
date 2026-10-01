import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://pfkcsjaqztvvrtkkvzlp.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImY3NWUyYjkyLTFjMGYtNDdkOC1iMzJmLWQ2MGNkMmJiNDNiMCJ9.eyJwcm9qZWN0SWQiOiJwZmtjc2phcXp0dnZydGtrdnpscCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg4ODk4OTU4LCJleHAiOjIxMDQyNTg5NTgsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.nKp1-bE7p1Ys9k0wwznQu4fVr8ksvoKZ7WLyzlx7TcE';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };