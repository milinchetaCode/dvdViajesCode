/**
 * src/services/supabaseStorage.js
 * Supabase storage driver for packages and highlights.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase configuration missing (SUPABASE_URL, SUPABASE_KEY).');
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('🔌 [Supabase] Client initialized successfully.');

async function loadPackagesJSON() {
  try {
    const { data, error } = await supabase
      .from('mv_settings')
      .select('value')
      .eq('key', 'packages')
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Row not found
        return [];
      }
      throw error;
    }

    return data?.value || [];
  } catch (err) {
    console.error('❌ Supabase loadPackagesJSON error:', err.message);
    return [];
  }
}

async function savePackagesJSON(data) {
  if (!data) data = [];

  try {
    const { error } = await supabase
      .from('mv_settings')
      .upsert({ key: 'packages', value: data, updated_at: new Date() });

    if (error) throw error;
    console.log('✅ [Supabase] Packages successfully saved to Supabase table "mv_settings".');
  } catch (err) {
    console.error('❌ Supabase savePackagesJSON error:', err.message);
    throw err;
  }
}

async function loadDestacadosJSON() {
  try {
    const { data, error } = await supabase
      .from('mv_settings')
      .select('value')
      .eq('key', 'destacados')
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Row not found
        return [];
      }
      throw error;
    }

    return data?.value || [];
  } catch (err) {
    console.error('❌ Supabase loadDestacadosJSON error:', err.message);
    return [];
  }
}

async function saveDestacadosJSON(data) {
  if (!data) data = [];

  try {
    const { error } = await supabase
      .from('mv_settings')
      .upsert({ key: 'destacados', value: data, updated_at: new Date() });

    if (error) throw error;
    console.log('✅ [Supabase] Destacados successfully saved to Supabase table "mv_settings".');
  } catch (err) {
    console.error('❌ Supabase saveDestacadosJSON error:', err.message);
    throw err;
  }
}

module.exports = {
  loadPackagesJSON,
  savePackagesJSON,
  loadDestacadosJSON,
  saveDestacadosJSON,
};
