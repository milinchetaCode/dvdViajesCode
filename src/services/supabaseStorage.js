// src/services/supabaseStorage.js
// Supabase storage driver for packages (stored in 'packages' table) and highlights (still in mv_settings)

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase configuration missing.');
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('🔌 [Supabase] Client initialized successfully.');

// ---------- Packages Table CRUD ----------
/** Get all packages */
async function getPackages() {
  const { data, error } = await supabase.from('packages').select('*');
  if (error) {
    console.error('❌ Supabase getPackages error:', error.message);
    throw error;
  }
  return data;
}

/** Create a new package. `pkg` should contain fields matching columns (except id). */
async function createPackage(pkg) {
  const { data, error } = await supabase.from('packages').insert([pkg]);
  if (error) {
    console.error('❌ Supabase createPackage error:', error.message);
    throw error;
  }
  return data[0];
}

/** Update an existing package by id. */
async function updatePackage(id, pkg) {
  const { data, error } = await supabase.from('packages').update(pkg).eq('id', id);
  if (error) {
    console.error('❌ Supabase updatePackage error:', error.message);
    throw error;
  }
  return data[0];
}

/** Hard delete a package by id. */
async function deletePackage(id) {
  const { error } = await supabase.from('packages').delete().eq('id', id);
  if (error) {
    console.error('❌ Supabase deletePackage error:', error.message);
    throw error;
  }
  return true;
}

// ---------- Destacados (highlights) still stored as JSON in mv_settings ----------
async function loadDestacadosJSON() {
  try {
    const { data, error } = await supabase
      .from('mv_settings')
      .select('value')
      .eq('key', 'destacados')
      .single();
    if (error) {
      if (error.code === 'PGRST116') return [];
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
    console.log('✅ [Supabase] Destacados saved.');
  } catch (err) {
    console.error('❌ Supabase saveDestacadosJSON error:', err.message);
    throw err;
  }
}

module.exports = {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  loadDestacadosJSON,
  saveDestacadosJSON,
};
