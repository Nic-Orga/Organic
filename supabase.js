const { createClient } = require('@supabase/supabase-js');

let client = null;

function getSupabase() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants dans .env');
  }
  // La clé "service role" est utilisée uniquement côté serveur : elle ne doit
  // JAMAIS être envoyée au navigateur ni mise dans le code du front-end.
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

const BUCKET = process.env.SUPABASE_BUCKET || 'organic-media';

module.exports = { getSupabase, BUCKET };
