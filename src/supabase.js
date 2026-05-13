import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qibkymhepckddsptvazl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpYmt5bWhlcGNrZGRzcHR2YXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODY3ODAsImV4cCI6MjA5NDI2Mjc4MH0.PUdjTYS-dVN0k71pqrVRjvBrcfJkYJXkgdk72_-VL38'

export const supabase = createClient(
  supabaseUrl,
supabaseKey
)