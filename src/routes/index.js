const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const {
  getPackages,
  getContinents,
} = require("../services/supabaseStorage");

// Configure Cloudinary from env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// HOME PAGE
router.get("/", async (req, res) => {
  try {
    // getPackages now returns empty array on error instead of throwing
    const packages = await getPackages();
    const continents = await getContinents();

    // Dynamic Hero Images from Cloudinary (graceful fallback)
    let heroImages = [];
    try {
      const result = await cloudinary.search
        .expression("folder:ManuFigueroaViajes/HeroSlider")
        .sort_by("public_id", "desc")
        .max_results(50)
        .execute();

      heroImages = result.resources.map((img) => img.secure_url);
    } catch (err) {
      console.error("Cloudinary error:", err.message);
      // heroImages stays empty array - page still loads
    }

    // Page loads even if Supabase or Cloudinary fail
    res.render("index", {
      packages, // Will be empty array if Supabase fails
      heroImages, // Will be empty array if Cloudinary fails
      continents, // Array of distinct continents
      tenant: res.locals.tenant || null, // Inject tenant data from middleware
      currentPage: "home",
    });
  } catch (err) {
    console.error("Error loading home page:", err);
    res.status(500).send("Error loading site data");
  }
});

module.exports = router;
