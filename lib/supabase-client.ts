import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a proxy that throws the error only when the client is actually used
const createSupabaseProxy = () => {
  if (!supabaseUrl || !supabaseKey) {
    return new Proxy({} as any, {
      get() {
        throw new Error(
          "Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
        );
      },
    });
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const supabase = createSupabaseProxy();
