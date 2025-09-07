const axios = require('axios');

const GITHUB_API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN;
const PKG_GIST_ID = process.env.GIST_PACKAGES_ID;
const DES_GIST_ID = process.env.GIST_DESTACADOS_ID;

if (!TOKEN) throw new Error('Falta la variable de entorno GITHUB_TOKEN');
if (!PKG_GIST_ID) throw new Error('Falta la variable de entorno GIST_PACKAGES_ID');
if (!DES_GIST_ID) throw new Error('Falta la variable de entorno GIST_DESTACADOS_ID');

function ghHeaders() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// Generic read
async function getGistFile(gistId, filename) {
  const url = `${GITHUB_API}/gists/${gistId}`;
  const resp = await axios.get(url, { headers: ghHeaders() });
  const files = resp?.data?.files || {};
  const file = files[filename];
  if (!file || typeof file.content !== 'string') {
    throw new Error(`No se encontró "${filename}" en el Gist ${gistId}`);
  }
  return file.content;
}

// Generic write with logging
async function setGistFile(gistId, filename, content) {
  console.log(`📝 Saving to Gist: ${gistId}, file: ${filename}`);
  console.log('Content preview (first 500 chars):', content.substring(0, 500));
  const url = `${GITHUB_API}/gists/${gistId}`;
  const body = { files: { [filename]: { content } } };
  try {
    const resp = await axios.patch(url, body, { headers: ghHeaders() });
    console.log('✅ Gist saved successfully:', resp.status);
  } catch (err) {
    console.error('❌ Error saving Gist:', err.response?.data || err.message);
    throw err;
  }
}

// JSON helpers with logging
async function loadJSONFromGist(gistId, filename) {
  const raw = await getGistFile(gistId, filename);
  return JSON.parse(raw);
}
async function saveJSONToGist(gistId, data, filename) {
  console.log(`🔹 Preparing to save JSON to ${filename}`);
  console.log('Data preview (first 500 chars):', JSON.stringify(data, null, 2).substring(0, 500));
  await setGistFile(gistId, filename, JSON.stringify(data, null, 2));
}

// --- Convenience helpers ---
async function loadPackagesJSON() {
  return loadJSONFromGist(PKG_GIST_ID, 'MFV_packages.json');
}
async function savePackagesJSON(data) {
  return saveJSONToGist(PKG_GIST_ID, data, 'MFV_packages.json');
}

async function loadDestacadosJSON() {
  return loadJSONFromGist(DES_GIST_ID, 'MFV_destacados.json');
}
async function saveDestacadosJSON(data) {
  return saveJSONToGist(DES_GIST_ID, data, 'MFV_destacados.json');
}

module.exports = {
  loadJSONFromGist,
  saveJSONToGist,
  loadPackagesJSON,
  savePackagesJSON,
  loadDestacadosJSON,
  saveDestacadosJSON,
};
