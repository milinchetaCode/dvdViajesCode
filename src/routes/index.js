const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const {
  loadPackagesJSON,
  loadDestacadosJSON,
} = require("../services/gistStorage");

// Configure Cloudinary from env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// HOME PAGE
router.get("/", async (req, res) => {
  try {
    const packagesObj = await loadPackagesJSON();
    const events = await loadDestacadosJSON();

    // Convert object to array
    const packages = Object.keys(packagesObj).map((key) => ({
      id: key,
      ...packagesObj[key],
    }));

    // Dynamic Hero Images from Cloudinary
    let heroImages = [];
    try {
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix: "ManuFigueroaViajes/HeroSlider/", // Cloudinary folder
        max_results: 50,
      });
      heroImages = result.resources.map((img) => img.secure_url);
    } catch (err) {
      console.error("Cloudinary error:", err);
    }

    res.render("index", {
      packages,
      events,
      heroImages, // pass to template
      currentPage: "home",
    });
  } catch (err) {
    console.error("Error loading data!", err);
    res.status(500).send("Error loading site data");
  }
});

module.exports = router;
