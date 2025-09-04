const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const requireLogin = require('../../middleware/requireLogin');

// Services for your original admin data
const {
  loadPackagesJSON,
  savePackagesJSON,
  loadDestacadosJSON,
  saveDestacadosJSON,
} = require('../services/gistStorage');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

/* ============================
   LOGIN & LOGOUT
============================ */
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin/panel');
  res.render('login', { error: null }); // views/login.ejs
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.user = { username };
    return res.redirect('/admin/panel');
  }

  res.render('login', { error: 'Usuario o contraseña incorrectos' });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

/* ============================
   ADMIN PANEL
============================ */
router.get('/panel', requireLogin, async (req, res) => {
  try {
    let paquetesObj = await loadPackagesJSON();
    const paquetes = Object.entries(paquetesObj).map(([id, pkg]) => ({ id, ...pkg }));
    
    const destacados = await loadDestacadosJSON();

    res.render('admin/panel', {
      paquetes,
      destacados,
      user: req.session.user,
    });
  } catch (err) {
    console.error('Error loading admin data:', err);
    res.status(500).send('Error loading admin data');
  }
});

router.post('/panel', requireLogin, async (req, res) => {
  try {
    await savePackagesJSON(req.body.paquetes);
    await saveDestacadosJSON(req.body.destacados);
    res.redirect('/admin/panel');
  } catch (err) {
    console.error('Error saving admin data:', err);
    res.status(500).send('Error saving admin data');
  }
});

/* ============================
   GALERÍA FOTOS
============================ */
router.get('/fotos', requireLogin, async (req, res) => {
  try {
    const sliderResponse = await cloudinary.search
      .expression('folder:ManuFigueroaViajes/HeroSlider')
      .sort_by('public_id', 'desc')
      .max_results(100)
      .execute();

    const paquetesResponse = await cloudinary.search
      .expression('folder:ManuFigueroaViajes/Packs')
      .sort_by('public_id', 'desc')
      .max_results(100)
      .execute();

    res.render('fotos', {
      sliderImages: sliderResponse.resources,
      paquetesImages: paquetesResponse.resources,
    });
  } catch (err) {
    console.error('Error fetching images from Cloudinary:', err);
    res.status(500).send('Error loading images');
  }
});

// Upload image to gallery
router.post('/photos/upload', requireLogin, upload.single('image'), async (req, res) => {
  const folder = req.body.folder;
  if (!folder || !req.file) return res.status(400).send('Missing folder or file');

  try {
    const streamUpload = (reqFile) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
          if (result) resolve(result);
          else reject(error);
        });
        streamifier.createReadStream(reqFile.buffer).pipe(stream);
      });
    };

    await streamUpload(req.file);
    res.redirect('/admin/fotos');
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).send('Error uploading image');
  }
});

// Delete image from gallery
router.post('/photos/delete', requireLogin, async (req, res) => {
  const public_id = req.body.public_id;
  if (!public_id) return res.status(400).send('Missing public_id');

  try {
    await cloudinary.uploader.destroy(public_id);
    res.redirect('/admin/fotos');
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).send('Error deleting image');
  }
});

module.exports = router;
