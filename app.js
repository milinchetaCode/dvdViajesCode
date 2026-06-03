const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimiter = require('./middleware/rateLimiter');
const { getConfig } = require('./config/env');  


dotenv.config();



const config = getConfig();

const requiredEnv = ['ADMIN_USER', 'ADMIN_PASS', 'SESSION_SECRET'];
const missing = requiredEnv.filter((key) => !process.env[key] || process.env[key].includes('mock'));

if (missing.length > 0) {
  console.warn('⚠️ Nota: Ejecutando en modo demo con credenciales/API keys de fallback.');
} else {
  console.log('✅ Todas las variables de entorno necesarias están definidas.');
}

const app = express();
app.disable('x-powered-by');

// ✅ Custom Helmet config to allow Cloudinary images and local images
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "blob:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// Ensure compression ignores binary images to prevent 206 Partial Content corruption on Render
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression'] || /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(req.url)) {
      return false; // Skip compression for these file extensions
    }
    return compression.filter(req, res); // Default compression for HTML, CSS, JS
  }
}));

app.use(morgan('combined'));
app.use(rateLimiter);
const PORT = config.port;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Tell Express it is behind a proxy (important for secure cookies on Render)
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ✅ CRITICAL: Static middleware MUST come BEFORE routes to serve images properly
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de express-session (antes de las rutas)
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8 // 8h
  }
}));

// ✅ Set default currentPage to prevent EJS ReferenceError
app.use((req, res, next) => {
  res.locals.currentPage = null;
  next();
});

// Routes - AFTER static middleware
const indexRoutes = require('./src/routes/index');
const paqueteRoutes = require('./src/routes/paquete');
const adminRoutes = require('./src/routes/admin');

// Use routes
app.use('/', indexRoutes);
app.use('/', paqueteRoutes);
app.use('/admin', adminRoutes);

// ✅ New standalone Hoteles route
app.get('/hoteles', (req, res) => {
  res.render('hoteles'); // renderiza views/hoteles.ejs
});

app.get('/about', (req, res) => {
  res.render('about', { currentPage: 'about' });
});

app.get('/faq', (req, res) => {
  res.render('faq', { currentPage: 'faq' });
});

// ✅ Catch-all 404 handler (must go LAST, after static and all routes)
app.use((req, res) => {
  res.status(404).render('404', {
    message: 'Página no encontrada',
    currentPage: null // asegura que el layout no rompa
  });
});

// Server
app.listen(PORT, '0.0.0.0', () => console.log(`App running on http://0.0.0.0:${PORT}`));

/* Global error handler */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).render('500', { message: 'Error del servidor', error: process.env.NODE_ENV !== 'production' ? err : null, currentPage: null });
});
