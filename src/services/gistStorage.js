/**
 * src/services/gistStorage.js
 * Minimal client to read/write JSON files (packages.json, destacados.json) from GitHub Gists.
 * - Auth: PAT with "gist" scope in process.env.GITHUB_TOKEN
 * - Uses GIST_PACKAGES_ID, GIST_DESTACADOS_ID for file location
 */

const axios = require('axios');

const GITHUB_API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN;
const PKG_GIST_ID = process.env.GIST_PACKAGES_ID;
const DES_GIST_ID = process.env.GIST_DESTACADOS_ID;

if (!TOKEN) throw new Error('Falta la variable de entorno GITHUB_TOKEN');
if (!PKG_GIST_ID) throw new Error('Falta la variable de entorno GIST_PACKAGES_ID');
if (!DES_GIST_ID) throw new Error('Falta la variable de entorno GIST_DESTACADOS_ID');

// Common headers for GitHub API
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
 //console.log(resp.data);
  const files = resp?.data?.files || {};
  const file = files[filename];
  if (!file || typeof file.content !== 'string') {
    throw new Error(`No se encontró "${filename}" en el Gist ${gistId}`);
  }
  return file.content;
}

// Generic write
async function setGistFile(gistId, filename, content) {
  const url = `${GITHUB_API}/gists/${gistId}`;
  const body = { files: { [filename]: { content } } };
  await axios.patch(url, body, { headers: ghHeaders() });
}

// Generic JSON read/write helpers
async function loadJSONFromGist(gistId, filename) {
  const raw = await getGistFile(gistId, filename);
  return JSON.parse(raw);
}
async function saveJSONToGist(gistId, data, filename) {
  await setGistFile(gistId, filename, JSON.stringify(data, null, 2));
}

// --- Convenience helpers for each file ---

// packages.json cargados desde el admin panel por los vendedores
async function loadPackagesJSON() {
  return loadJSONFromGist(PKG_GIST_ID, 'MFV_packages.json');
}
async function savePackagesJSON(data) {
  return saveJSONToGist(PKG_GIST_ID, data, 'MFV_packages.json');
}

// destacados.json ofertas destacadas de XS2EVENT seleccionadas por los vendedores en el admin panel
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
