const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const requireLogin = require('../../middleware/requireLogin');

// Services for package CRUD and destacados
const {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  loadDestacadosJSON,
  saveDestacadosJSON,
} = require('../services/supabaseStorage');

// ADMIN PANEL GET
router.get('/panel', requireLogin, async (req, res) => {
  try {
    const paquetes = await getPackages();
    const destacados = await loadDestacadosJSON();
    res.render('admin/panel', { paquetes, destacados, user: req.session.user });
  } catch (err) {
    console.error('Error loading admin data:', err);
    res.status(500).send('Error loading admin data');
  }
});

// ADMIN PANEL SAVE (create/update)
router.post('/panel', requireLogin, async (req, res) => {
  try {
    const paquetesForm = req.body.paquetes || {};
    // Ensure paquetesForm is an object
    if (typeof paquetesForm !== 'object') {
      return res.status(400).send('Datos de paquetes inválidos.');
    }
    // Process each package entry
    const keys = Object.keys(paquetesForm);
    for (const id of keys) {
      const pkg = paquetesForm[id];
      // Determine if this is a new package (no id in DB)
      const exists = await supabase.from('packages').select('id').eq('id', id).single();
      if (exists.data) {
        await updatePackage(id, {
          event_name: pkg.eventName,
          ticket_price: pkg.ticketPrice,
          flight_info: pkg.flightInfo,
          hotel_info: pkg.hotelInfo,
          description: pkg.description,
          availability_dates: pkg.availabilityDates,
          photo_url: pkg.photoUrl,
          visible: pkg.visible === '1',
        });
      } else {
        await createPackage({
          event_name: pkg.eventName,
          ticket_price: pkg.ticketPrice,
          flight_info: pkg.flightInfo,
          hotel_info: pkg.hotelInfo,
          description: pkg.description,
          availability_dates: pkg.availabilityDates,
          photo_url: pkg.photoUrl,
          visible: pkg.visible === '1',
        });
      }
    }
    if (req.body.destacados !== undefined) {
      await saveDestacadosJSON(req.body.destacados);
    }
    res.redirect('/admin/panel');
  } catch (err) {
    console.error('Error saving admin data:', err);
    res.status(500).send('Error saving admin data');
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
    const packagesData = await loadPackagesJSON();
    const paquetes = Array.isArray(packagesData)
      ? packagesData
      : Object.entries(packagesData).map(([id, pkg]) => ({ id, ...pkg }));
    
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
    let paquetesForm = req.body.paquetes;

    if (paquetesForm === undefined) {
      paquetesForm = {};
    }

    if (typeof paquetesForm !== 'object') {
      return res.status(400).send('Datos de paquetes inválidos.');
    }

    const existingPackages = await loadPackagesJSON();
    const existingArray = Array.isArray(existingPackages)
      ? existingPackages
      : Object.entries(existingPackages).map(([id, pkg]) => ({ id, ...pkg }));

    const paquetes = Object.entries(paquetesForm).map(([id, pkg]) => {
      const existing = existingArray.find(p => p.id === id) || {};

      // Accept both text and numeric prices (e.g. "USD 300", "call us", 300, etc.)
      let ticketPrice = pkg.ticketPrice || existing.ticketPrice || '';

      return {
        id,
        eventName: typeof pkg.eventName === 'string' && pkg.eventName.trim() !== ''
          ? pkg.eventName.trim()
          : existing.eventName || '',
        ticketPrice,
        flightInfo: typeof pkg.flightInfo === 'string'
          ? pkg.flightInfo.trim()
          : existing.flightInfo || '',
        hotelInfo: typeof pkg.hotelInfo === 'string'
          ? pkg.hotelInfo.trim()
          : existing.hotelInfo || '',
        description: typeof pkg.description === 'string'
          ? pkg.description.trim()
          : existing.description || '',
        availabilityDates: typeof pkg.availabilityDates === 'string'
          ? pkg.availabilityDates.trim()
          : existing.availabilityDates || '',
        visible: pkg.visible === '1',
        foto: typeof pkg.foto === 'string' ? pkg.foto.trim() : existing.foto || '',
        photoUrl: typeof pkg.photoUrl === 'string' ? pkg.photoUrl.trim() : existing.photoUrl || ''
      };
    });

    await savePackagesJSON(paquetes);

    if (req.body.destacados !== undefined) {
      await saveDestacadosJSON(req.body.destacados);
    }

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
