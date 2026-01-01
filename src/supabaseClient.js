import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dpyjybphkorwfuopftyi.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRweWp5YnBoa29yd2Z1b3BmdHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNjgzNTEsImV4cCI6MjA4Mjg0NDM1MX0.f8cHLHGHb_gBmp_FuXR3OUwvJp80-tAGulcyelA_1Ps";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
