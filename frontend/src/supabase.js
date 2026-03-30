import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://gkzzhdfalvpynighhhyv.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrenpoZGZhbHZweW5pZ2hoaHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDg4NzIsImV4cCI6MjA5MDQyNDg3Mn0.hYj_RCJi28rcgtE0F6MWjyEdjCt-eX3hM9CF1i_AV84"

export const supabase = createClient(supabaseUrl, supabaseKey)