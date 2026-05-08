import { createClient }
    from "@supabase/supabase-js";

const supabaseUrl =
    "https://zoamtdhmatwmatzjczbo.supabase.co";

const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYW10ZGhtYXR3bWF0empjemJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMjY0NzksImV4cCI6MjA5MzgwMjQ3OX0.eN5O-ZuGQJaUznmBts9TrptgbaMReOEacZnmnvhLGsU";

export const supabase =
    createClient(
        supabaseUrl,
        supabaseKey
    );