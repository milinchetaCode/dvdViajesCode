// main.js

document.addEventListener('DOMContentLoaded', () => {
  // --- Feather Icons ---
  if (typeof feather !== 'undefined') {
    feather.replace();
  }

  // --- Hero Slider ---
  const sliderInner = document.getElementById('sliderInner');
  const heroSlider = document.getElementById('heroSlider');
  const prevSlide = document.getElementById('prevSlide');
  const nextSlide = document.getElementById('nextSlide');

  if (sliderInner && heroSlider && prevSlide && nextSlide) {
    let currentIndex = 0;
    const slides = sliderInner.children;
    const totalSlides = slides.length;

    const updateSlider = () => {
      sliderInner.style.transform = `translateX(-${currentIndex * 100}%)`;
    };

    prevSlide.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      updateSlider();
    });

    nextSlide.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % totalSlides;
      updateSlider();
    });
  }

  // --- Lightbox ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');

  if (lightbox && lightboxImg) {
    const heroImages = document.querySelectorAll('.hero-img');
    heroImages.forEach(img => {
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightbox.classList.remove('hidden');
      });
    });

    // Close button
    window.closeLightbox = () => lightbox.classList.add('hidden');

    // Click outside image to close
    lightbox.addEventListener('click', e => {
      if (e.target.id === 'lightbox') window.closeLightbox();
    });
  }
});
