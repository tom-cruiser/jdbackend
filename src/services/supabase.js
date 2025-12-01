const config = require("../config");

let supabase = null;
if (config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY) {
  // Only require the Supabase client when configuration is present.
  const { createClient } = require("@supabase/supabase-js");
  supabase = createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY
  );
}

module.exports = supabase;
