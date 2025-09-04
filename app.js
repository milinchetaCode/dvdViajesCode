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

const requiredEnv = ['XS2EVENT_API_KEY', 'ADMIN_USER', 'ADMIN_PASS', 'SESSION_SECRET'];
const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Faltan variables de entorno requeridas: ' + missing.join(', '));
  process.exit(1); // Detiene la app si faltan variables
} else {
  console.log('✅ Todas las variables de entorno necesarias están definidas.');
}

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
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
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(express.static('public'));

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

// Routes
const indexRoutes = require('./src/routes/index');
const eventRoutes = require('./src/routes/event');
const purchaseRoutes = require('./src/routes/purchase');
const f1Routes = require('./src/routes/f1');
const paqueteRoutes = require('./src/routes/paquete');
const adminRoutes = require('./src/routes/admin');

// ✅ New category routes
const futbolRoutes = require('./src/routes/futbol');
const tenisRoutes = require('./src/routes/tenis');
const basketRoutes = require('./src/routes/basket');

// Use routes
app.use('/', indexRoutes);
app.use('/event', eventRoutes);
app.use('/purchase', purchaseRoutes);
app.use('/', f1Routes);
app.use('/', paqueteRoutes);
app.use('/', futbolRoutes);
app.use('/', tenisRoutes);
app.use('/', basketRoutes);
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

// ✅ Catch-all 404 handler (must go last)
app.use((req, res) => {
  res.status(404).render('404', {
    message: 'Página no encontrada',
    currentPage: null // asegura que el layout no rompa
  });
});

// Server
app.listen(PORT, () => console.log(`App running on http://localhost:${PORT}`));

/* Global error handler */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).render('500', { message: 'Error del servidor', error: process.env.NODE_ENV !== 'production' ? err : null, currentPage: null });
});
