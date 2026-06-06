// middleware/tenantResolver.js
const { getTenantByDomain } = require('../src/services/supabaseStorage');

// Paths that should bypass tenant resolution (admin, static assets, etc.)
const BYPASS_PATHS = ['/admin'];

module.exports = async (req, res, next) => {
  // Skip tenant resolution for admin routes
  if (BYPASS_PATHS.some(p => req.path.startsWith(p))) {
    res.locals.tenant = null;
    return next();
  }

  try {
    const domain = req.hostname;

    // In development (localhost / 127.0.0.1), skip strict tenant enforcement
    const isLocalhost = domain === 'localhost' || domain === '127.0.0.1';

    const tenant = await getTenantByDomain(domain);

    if (!tenant && !isLocalhost) {
      return res.status(404).render('404', { message: 'Domain not found', currentPage: null });
    }

    res.locals.tenant = tenant || null;
    next();
  } catch (err) {
    console.error('Tenant resolver error:', err);
    // On error, continue without tenant rather than crashing the site
    res.locals.tenant = null;
    next();
  }
};