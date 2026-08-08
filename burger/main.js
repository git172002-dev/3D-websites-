/* ==========================================================================
   THE ART OF LAYERS // LUXURY BRANDING MAIN SCRIPT (BURGER & COFFEE)
   ========================================================================== */

// Register ScrollTrigger globally
if (typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initLenis();
  initMagneticButtons();
  initAudioSystem();
  initMobileMenu();
  initCoordinatedAssetPreload();
});

/* ==========================================================================
   CUSTOM CURSOR SYSTEM
   ========================================================================== */

const initCursor = () => {
  const cursor = document.getElementById('custom-cursor');
  if (!cursor) return;
  
  const ring = cursor.querySelector('.cursor-ring');
  const dot = cursor.querySelector('.cursor-dot');
  
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Immediate dot update
    gsap.set(dot, { x: mouseX, y: mouseY });
  });
  
  // Tick movement with interpolation
  gsap.ticker.add(() => {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    gsap.set(ring, { x: ringX, y: ringY });
  });
  
  // Link hover handlers
  const hoverables = document.querySelectorAll('a, button, .btn-luxury, .magnetic, #audio-toggle');
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('c-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('c-hover'));
  });
};

/* ==========================================================================
   LENIS SMOOTH SCROLLER
   ========================================================================== */

let lenis;
const initLenis = () => {
  if (typeof Lenis === 'undefined') return;
  
  lenis = new Lenis({
    duration: 1.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -11 * t)), // Apple-like ease out inertia
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    infinite: false,
  });
  
  lenis.on('scroll', ScrollTrigger.update);
  
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  
  gsap.ticker.lagSmoothing(0);
};

/* ==========================================================================
   MAGNETIC INTERACTION WIDGETS
   ========================================================================== */

const initMagneticButtons = () => {
  const magnetics = document.querySelectorAll('.magnetic');
  magnetics.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(el, {
        x: x * 0.35,
        y: y * 0.35,
        duration: 0.3,
        ease: 'power2.out'
      });
      
      const glow = el.querySelector('.btn-border-glow');
      if (glow) {
        gsap.to(glow, {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          duration: 0.1
        });
      }
    });
    
    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1.1, 0.4)'
      });
    });
  });
};

/* ==========================================================================
   WEB AUDIO API PROCEDURAL AUDIO SYNTHESIZER
   ========================================================================== */

let audioCtx = null;
let humOsc = null;
let humGain = null;
let audioPlaying = false;

const initAudioSystem = () => {
  const toggleBtn = document.getElementById('audio-toggle');
  if (!toggleBtn) return;
  
  toggleBtn.addEventListener('click', () => {
    if (!audioCtx) {
      // Lazy initialize AudioContext on user gesture (browser safety)
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      
      // Create a low frequency ambient studio drone hum
      humOsc = audioCtx.createOscillator();
      humGain = audioCtx.createGain();
      
      humOsc.type = 'triangle';
      humOsc.frequency.setValueAtTime(55, audioCtx.currentTime); // A1 note
      
      humGain.gain.setValueAtTime(0.06, audioCtx.currentTime); // Low baseline volume
      
      humOsc.connect(humGain);
      humGain.connect(audioCtx.destination);
      humOsc.start();
    }
    
    if (audioPlaying) {
      // Fade out gain
      humGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      toggleBtn.classList.remove('playing');
      toggleBtn.querySelector('.audio-text').textContent = "SOUND OFF";
      audioPlaying = false;
    } else {
      // Resume context if suspended
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      // Fade in gain
      humGain.gain.exponentialRampToValueAtTime(0.06, audioCtx.currentTime + 0.3);
      toggleBtn.classList.add('playing');
      toggleBtn.querySelector('.audio-text').textContent = "SOUND ON";
      audioPlaying = true;
      playChirp(800, 200, 0.08); // Play confirmation chime
    }
  });
};

// Play a procedural UI feedback beep click
const playChirp = (startFreq, endFreq, vol) => {
  if (!audioCtx || !audioPlaying) return;
  
  const chirpOsc = audioCtx.createOscillator();
  const chirpGain = audioCtx.createGain();
  
  chirpOsc.connect(chirpGain);
  chirpGain.connect(audioCtx.destination);
  
  chirpOsc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
  chirpOsc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + 0.15);
  
  chirpGain.gain.setValueAtTime(vol, audioCtx.currentTime);
  chirpGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  
  chirpOsc.start();
  chirpOsc.stop(audioCtx.currentTime + 0.16);
};

let seaScrollProgress = 0;

// Modulate the hum oscillator pitch depending on scroll speed/progress
const updateAudioScrollPitch = (burgerProg, coffeeProg, seaProg) => {
  if (!audioCtx || !audioPlaying || !humOsc) return;
  
  // Combine progress of all three sections for global pitch modulation (range 55Hz - 95Hz)
  const combined = (burgerProg + coffeeProg + seaProg) / 3;
  const freq = 55 + combined * 40;
  
  humOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1);
};

/* ==========================================================================
   COORDINATED ASSET PRELOADER
   ========================================================================== */

const TOTAL_BURGER_FRAMES = 82;
const TOTAL_COFFEE_FRAMES = 82;
const TOTAL_SEA_FRAMES = 82;
const TOTAL_ASSET_COUNT = TOTAL_BURGER_FRAMES + TOTAL_COFFEE_FRAMES + TOTAL_SEA_FRAMES;

const burgerImages = [];
const coffeeImages = [];
const seaImages = [];
let loadedAssetsCount = 0;

const initCoordinatedAssetPreload = () => {
  const loader = document.getElementById('luxury-loader');
  const loaderBar = document.getElementById('loader-bar-fill');
  const loaderPct = document.getElementById('loader-pct');

  const onAssetLoaded = () => {
    loadedAssetsCount++;
    const progress = Math.round((loadedAssetsCount / TOTAL_ASSET_COUNT) * 100);
    
    if (loaderPct) loaderPct.textContent = `${progress}%`;
    if (loaderBar) loaderBar.style.width = `${progress}%`;

    if (loadedAssetsCount === TOTAL_ASSET_COUNT) {
      // Hide loader and initialize everything
      gsap.to(loader, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          loader.style.display = 'none';
          
          // Reveal stats indicators across both sections
          document.querySelectorAll('.telemetry-bar').forEach(el => el.classList.add('visible'));
          document.querySelectorAll('.page-number-hud').forEach(el => el.classList.add('visible'));
        }
      });

      // Start the individual scrollytelling sub-engines
      startBurgerEngine(burgerImages);
      startCoffeeEngine(coffeeImages);
      startSeaEngine(seaImages);
      
      // Refresh ScrollTrigger once after everything settles
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
    }
  };

  // Preload Burger images
  for (let i = 0; i < TOTAL_BURGER_FRAMES; i++) {
    const img = new Image();
    const padNum = String(i).padStart(3, '0');
    img.src = `./frames/Burger_${padNum}.png`;
    img.onload = onAssetLoaded;
    img.onerror = onAssetLoaded;
    burgerImages.push(img);
  }

  // Preload Coffee images
  for (let i = 0; i < TOTAL_COFFEE_FRAMES; i++) {
    const img = new Image();
    const padNum = String(i).padStart(3, '0');
    img.src = `./coffee_frames/coffee_${padNum}.png`;
    img.onload = onAssetLoaded;
    img.onerror = onAssetLoaded;
    coffeeImages.push(img);
  }

  // Preload Sea images
  for (let i = 0; i < TOTAL_SEA_FRAMES; i++) {
    const img = new Image();
    const padNum = String(i).padStart(3, '0');
    img.src = `./sea_frames/sea_${padNum}.png`;
    img.onload = onAssetLoaded;
    img.onerror = onAssetLoaded;
    seaImages.push(img);
  }
};

/* ==========================================================================
   BURGER SCROLLYTELLING ENGINE
   ========================================================================== */

let burgerScrollProgress = 0;
let coffeeScrollProgress = 0;

const startBurgerEngine = (images) => {
  const canvas = document.getElementById('burger-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let currentFrame = 0;
  let targetFrame = 0;

  const INGREDIENT_RANGES = [
    { start: 12, end: 18, index: 0, glow: 'rgba(197, 160, 89, 0.12)', name: "TOP BRIOCHE BUN", height: "0.22m" },
    { start: 19, end: 25, index: 1, glow: 'rgba(46, 184, 92, 0.12)', name: "CRISPY LETTUCE", height: "0.20m" },
    { start: 26, end: 32, index: 2, glow: 'rgba(230, 57, 70, 0.12)', name: "VINE TOMATOES", height: "0.18m" },
    { start: 33, end: 38, index: 3, glow: 'rgba(180, 70, 200, 0.10)', name: "RED ONIONS", height: "0.16m" },
    { start: 39, end: 44, index: 4, glow: 'rgba(110, 160, 40, 0.12)', name: "GHERKIN PICKLES", height: "0.14m" },
    { start: 45, end: 51, index: 5, glow: 'rgba(244, 90, 80, 0.12)', name: "APPLEWOOD BACON", height: "0.12m" },
    { start: 52, end: 60, index: 6, glow: 'rgba(255, 165, 0, 0.15)', name: "AGED CHEDDAR", height: "0.09m" },
    { start: 61, end: 68, index: 7, glow: 'rgba(255, 75, 45, 0.15)', name: "ANGUS BEEF", height: "0.06m" },
    { start: 69, end: 74, index: 8, glow: 'rgba(212, 175, 55, 0.12)', name: "CRAFT SAUCE", height: "0.03m" },
    { start: 75, end: 81, index: 9, glow: 'rgba(180, 140, 80, 0.10)', name: "BOTTOM BUN", height: "0.00m" }
  ];

  let activePanelIndex = -1;

  // Custom Seasoning/Ember Particle System
  const particles = [];
  for (let i = 0; i < 35; i++) {
    particles.push({
      x: Math.random() * 800,
      y: Math.random() * 600,
      size: Math.random() * 1.5 + 0.8,
      speedY: -(Math.random() * 0.4 + 0.15),
      speedX: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.5 + 0.15,
      baseColor: Math.random() > 0.6 ? '#c5a059' : '#e2c185',
      color: '#c5a059'
    });
  }

  const updateParticles = (activeIndex) => {
    particles.forEach(p => {
      if (activeIndex === 7) {
        // Angus beef: glowing ember sparks rising faster
        p.color = Math.random() > 0.5 ? '#ff532d' : '#ffab3b';
        p.speedY = -(Math.random() * 0.8 + 0.3);
        p.size = Math.random() * 2.2 + 0.8;
      } else if (activeIndex === 1) {
        // Lettuce: fresh green drifting specks
        p.color = '#5cd478';
        p.speedY = -(Math.random() * 0.3 + 0.1);
        p.size = Math.random() * 1.5 + 0.5;
      } else if (activeIndex === 2) {
        // Tomatoes: organic red cells
        p.color = '#e63946';
        p.speedY = -(Math.random() * 0.3 + 0.1);
      } else {
        // Standard gold dust
        p.color = p.baseColor;
        p.speedY = -(Math.random() * 0.4 + 0.15);
      }
    });
  };

  const drawParticles = () => {
    ctx.save();
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    
    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      
      if (p.y < 0) {
        p.y = h;
        p.x = Math.random() * w;
      }
      if (p.x < 0 || p.x > w) {
        p.x = Math.random() * w;
      }
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      
      if (p.color !== p.baseColor) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
      }
      
      ctx.fill();
    });
    ctx.restore();
  };

  const resizeCanvas = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    drawFrame(Math.round(currentFrame));
  };

  const drawFrame = (index) => {
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
    
    if (canvasRatio > imgRatio) {
      drawWidth = h * imgRatio;
      startX = (w - drawWidth) / 2;
    } else {
      drawHeight = w / imgRatio;
      startY = (h - drawHeight) / 2;
    }
    
    ctx.drawImage(img, startX, startY, drawWidth, drawHeight);
  };

  const initScrollTrigger = () => {
    ScrollTrigger.create({
      trigger: '#hero-scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        burgerScrollProgress = self.progress;
        targetFrame = self.progress * (TOTAL_BURGER_FRAMES - 1);
        updateAudioScrollPitch(burgerScrollProgress, coffeeScrollProgress, seaScrollProgress);
      }
    });
  };

  const renderLoop = () => {
    currentFrame += (targetFrame - currentFrame) * 0.085;
    const nextFrame = Math.round(currentFrame);
    
    drawFrame(nextFrame);
    handleScrollStoryboarding(nextFrame);
    drawParticles();
    
    requestAnimationFrame(renderLoop);
  };

  const introHeadline = document.getElementById('intro-headline');
  const panelsContainer = document.getElementById('ingredient-panels-container');
  const panels = document.querySelectorAll('#hero-scroll-container .ingredient-panel');
  const ambientGlow = document.getElementById('ambient-glow');
  
  const telStage = document.getElementById('telemetry-stage');
  const telHeight = document.getElementById('telemetry-height');
  const pageNum = document.getElementById('active-page-num');

  const handleScrollStoryboarding = (frameIndex) => {
    if (frameIndex <= 9) {
      // Intro Scene
      if (introHeadline) {
        introHeadline.style.display = 'flex';
        introHeadline.style.opacity = 1 - (frameIndex / 9);
        introHeadline.style.transform = `translateY(${-frameIndex * 4}px)`;
      }
      if (panelsContainer) {
        panelsContainer.style.opacity = 0;
        panelsContainer.style.transform = 'translateY(15px)';
      }
      
      activePanelIndex = -1;
      panels.forEach(p => p.style.display = 'none');
      
      if (ambientGlow) {
        ambientGlow.style.background = `radial-gradient(circle at 65% 50%, rgba(197, 160, 89, 0.12) 0%, transparent 60%)`;
      }
      
      if (telStage) telStage.textContent = "01 // INTRO";
      if (telHeight) telHeight.textContent = "0.00m";
      if (pageNum) pageNum.textContent = "01";
      
    } else {
      if (introHeadline) {
        introHeadline.style.display = 'none';
        introHeadline.style.opacity = 0;
      }
      if (panelsContainer) {
        panelsContainer.style.opacity = 1;
        panelsContainer.style.transform = 'translateY(0)';
      }
      
      const activeRange = INGREDIENT_RANGES.find(item => frameIndex >= item.start && frameIndex <= item.end);
      
      if (activeRange) {
        const index = activeRange.index;
        
        if (index !== activePanelIndex) {
          activePanelIndex = index;
          
          panels.forEach(p => p.style.display = 'none');
          const currentPanel = document.querySelector(`#hero-scroll-container .ingredient-panel[data-index="${index}"]`);
          if (currentPanel) {
            currentPanel.style.display = 'flex';
          }
          
          if (ambientGlow) {
            ambientGlow.style.background = `radial-gradient(circle at 65% 50%, ${activeRange.glow} 0%, transparent 60%)`;
          }
          
          playChirp(750, 300, 0.04);
          
          if (telStage) telStage.textContent = `02 // ${activeRange.name}`;
          if (telHeight) telHeight.textContent = activeRange.height;
          if (pageNum) pageNum.textContent = String(index + 1).padStart(2, '0');
          
          updateParticles(index);
        }
      } else {
        if (frameIndex >= 80) {
          if (telStage) telStage.textContent = "03 // ASSEMBLED";
          if (telHeight) telHeight.textContent = "0.00m";
          if (pageNum) pageNum.textContent = "05";
        }
      }
    }
  };

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  initScrollTrigger();
  requestAnimationFrame(renderLoop);
};

/* ==========================================================================
   COFFEE SCROLLYTELLING ENGINE
   ========================================================================== */

const startCoffeeEngine = (images) => {
  const canvas = document.getElementById('coffee-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let currentFrame = 0;
  let targetFrame = 0;

  const COFFEE_RANGES = [
    { start: 12, end: 28, index: 0, glow: 'rgba(107, 68, 35, 0.14)', name: "ESPRESSO EXTRACTION", height: "0.15m" },
    { start: 29, end: 44, index: 1, glow: 'rgba(245, 239, 231, 0.15)', name: "STEAMED MILK", height: "0.10m" },
    { start: 45, end: 60, index: 2, glow: 'rgba(197, 160, 89, 0.14)', name: "COCOA DETAILS", height: "0.05m" },
    { start: 61, end: 74, index: 3, glow: 'rgba(197, 160, 89, 0.12)', name: "SCHEMATIC BREAKDOWN", height: "0.02m" },
    { start: 75, end: 81, index: 4, glow: 'rgba(107, 68, 35, 0.12)', name: "SERVED PASSION", height: "0.00m" }
  ];

  let activePanelIndex = -1;

  // Custom Coffee Particles (Cream bubbles, Cinnamon dust, aroma specs)
  const particles = [];
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * 800,
      y: Math.random() * 600,
      size: Math.random() * 1.8 + 0.6,
      speedY: -(Math.random() * 0.35 + 0.1),
      speedX: (Math.random() - 0.5) * 0.1,
      alpha: Math.random() * 0.6 + 0.15,
      baseColor: Math.random() > 0.65 ? '#c68a3b' : '#6b4423', // Caramel or cinnamon brown
      color: '#c68a3b'
    });
  }

  const updateParticles = (activeIndex) => {
    particles.forEach(p => {
      if (activeIndex === 1) {
        // Steamed milk: Cream white soft bubbles floating up
        p.color = '#f5efe7';
        p.size = Math.random() * 3 + 1; // larger bubbles
        p.speedY = -(Math.random() * 0.4 + 0.1);
      } else if (activeIndex === 2) {
        // Cocoa dust: tiny specs falling down (positive speedY!)
        p.color = '#6b4423';
        p.size = Math.random() * 1.5 + 0.5;
        p.speedY = Math.random() * 0.3 + 0.1; // Float downward
      } else {
        // Standard cinnamon/caramel floating
        p.color = p.baseColor;
        p.speedY = -(Math.random() * 0.35 + 0.1);
        p.size = Math.random() * 1.8 + 0.6;
      }
    });
  };

  const drawParticles = () => {
    ctx.save();
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    
    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      
      // Boundaries wrap-around
      if (p.speedY < 0 && p.y < 0) {
        p.y = h;
        p.x = Math.random() * w;
      } else if (p.speedY > 0 && p.y > h) {
        p.y = 0;
        p.x = Math.random() * w;
      }
      
      if (p.x < 0 || p.x > w) {
        p.x = Math.random() * w;
      }
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });
    ctx.restore();
  };

  const resizeCanvas = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    drawFrame(Math.round(currentFrame));
  };

  // Draw vertical image containment
  const drawFrame = (index) => {
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
    
    if (canvasRatio > imgRatio) {
      drawWidth = h * imgRatio;
      startX = (w - drawWidth) / 2;
    } else {
      drawHeight = w / imgRatio;
      startY = (h - drawHeight) / 2;
    }
    
    ctx.drawImage(img, startX, startY, drawWidth, drawHeight);
  };

  const initScrollTrigger = () => {
    ScrollTrigger.create({
      trigger: '#coffee-scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        coffeeScrollProgress = self.progress;
        targetFrame = self.progress * (TOTAL_COFFEE_FRAMES - 1);
        updateAudioScrollPitch(burgerScrollProgress, coffeeScrollProgress, seaScrollProgress);
      }
    });
  };

  const renderLoop = () => {
    currentFrame += (targetFrame - currentFrame) * 0.085;
    const nextFrame = Math.round(currentFrame);
    
    drawFrame(nextFrame);
    handleScrollStoryboarding(nextFrame);
    drawParticles();
    
    requestAnimationFrame(renderLoop);
  };

  const COFFEE_BG_COLORS = ["#faf1e2", "#faf1e2", "#faf1e2", "#faf1e0", "#faf1e0", "#f6edde", "#ede2cf", "#b29274", "#855e40", "#573316", "#2b1201", "#1e0800", "#150500", "#170500", "#1e0b00", "#341703", "#422002", "#572b05", "#613102", "#673701", "#703903", "#703903", "#703903", "#6e3902", "#6b3803", "#693505", "#653305", "#633201", "#633103", "#623002", "#5f2f02", "#5f2f02", "#5f2f02", "#5f2f02", "#5f2f02", "#5f2f02", "#5f2f02", "#5f2f02", "#5d3004", "#5d3004", "#5f2f04", "#5f2e06", "#5f2f04", "#5d3004", "#5d3004", "#5f2f04", "#5f2e06", "#613106", "#643208", "#69360f", "#6b3a12", "#704015", "#75421b", "#77461e", "#7a4720", "#7d4c24", "#7e4d25", "#804f27", "#804f27", "#804f27", "#815028", "#815126", "#804f27", "#804f27", "#815028", "#7f4e26", "#7d4f26", "#7f5128", "#7f5128", "#7f5128", "#7f5128", "#81532a", "#8c5a30", "#8c5a2e", "#8d5b2d", "#8e5c2e", "#915c2f", "#945e2c", "#945f2a", "#955e28", "#97602c", "#97602a"];

  const introHeadline = document.getElementById('coffee-intro-headline');
  const panelsContainer = document.getElementById('coffee-panels-container');
  const panels = document.querySelectorAll('#coffee-scroll-container .ingredient-panel');
  const ambientGlow = document.getElementById('ambient-glow');
  
  const telStage = document.getElementById('coffee-stage');
  const telHeight = document.getElementById('coffee-height');
  const pageNum = document.getElementById('coffee-page-num');

  const handleScrollStoryboarding = (frameIndex) => {
    // Dynamically match the page background to the active coffee frame color to erase edges
    const coffeeContainer = document.getElementById('coffee-scroll-container');
    if (coffeeContainer) {
      coffeeContainer.style.backgroundColor = COFFEE_BG_COLORS[frameIndex] || '#faf1e2';
      
      // Toggle light theme class for high-contrast typography when background is light cream
      if (frameIndex <= 9) {
        coffeeContainer.classList.add('light-theme');
      } else {
        coffeeContainer.classList.remove('light-theme');
      }
    }

    if (frameIndex <= 9) {
      if (introHeadline) {
        introHeadline.style.display = 'flex';
        introHeadline.style.opacity = 1 - (frameIndex / 9);
        introHeadline.style.transform = `translateY(${-frameIndex * 4}px)`;
      }
      if (panelsContainer) {
        panelsContainer.style.opacity = 0;
        panelsContainer.style.transform = 'translateY(15px)';
      }
      
      activePanelIndex = -1;
      panels.forEach(p => p.style.display = 'none');
      
      if (ambientGlow) {
        ambientGlow.style.background = `radial-gradient(circle at 35% 50%, rgba(107, 68, 35, 0.12) 0%, transparent 60%)`;
      }
      
      if (telStage) telStage.textContent = "01 // COFFEE INTRO";
      if (telHeight) telHeight.textContent = "0.00m";
      if (pageNum) pageNum.textContent = "01";
      
    } else {
      if (introHeadline) {
        introHeadline.style.display = 'none';
        introHeadline.style.opacity = 0;
      }
      if (panelsContainer) {
        panelsContainer.style.opacity = 1;
        panelsContainer.style.transform = 'translateY(0)';
      }
      
      const activeRange = COFFEE_RANGES.find(item => frameIndex >= item.start && frameIndex <= item.end);
      
      if (activeRange) {
        const index = activeRange.index;
        
        if (index !== activePanelIndex) {
          activePanelIndex = index;
          
          panels.forEach(p => p.style.display = 'none');
          const currentPanel = document.querySelector(`#coffee-scroll-container .ingredient-panel[data-coffee-index="${index}"]`);
          if (currentPanel) {
            currentPanel.style.display = 'flex';
          }
          
          if (ambientGlow) {
            // Anchor ambient spotlight on the left side behind the swapped coffee cup placement
            ambientGlow.style.background = `radial-gradient(circle at 35% 50%, ${activeRange.glow} 0%, transparent 60%)`;
          }
          
          playChirp(700, 250, 0.04);
          
          if (telStage) telStage.textContent = `02 // ${activeRange.name}`;
          if (telHeight) telHeight.textContent = activeRange.height;
          if (pageNum) pageNum.textContent = String(index + 1).padStart(2, '0');
          
          updateParticles(index);
        }
      } else {
        if (frameIndex >= 80) {
          if (telStage) telStage.textContent = "03 // PASSION";
          if (telHeight) telHeight.textContent = "0.00m";
          if (pageNum) pageNum.textContent = "05";
        }
      }
    }
  };

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  initScrollTrigger();
  requestAnimationFrame(renderLoop);
};

/* ==========================================================================
   SEAFOOD SCROLLYTELLING ENGINE
   ========================================================================== */

const startSeaEngine = (images) => {
  const canvas = document.getElementById('sea-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let currentFrame = 0;
  let targetFrame = 0;

  const SEA_BG_COLORS = ["#031f36", "#022036", "#022036", "#022036", "#022036", "#052639", "#032639", "#042838", "#002331", "#072635", "#052435", "#002635", "#072635", "#0a2e3c", "#283f46", "#082a38", "#0a2a36", "#0b272e", "#11262d", "#0f2324", "#95aabd", "#8c9da3", "#b3b2a9", "#beb0a0", "#cdb59d", "#d9b999", "#d9b999", "#d9b99b", "#d8bb9a", "#daba98", "#dcba98", "#dcba98", "#dcba9a", "#daba9a", "#daba98", "#cbab8d", "#b59879", "#8d705a", "#715845", "#624c38", "#634d39", "#634d39", "#634d39", "#634d39", "#634d39", "#67513d", "#69503d", "#67513d", "#644b3a", "#644b3a", "#594435", "#392d23", "#040404", "#020104", "#010003", "#030205", "#020104", "#030205", "#030205", "#030205", "#090406", "#160d07", "#3b200e", "#4e2b12", "#553315", "#553315", "#573316", "#573316", "#573314", "#573314", "#573314", "#573314", "#7d5a41", "#70513c", "#6a5039", "#b79070", "#c6a37f", "#926a48", "#bd9772", "#cca77d", "#cca782", "#cda880"];

  const SEA_RANGES = [
    { start: 12, end: 28, index: 0, glow: 'rgba(143, 216, 210, 0.15)', name: "PRISTINE DEPTHS", temp: "14°C" },
    { start: 29, end: 45, index: 1, glow: 'rgba(214, 165, 90, 0.14)', name: "DAILY SELECT SOURCING", temp: "4°C" },
    { start: 46, end: 62, index: 2, glow: 'rgba(11, 59, 60, 0.18)', name: "MICHELIN SEARING", temp: "220°C" },
    { start: 63, end: 81, index: 3, glow: 'rgba(214, 165, 90, 0.12)', name: "LUXURY PRESENTATION", temp: "22°C" }
  ];

  let activePanelIndex = -1;

  // Custom Ocean/Underwater Floating Bubble Particles
  const particles = [];
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: Math.random() * 800,
      y: Math.random() * 600,
      size: Math.random() * 2.5 + 0.8,
      speedY: -(Math.random() * 0.6 + 0.2), // bubbles float up moderately
      alpha: Math.random() * 0.4 + 0.15,
      angle: Math.random() * Math.PI * 2,
      angleSpeed: Math.random() * 0.02 + 0.01
    });
  }

  const drawParticles = () => {
    ctx.save();
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    
    particles.forEach(p => {
      p.y += p.speedY;
      p.angle += p.angleSpeed;
      // Add subtle lateral sway simulating underwater waves
      p.x += Math.sin(p.angle) * 0.25;
      
      // Boundaries wrap-around
      if (p.y < 0) {
        p.y = h;
        p.x = Math.random() * w;
      }
      if (p.x < 0 || p.x > w) {
        p.x = Math.random() * w;
      }
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = '#8fd8d2'; // seafoam bubble color
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });
    ctx.restore();
  };

  const resizeCanvas = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    drawFrame(Math.round(currentFrame));
  };

  // Draw 16:9 cinematic widescreen image containment
  const drawFrame = (index) => {
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
    
    if (canvasRatio > imgRatio) {
      drawWidth = h * imgRatio;
      startX = (w - drawWidth) / 2;
    } else {
      drawHeight = w / imgRatio;
      startY = (h - drawHeight) / 2;
    }
    
    ctx.drawImage(img, startX, startY, drawWidth, drawHeight);
  };

  const initScrollTrigger = () => {
    ScrollTrigger.create({
      trigger: '#sea-scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        seaScrollProgress = self.progress;
        targetFrame = self.progress * (TOTAL_SEA_FRAMES - 1);
        updateAudioScrollPitch(burgerScrollProgress, coffeeScrollProgress, seaScrollProgress);
      }
    });
  };

  const renderLoop = () => {
    currentFrame += (targetFrame - currentFrame) * 0.085;
    const nextFrame = Math.round(currentFrame);
    
    drawFrame(nextFrame);
    handleScrollStoryboarding(nextFrame);
    drawParticles();
    
    requestAnimationFrame(renderLoop);
  };

  const introHeadline = document.getElementById('sea-intro-headline');
  const panelsContainer = document.getElementById('sea-panels-container');
  const panels = document.querySelectorAll('#sea-scroll-container .ingredient-panel');
  const ambientGlow = document.getElementById('ambient-glow');
  
  const telStage = document.getElementById('sea-stage');
  const telTemp = document.getElementById('sea-temp');
  const pageNum = document.getElementById('sea-page-num');

  const handleScrollStoryboarding = (frameIndex) => {
    const seaContainer = document.getElementById('sea-scroll-container');
    if (seaContainer) {
      seaContainer.style.backgroundColor = SEA_BG_COLORS[frameIndex] || '#031f36';
      
      // Dynamic contrast theme check depending on scanned background lightness
      if ((frameIndex >= 20 && frameIndex <= 36) || (frameIndex >= 74)) {
        seaContainer.classList.add('light-theme');
      } else {
        seaContainer.classList.remove('light-theme');
      }
    }

    if (frameIndex <= 9) {
      if (introHeadline) {
        introHeadline.style.display = 'flex';
        introHeadline.style.opacity = 1 - (frameIndex / 9);
        introHeadline.style.transform = `translateY(${-frameIndex * 4}px)`;
      }
      if (panelsContainer) {
        panelsContainer.style.opacity = 0;
        panelsContainer.style.transform = 'translateY(15px)';
      }
      
      activePanelIndex = -1;
      panels.forEach(p => p.style.display = 'none');
      
      if (ambientGlow) {
        ambientGlow.style.background = `radial-gradient(circle at 65% 50%, rgba(143, 216, 210, 0.12) 0%, transparent 60%)`;
      }
      
      if (telStage) telStage.textContent = "01 // OCEAN DEPTHS";
      if (telTemp) telTemp.textContent = "14°C";
      if (pageNum) pageNum.textContent = "01";
      
    } else {
      if (introHeadline) {
        introHeadline.style.display = 'none';
        introHeadline.style.opacity = 0;
      }
      if (panelsContainer) {
        panelsContainer.style.opacity = 1;
        panelsContainer.style.transform = 'translateY(0)';
      }
      
      const activeRange = SEA_RANGES.find(item => frameIndex >= item.start && frameIndex <= item.end);
      
      if (activeRange) {
        const index = activeRange.index;
        
        if (index !== activePanelIndex) {
          activePanelIndex = index;
          
          panels.forEach(p => p.style.display = 'none');
          const currentPanel = document.querySelector(`#sea-scroll-container .ingredient-panel[data-sea-index="${index}"]`);
          if (currentPanel) {
            currentPanel.style.display = 'flex';
          }
          
          if (ambientGlow) {
            ambientGlow.style.background = `radial-gradient(circle at 65% 50%, ${activeRange.glow} 0%, transparent 60%)`;
          }
          
          playChirp(600, 200, 0.04);
          
          if (telStage) telStage.textContent = `02 // ${activeRange.name}`;
          if (telTemp) telTemp.textContent = activeRange.temp;
          if (pageNum) pageNum.textContent = String(index + 1).padStart(2, '0');
        }
      } else {
        if (frameIndex >= 80) {
          if (telStage) telStage.textContent = "03 // SERVED";
          if (telTemp) telTemp.textContent = "22°C";
          if (pageNum) pageNum.textContent = "04";
        }
      }
    }
  };

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  initScrollTrigger();
  requestAnimationFrame(renderLoop);
};

// Mobile Navigation Panel Overlay Toggle
const initMobileMenu = () => {
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  const menuOverlay = document.getElementById('mobile-menu-overlay');
  
  if (toggleBtn && menuOverlay) {
    toggleBtn.addEventListener('click', () => {
      toggleBtn.classList.toggle('active');
      menuOverlay.classList.toggle('active');
    });
    
    // Close overlay on link clicks
    menuOverlay.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        toggleBtn.classList.remove('active');
        menuOverlay.classList.remove('active');
      });
    });
  }
};
