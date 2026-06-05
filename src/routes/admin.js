const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const requireLogin = require('../../middleware/requireLogin');

// Services for package CRUD
const {
  supabase,
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
} = require('../services/supabaseStorage');

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

// GET — Load packages from the packages table
router.get('/panel', requireLogin, async (req, res) => {
  try {
    const paquetes = await getPackages();
    res.render('admin/panel', { paquetes, user: req.session.user });
  } catch (err) {
    console.error('Error loading admin data:', err);
    res.status(500).send('Error loading admin data');
  }
});

// POST — Save packages to the packages table (create/update)
router.post('/panel', requireLogin, async (req, res) => {
  try {
    let paquetesForm = req.body.paquetes;

    if (paquetesForm === undefined) {
      paquetesForm = {};
    }

    if (typeof paquetesForm !== 'object') {
      return res.status(400).send('Datos de paquetes inválidos.');
    }

    // Load existing packages to merge unchanged fields
    const existingPackages = await getPackages();

    const keys = Object.keys(paquetesForm);
    for (const id of keys) {
      const pkg = paquetesForm[id];
      const existing = existingPackages.find(p => p.id === id);

      const packageData = {
        eventName: typeof pkg.eventName === 'string' && pkg.eventName.trim() !== ''
          ? pkg.eventName.trim()
          : (existing ? existing.eventName : ''),
        ticketPrice: pkg.ticketPrice || (existing ? existing.ticketPrice : ''),
        flightInfo: typeof pkg.flightInfo === 'string'
          ? pkg.flightInfo.trim()
          : (existing ? existing.flightInfo : ''),
        hotelInfo: typeof pkg.hotelInfo === 'string'
          ? pkg.hotelInfo.trim()
          : (existing ? existing.hotelInfo : ''),
        description: typeof pkg.description === 'string'
          ? pkg.description.trim()
          : (existing ? existing.description : ''),
        availabilityDates: typeof pkg.availabilityDates === 'string'
          ? pkg.availabilityDates.trim()
          : (existing ? existing.availabilityDates : ''),
        photoUrl: typeof pkg.photoUrl === 'string'
          ? pkg.photoUrl.trim()
          : (existing ? existing.photoUrl : ''),
        visible: pkg.visible === '1',
      };

      if (existing) {
        await updatePackage(id, packageData);
      } else {
        await createPackage(packageData);
      }
    }

    res.redirect('/admin/panel');
  } catch (err) {
    console.error('Error saving admin data:', err);
    res.status(500).send('Error saving admin data');
  }
});

// CREATE new package endpoint (returns JSON)
router.post('/panel/create', requireLogin, async (req, res) => {
  try {
    // Create a minimal package with default values
    const newPackage = await createPackage({
      eventName: 'Nuevo Paquete',
      ticketPrice: '',
      flightInfo: '',
      hotelInfo: '',
      description: '',
      availabilityDates: '',
      photoUrl: '',
      visible: true,
    });
    res.json(newPackage);
  } catch (err) {
    console.error('Error creating package:', err);
    res.status(500).json({ error: 'Error creating package' });
  }
});

// DELETE package endpoint
router.post('/panel/delete/:id', requireLogin, async (req, res) => {
  try {
    const id = req.params.id;
    await deletePackage(id);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error deleting package:', err);
    res.status(500).send('Error deleting package');
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
