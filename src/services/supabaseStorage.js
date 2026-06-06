// src/services/supabaseStorage.js
// Supabase storage driver for packages

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase configuration missing. Set SUPABASE_URL and SUPABASE_KEY environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('🔌 [Supabase] Client initialized successfully.');

// ---------- Field mapping helpers ----------
// DB uses snake_case, templates use camelCase

/** Convert a DB row (snake_case) to a JS object (camelCase) for templates */
function dbRowToPackage(row) {
  return {
    id: row.id,
    eventName: row.event_name || '',
    ticketPrice: row.ticket_price || '',
    flightInfo: row.flight_info || '',
    hotelInfo: row.hotel_info || '',
    description: row.description || '',
    availabilityDates: row.availability_dates || '',
    photoUrl: row.photo_url || '',
    continent: row.continent || '',
    visible: row.visible !== undefined ? row.visible : true,
  };
}

/** Convert a JS object (camelCase) to a DB row (snake_case) for inserts/updates */
function packageToDbRow(pkg) {
  const row = {};
  if (pkg.eventName !== undefined) row.event_name = pkg.eventName;
  if (pkg.ticketPrice !== undefined) row.ticket_price = pkg.ticketPrice;
  if (pkg.flightInfo !== undefined) row.flight_info = pkg.flightInfo;
  if (pkg.hotelInfo !== undefined) row.hotel_info = pkg.hotelInfo;
  if (pkg.description !== undefined) row.description = pkg.description;
  if (pkg.availabilityDates !== undefined) row.availability_dates = pkg.availabilityDates;
  if (pkg.photoUrl !== undefined) row.photo_url = pkg.photoUrl;
  if (pkg.continent !== undefined) row.continent = pkg.continent;
  if (pkg.visible !== undefined) row.visible = pkg.visible;
  // Also accept already-snake_case fields (from the first POST handler)
  if (pkg.event_name !== undefined) row.event_name = pkg.event_name;
  if (pkg.ticket_price !== undefined) row.ticket_price = pkg.ticket_price;
  if (pkg.flight_info !== undefined) row.flight_info = pkg.flight_info;
  if (pkg.hotel_info !== undefined) row.hotel_info = pkg.hotel_info;
  if (pkg.availability_dates !== undefined) row.availability_dates = pkg.availability_dates;
  if (pkg.photo_url !== undefined) row.photo_url = pkg.photo_url;
  if (pkg.continent !== undefined) row.continent = pkg.continent;
  return row;
}

// ---------- Packages Table CRUD ----------

/** Get all packages (returns camelCase objects for templates) */
async function getPackages() {
  try {
    const { data, error } = await supabase.from('packages').select('*');
    if (error) {
      console.error('❌ Supabase getPackages error:', error.message);
      return []; // Return empty array instead of throwing
    }
    return (data || []).map(dbRowToPackage);
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    return []; // Return empty array on connection failure
  }
}

/** Create a new package (accepts camelCase or snake_case fields) */
async function createPackage(pkg) {
  const row = packageToDbRow(pkg);
  const { data, error } = await supabase.from('packages').insert([row]).select();
  if (error) {
    console.error('❌ Supabase createPackage error:', error.message);
    throw error;
  }
  return data && data[0] ? dbRowToPackage(data[0]) : null;
}

/** Update a package by id (accepts camelCase or snake_case fields) */
async function updatePackage(id, pkg) {
  const row = packageToDbRow(pkg);
  const { data, error } = await supabase.from('packages').update(row).eq('id', id).select();
  if (error) {
    console.error('❌ Supabase updatePackage error:', error.message);
    throw error;
  }
  return data && data[0] ? dbRowToPackage(data[0]) : null;
}

/** Delete a package by id */
async function deletePackage(id) {
  const { error } = await supabase.from('packages').delete().eq('id', id);
  if (error) {
    console.error('❌ Supabase deletePackage error:', error.message);
    throw error;
  }
  return true;
}

/** Get a tenant by domain */
async function getTenantByDomain(domain) {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('domain', domain)
      .single();
    if (error) {
      console.error('❌ Supabase getTenantByDomain error:', error.message);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error('❌ Supabase connection error in getTenantByDomain:', err.message);
    return null;
  }
}

/** Get distinct continents from packages table */
async function getContinents() {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('continent')
      .not('continent', 'is', null);
    if (error) {
      console.error('❌ Supabase getContinents error:', error.message);
      return [];
    }
    // Extract unique continents
    const continents = [...new Set((data || []).map(row => row.continent).filter(Boolean))];
    return continents.sort();
  } catch (err) {
    console.error('❌ Supabase connection error in getContinents:', err.message);
    return [];
  }
}

module.exports = {
  supabase,
  getPackages,
  getContinents,
  createPackage,
  updatePackage,
  deletePackage,
  getTenantByDomain,
};
