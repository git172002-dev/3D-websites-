/* ==========================================================================
   FORNO // THE ART OF PIZZA // CORE ENGINE (VERTICAL EDITION)
   ========================================================================== */

// Pre-scanned edge colors for borderless background blending
const PIZZA_BG_COLORS = [
  "#721401", "#721401", "#721401", "#721401", "#721401", "#6f1502", "#721401", "#711501", "#741601", "#711401", 
  "#7a1b02", "#942e0a", "#b96737", "#c56f3c", "#f7ac66", "#ad7f56", "#7d5d3d", "#4a3622", "#322213", "#302011", 
  "#302011", "#312011", "#2c1e0f", "#2c1d0f", "#322015", "#3a2113", "#3c281a", "#432f21", "#403023", "#472f20", 
  "#59331e", "#4e3626", "#493020", "#4c3525", "#472d1d", "#483122", "#4d3525", "#452d1d", "#542e19", "#552d18", 
  "#482e1e", "#472f21", "#483020", "#452c1c", "#4b3323", "#493223", "#4a3323", "#473224", "#48372a", "#512c18", 
  "#423024", "#463427", "#443023", "#4b3627", "#4e3727", "#4e2d1b", "#472e1f", "#442e20", "#433225", "#413024", 
  "#432f22", "#56321e", "#58331c", "#57331c", "#58321b", "#5e432c", "#704a31", "#7c5739", "#92673f", "#9d7149", 
  "#b38757", "#be8f5c", "#c3965f", "#c7995f", "#d1a268", "#cd9f63", "#cf9d5e", "#d09d5f", "#d19f5f", "#d09f5f", 
  "#d09f5e", "#d19e5f"
];

// Initialize global variables
const frameCount = 82;
const images = [];
let loadedCount = 0;

const loader = document.getElementById('pizza-loader');
const loaderBar = document.getElementById('loader-bar-fill');
const loaderPct = document.getElementById('loader-pct');
const header = document.querySelector('.pizza-header');
const hud = document.querySelector('.pizza-hud');

const canvas = document.getElementById('pizza-canvas');
const ctx = canvas.getContext('2d');

// Resolve frame URLs
const currentFramePath = index => `./frames/p1_${index.toString().padStart(3, '0')}.png`;

// ==========================================================================
// 1. CONCURRENT PRELOADER ENGINE
// ==========================================================================

const updateProgress = () => {
  loadedCount++;
  const progress = Math.min(100, Math.floor((loadedCount / frameCount) * 100));
  
  if (loaderBar) loaderBar.style.width = `${progress}%`;
  if (loaderPct) loaderPct.textContent = `${progress.toString().padStart(2, '0')}%`;
  
  if (loadedCount === frameCount) {
    setTimeout(onPreloadComplete, 400);
  }
};

const preloadImages = () => {
  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.onload = updateProgress;
    img.onerror = updateProgress;
    img.src = currentFramePath(i);
    images.push(img);
  }
};

const onPreloadComplete = () => {
  // Fade out preloader
  if (loader) {
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
    setTimeout(() => loader.remove(), 800);
  }
  
  // Show header and HUD
  if (header) header.classList.add('visible');
  if (hud) hud.classList.add('visible');
  
  // Initialize canvas drawing dimensions
  resizeCanvas();
  
  // Build GSAP and Lenis scrollytelling
  initScrollytelling();
};

// ==========================================================================
// 2. CANVAS DRAWING AND COVER MATH
// ==========================================================================

const resizeCanvas = () => {
  if (!canvas) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  
  drawPizzaFrame(Math.round(currentScrubIndex));
};

let currentScrubIndex = 0;

const drawPizzaFrame = (index) => {
  const img = images[index];
  if (!img) return;
  
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;
  
  ctx.clearRect(0, 0, w, h);
  
  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
  
  let drawWidth = w;
  let drawHeight = h;
  let startX = 0;
  let startY = 0;
  
  // 16:9 aspect cover math inside viewport (fullscreen cover)
  if (canvasRatio > imgRatio) {
    drawHeight = w / imgRatio;
    startY = (h - drawHeight) / 2;
  } else {
    drawWidth = h * imgRatio;
    startX = (w - drawWidth) / 2;
  }
  
  ctx.drawImage(img, startX, startY, drawWidth, drawHeight);
};

// ==========================================================================
// 3. GSAP VERTICAL SCROLL ENGINE
// ==========================================================================

const initScrollytelling = () => {
  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);
  
  // Smooth scroll using Lenis
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true
  });
  
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  
  // Synchronize Lenis with ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);
  
  const scrollContainer = document.getElementById('pizza-scroll-container');
  const ambientGlow = document.getElementById('pizza-ambient-glow');
  
  // Calculate vertical offset of final served pizza presentation
  const getScrubEnd = () => {
    const finalSection = document.getElementById('section-final');
    if (!finalSection) return window.innerHeight * 6.5;
    const rect = finalSection.getBoundingClientRect();
    return rect.bottom + window.scrollY - window.innerHeight;
  };
  
  // 1. Fixed Canvas Frame Scrubber (Triggers from slide 1 to slide 7)
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: 'top top',
    end: getScrubEnd,
    scrub: 0.4, // Responsive rapid-scrub
    onUpdate: (self) => {
      const progress = self.progress;
      const targetFrame = Math.floor(progress * (frameCount - 1));
      if (targetFrame !== currentScrubIndex) {
        currentScrubIndex = targetFrame;
        drawPizzaFrame(currentScrubIndex);
      }
      
      // Blend background color dynamically
      const activeColor = PIZZA_BG_COLORS[currentScrubIndex] || '#721401';
      document.body.style.backgroundColor = activeColor;
      
      if (ambientGlow) {
        ambientGlow.style.background = `radial-gradient(circle at 50% 50%, ${activeColor} 0%, transparent 70%)`;
      }
      
      // Toggle theme contrast on light cream frames
      if (currentScrubIndex >= 70) {
        document.body.classList.add('light-theme-dark-elements');
      } else {
        document.body.classList.remove('light-theme-dark-elements');
      }
    }
  });

  // 2. Global Page Scroll progress tracking (HUD Progress fill bar)
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const hudProgressFill = document.getElementById('hud-progress-fill');
      if (hudProgressFill) hudProgressFill.style.width = `${self.progress * 100}%`;
    }
  });

  // 3. Section Scroll Intersections (Triggers HUD digits and active menu underlines)
  gsap.utils.toArray('.scroll-section').forEach((sec, idx) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => updateHUD(idx + 1),
      onEnterBack: () => updateHUD(idx + 1)
    });
  });

  const updateHUD = (index) => {
    const hudActiveNum = document.getElementById('hud-active-num');
    if (hudActiveNum) hudActiveNum.textContent = index.toString().padStart(2, '0');
    
    // Update navigation active links
    const links = document.querySelectorAll('.nav-link');
    links.forEach(l => l.classList.remove('active'));
    
    if (index <= 4) {
      links[0].classList.add('active'); // Story (Slides 1 to 4)
    } else if (index === 5 || index === 6 || index === 7) {
      links[2].classList.add('active'); // Craft (Slides 5 to 7)
    } else if (index === 8) {
      links[1].classList.add('active'); // Menu (Slide 8)
    } else {
      links[3].classList.add('active'); // Reviews (Slides 9 and 10)
    }
  };
  
  // 4. Fade-up reveal animations on Editorial Cards as they scroll up the screen
  gsap.utils.toArray('.scroll-section').forEach((sec) => {
    if (sec.id === 'section-intro') return;
    
    const card = sec.querySelector('.editorial-card');
    if (card) {
      gsap.fromTo(card, { y: 100, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: {
          trigger: sec,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      });
    }
  });
};

// ==========================================================================
// 4. CUSTOM CINEMATIC CURSOR INTERACTION
// ==========================================================================

const initCursor = () => {
  const ring = document.querySelector('#pizza-cursor .cursor-ring');
  const dot = document.querySelector('#pizza-cursor .cursor-dot');
  
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (dot) {
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
    }
  });
  
  const tick = () => {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    
    if (ring) {
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  
  document.body.addEventListener('mouseenter', (e) => {
    if (e.target.classList && (e.target.classList.contains('magnetic') || e.target.classList.contains('pizza-card') || e.target.tagName === 'A' || e.target.tagName === 'BUTTON')) {
      document.body.classList.add('c-hover');
    }
  }, true);
  
  document.body.addEventListener('mouseleave', (e) => {
    if (e.target.classList && (e.target.classList.contains('magnetic') || e.target.classList.contains('pizza-card') || e.target.tagName === 'A' || e.target.tagName === 'BUTTON')) {
      document.body.classList.remove('c-hover');
    }
  }, true);
};

// Window listener triggers
window.addEventListener('resize', resizeCanvas);
window.addEventListener('DOMContentLoaded', () => {
  initCursor();
  preloadImages();
});
