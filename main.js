import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

/* ==========================================================================
   STATE & CONSTANTS
   ========================================================================== */
const TOTAL_FRAMES = 240;
const images = [];
let loadedImagesCount = 0;
let isLoaded = false;
let isFirstPlay = true;

// Shared canvas rendering state animated by GSAP
const canvasState = {
  frame: 0,
  xPercent: 50,  // 50% = horizontal center
  yPercent: 50,  // 50% = vertical center
  scale: 0.8,
  alpha: 1
};

// Drag configuration for Chapter 3 3D spin
let isDragging = false;
let dragStartX = 0;
let dragStartFrame = 0;
const dragSensitivity = 0.25;
let isGalleryActive = false;

// Custom cursor positions
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let currentGlowX = mouseX;
let currentGlowY = mouseY;

/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */
const loader = document.getElementById('loader');
const loaderPct = loader.querySelector('.loader-percentage');
const canvas = document.getElementById('car-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const soundToggle = document.getElementById('sound-toggle');
const customCursor = document.getElementById('custom-cursor');
const cursorGlow = document.getElementById('cursor-glow');
const specsGrid = document.querySelector('.specs-grid');
const specCards = document.querySelectorAll('.spec-card');

/* ==========================================================================
   AUDIO ENGINE (V8 SYNTHESIZER)
   ========================================================================== */
let audioCtx = null;
let engineOsc = null;
let engineGain = null;
let rumbleOsc = null;
let rumbleGainNode = null;
let isMuted = true;
let scrollSpeedTracker = 0;
let lastScrollTime = Date.now();

function initEngineSound() {
  if (audioCtx) return;
  
  // Create Audio Context
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  // 1. Core V8 combustion generator (Sawtooth oscillator at low pitch)
  engineOsc = audioCtx.createOscillator();
  engineOsc.type = 'sawtooth';
  engineOsc.frequency.setValueAtTime(28, audioCtx.currentTime); // Deep rumble
  
  // 2. High-frequency friction and combustion spark (White noise)
  const bufferSize = audioCtx.sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const whiteNoise = audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;
  
  // Bandpass filter to model metallic valve clatter and exhaust hiss
  const clatterFilter = audioCtx.createBiquadFilter();
  clatterFilter.type = 'bandpass';
  clatterFilter.frequency.setValueAtTime(350, audioCtx.currentTime);
  clatterFilter.Q.setValueAtTime(1.5, audioCtx.currentTime);
  
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.015, audioCtx.currentTime);
  
  whiteNoise.connect(clatterFilter);
  clatterFilter.connect(noiseGain);
  
  // 3. Cylinder firing rate modulator (Sub-harmonic rumbling)
  rumbleOsc = audioCtx.createOscillator();
  rumbleOsc.type = 'sine';
  rumbleOsc.frequency.setValueAtTime(9, audioCtx.currentTime); // 9 Hz idle combustion cycle
  
  rumbleGainNode = audioCtx.createGain();
  rumbleGainNode.gain.setValueAtTime(18, audioCtx.currentTime); // Frequency depth
  
  rumbleOsc.connect(rumbleGainNode);
  rumbleGainNode.connect(engineOsc.frequency); // Modulate Sawtooth pitch directly
  
  // 4. Exhaust resonance filter (Lowpass to muffle higher order noise)
  const exhaustFilter = audioCtx.createBiquadFilter();
  exhaustFilter.type = 'lowpass';
  exhaustFilter.frequency.setValueAtTime(140, audioCtx.currentTime);
  exhaustFilter.Q.setValueAtTime(2.0, audioCtx.currentTime);
  
  engineGain = audioCtx.createGain();
  engineGain.gain.setValueAtTime(0, audioCtx.currentTime); // Muted initially
  
  engineOsc.connect(exhaustFilter);
  exhaustFilter.connect(engineGain);
  noiseGain.connect(engineGain);
  
  // Output
  engineGain.connect(audioCtx.destination);
  
  // Start engine nodes
  engineOsc.start();
  rumbleOsc.start();
  whiteNoise.start();
}

function startEngine() {
  if (isMuted) return;
  if (!audioCtx) initEngineSound();
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  const now = audioCtx.currentTime;
  
  // Rev on ignition!
  engineGain.gain.cancelScheduledValues(now);
  engineGain.gain.setValueAtTime(0, now);
  engineGain.gain.linearRampToValueAtTime(0.35, now + 0.05); // Rapid compression pop
  
  engineOsc.frequency.cancelScheduledValues(now);
  engineOsc.frequency.setValueAtTime(20, now);
  engineOsc.frequency.exponentialRampToValueAtTime(140, now + 0.22); // High-pitched rev
  
  rumbleOsc.frequency.cancelScheduledValues(now);
  rumbleOsc.frequency.setValueAtTime(8, now);
  rumbleOsc.frequency.exponentialRampToValueAtTime(32, now + 0.22); // Fast firing rate
  
  // Settle back to rumbling idle tone
  engineGain.gain.exponentialRampToValueAtTime(0.12, now + 1.2);
  engineOsc.frequency.exponentialRampToValueAtTime(26, now + 1.2);
  rumbleOsc.frequency.exponentialRampToValueAtTime(7.5, now + 1.2);
}

function updateEngineThrottle(speed) {
  if (isMuted || !audioCtx || !engineOsc) return;
  
  const now = audioCtx.currentTime;
  // Map speed to throttle [0 (idle) to 1 (full throttle)]
  const throttle = Math.min(speed * 0.05, 1);
  
  const baseFreq = 26 + (throttle * 90);
  const baseRumble = 7.5 + (throttle * 22);
  const baseGain = 0.12 + (throttle * 0.16);
  
  engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.08);
  rumbleOsc.frequency.setTargetAtTime(baseRumble, now, 0.1);
  engineGain.gain.setTargetAtTime(baseGain, now, 0.05);
}

function toggleSound() {
  isMuted = !isMuted;
  
  if (isMuted) {
    soundToggle.classList.remove('playing');
    if (engineGain && audioCtx) {
      engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.15);
    }
  } else {
    soundToggle.classList.add('playing');
    if (!audioCtx) {
      initEngineSound();
    }
    startEngine();
  }
}

// Track scrolling velocity to rev V8 engine
function handleEngineThrottleFromScroll() {
  const currentTime = Date.now();
  const timeDelta = Math.max(1, currentTime - lastScrollTime);
  lastScrollTime = currentTime;
  
  // Speed is scroll offset delta over time
  const scrollOffsetDelta = Math.abs(window.scrollY - scrollSpeedTracker);
  scrollSpeedTracker = window.scrollY;
  const speed = (scrollOffsetDelta / timeDelta) * 10;
  
  updateEngineThrottle(speed);
  
  // Smoothly decay rev back to idle
  gsap.to({ val: speed }, {
    val: 0,
    duration: 0.8,
    overwrite: "auto",
    onUpdate: function() {
      updateEngineThrottle(this.targets()[0].val);
    }
  });
}

/* ==========================================================================
   IMAGE PRELOADER
   ========================================================================== */
function preloadImages() {
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    const frameNum = String(i).padStart(3, '0');
    img.src = `/frames/ezgif-frame-${frameNum}.jpg`;
    img.onload = () => {
      loadedImagesCount++;
      const percent = Math.round((loadedImagesCount / TOTAL_FRAMES) * 100);
      loaderPct.textContent = `${percent}%`;
      
      if (loadedImagesCount === TOTAL_FRAMES) {
        onPreloaderFinished();
      }
    };
    img.onerror = () => {
      console.warn(`Failed to load frame ${frameNum}`);
      // Continue even if some frames fail to prevent hard block
      loadedImagesCount++;
      if (loadedImagesCount === TOTAL_FRAMES) {
        onPreloaderFinished();
      }
    };
    images.push(img);
  }
}

function onPreloaderFinished() {
  isLoaded = true;
  loader.classList.add('fade-out');
  
  // Initialize canvas coordinates
  resizeCanvas();
  renderCanvasFrame();
  
  // Trigger intro text animations
  triggerHeroIntro();
}

/* ==========================================================================
   CANVAS RENDERING LOGIC
   ========================================================================== */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  renderCanvasFrame();
}

function renderCanvasFrame() {
  if (!isLoaded || images.length === 0) return;
  
  // Clean canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Safely grab current frame (mod total to wrap around)
  const currentFrameIndex = Math.floor(canvasState.frame) % TOTAL_FRAMES;
  const img = images[currentFrameIndex];
  if (!img || !img.complete) return;
  
  // Draw current image with dynamic positioning and scaling
  const imgAspect = img.width / img.height;
  const canvasAspect = canvas.width / canvas.height;
  
  let drawWidth, drawHeight;
  
  // Scale behavior: fit with a cover buffer
  if (canvasAspect > imgAspect) {
    drawWidth = canvas.width * canvasState.scale;
    drawHeight = (canvas.width / imgAspect) * canvasState.scale;
  } else {
    drawHeight = canvas.height * canvasState.scale;
    drawWidth = (canvas.height * imgAspect) * canvasState.scale;
  }
  
  const x = (canvas.width * (canvasState.xPercent / 100)) - (drawWidth / 2);
  const y = (canvas.height * (canvasState.yPercent / 100)) - (drawHeight / 2);
  
  // Global opacity for canvas
  ctx.globalAlpha = canvasState.alpha;
  ctx.drawImage(img, x, y, drawWidth, drawHeight);
  ctx.globalAlpha = 1.0;
  
  // Draw dynamic metallic cursor highlights reflecting off car body
  if (isLoaded) {
    drawMetallicCursorReflections(x, y, drawWidth, drawHeight);
  }
}

// Simulated real-time spotlight paint reflection
function drawMetallicCursorReflections(carX, carY, carW, carH) {
  // Only reflect when mouse is inside car bounding box
  if (mouseX < carX || mouseX > carX + carW || mouseY < carY || mouseY > carY + carH) return;
  
  ctx.save();
  // Clip drawing strictly to car pixels using canvas globalCompositeOperation
  ctx.globalCompositeOperation = 'source-atop';
  
  // Create reflecting light gradient
  const reflectionGlow = ctx.createRadialGradient(
    mouseX, mouseY, 5, 
    mouseX, mouseY, 280
  );
  reflectionGlow.addColorStop(0, 'rgba(255, 106, 0, 0.22)');
  reflectionGlow.addColorStop(0.3, 'rgba(249, 115, 22, 0.08)');
  reflectionGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = reflectionGlow;
  ctx.fillRect(carX, carY, carW, carH);
  ctx.restore();
}

/* ==========================================================================
   DRAG-TO-ROTATE IN CHAPTER 3 (SHOWROOM)
   ========================================================================== */
function setupDragRotation() {
  const handleDragStart = (clientX) => {
    if (!isGalleryActive) return;
    isDragging = true;
    dragStartX = clientX;
    dragStartFrame = canvasState.frame;
    
    document.body.classList.add('cursor-active');
  };
  
  const handleDragMove = (clientX) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStartX;
    
    // Rotate frames based on dragging distance
    const frameOffset = Math.round(deltaX * dragSensitivity);
    let targetFrame = (dragStartFrame - frameOffset) % TOTAL_FRAMES;
    if (targetFrame < 0) {
      targetFrame += TOTAL_FRAMES;
    }
    
    // Smoothly apply frame update to the global canvas state
    canvasState.frame = targetFrame;
    renderCanvasFrame();
  };
  
  const handleDragEnd = () => {
    isDragging = false;
    document.body.classList.remove('cursor-active');
  };
  
  // Mouse events
  window.addEventListener('mousedown', (e) => handleDragStart(e.clientX));
  window.addEventListener('mousemove', (e) => handleDragMove(e.clientX));
  window.addEventListener('mouseup', handleDragEnd);
  
  // Touch events
  window.addEventListener('touchstart', (e) => {
    if (e.touches[0]) handleDragStart(e.touches[0].clientX);
  });
  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) handleDragMove(e.touches[0].clientX);
  });
  window.addEventListener('touchend', handleDragEnd);
}

/* ==========================================================================
   GSAP INTRO & SCROLL TIMELINES
   ========================================================================== */
function triggerHeroIntro() {
  const introTl = gsap.timeline({
    defaults: { ease: 'power4.out', duration: 1.5 }
  });
  
  // Fade in nav and initial text
  introTl.fromTo('.glass-nav', { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 })
         .fromTo('.hero-title:not(.accent)', { y: 60, opacity: 0 }, { y: 0, opacity: 1 }, "-=0.8")
         .fromTo('.hero-title.accent', { y: 80, opacity: 0 }, { y: 0, opacity: 1 }, "-=1.2")
         .fromTo('.hero-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, "-=1.0")
         .fromTo('#start-btn', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, ease: 'back.out(1.5)' }, "-=0.8")
         .fromTo('.scroll-indicator', { opacity: 0 }, { opacity: 0.6 }, "-=0.5");
}

function setupScrollChoreography() {
  // Master Scroll Timeline tying scroll position to canvas parameters
  const masterTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: '#smooth-content',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (self) => {
        // Render current frame whenever scrolling updates
        renderCanvasFrame();
        handleEngineThrottleFromScroll();
      }
    }
  });

  // Track Guide line reveal scroll trigger
  gsap.fromTo('#neon-track, #neon-track-glow', 
    { strokeDashoffset: 800, strokeDasharray: 800 },
    {
      strokeDashoffset: 0,
      scrollTrigger: {
        trigger: '#smooth-content',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.4
      }
    }
  );

  // --- CHAPTER TRANSITIONS IN CANVAS STATE ---
  
  // 1. Hero to Chapter 1 (First Race)
  // Car moves from center to left, shrinks, and spins to frames [0 -> 60]
  masterTimeline.to(canvasState, {
    xPercent: 72,
    scale: 0.68,
    frame: 55,
    ease: 'power1.inOut'
  }, 0); // starts at scroll progress index 0

  // 2. Chapter 1 to Chapter 2 (Dreams Accelerate)
  // Car swings to the right and spins further [55 -> 120]
  masterTimeline.to(canvasState, {
    xPercent: 28,
    scale: 0.68,
    frame: 115,
    ease: 'power1.inOut'
  }, 1);

  // 3. Chapter 2 to Chapter 3 (Collector's Gallery)
  // Car centers back, scales up for showroom focus [115 -> 180]
  masterTimeline.to(canvasState, {
    xPercent: 50,
    scale: 0.82,
    frame: 180,
    ease: 'power1.inOut'
  }, 2);

  // 4. Chapter 3 to Chapter 4 (Engineering Beauty)
  // Car shrinks slightly, slides up to reveal space for specifications
  masterTimeline.to(canvasState, {
    xPercent: 50,
    yPercent: 46,
    scale: 0.72,
    frame: 210, // Locks at frame 210 (Side angle layout perfect for specifications)
    ease: 'power2.inOut'
  }, 3);

  // 5. Chapter 4 to Chapter 5 (Legacy)
  // Car rotates slightly and fades out to reveal the real supercar element
  masterTimeline.to(canvasState, {
    scale: 0.9,
    frame: 230,
    alpha: 0,
    ease: 'power2.in'
  }, 4);

  // --- SECTION ENTRANCE ANIMATIONS (TEXT & ELEMENTS) ---

  // Chapter 1
  gsap.fromTo('#chapter-one .section-content', 
    { y: 100, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 1.2,
      scrollTrigger: {
        trigger: '#chapter-one',
        start: 'top 70%',
        end: 'top 30%',
        scrub: 1
      }
    }
  );

  // Chapter 2
  gsap.fromTo('#chapter-two .section-content', 
    { y: 100, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 1.2,
      scrollTrigger: {
        trigger: '#chapter-two',
        start: 'top 70%',
        end: 'top 30%',
        scrub: 1
      }
    }
  );

  // Chapter 3 Pinned Showroom
  // Here, we pin Chapter 3 to allow manual interaction without scrolling immediately
  ScrollTrigger.create({
    trigger: '#chapter-three',
    start: 'top top',
    end: '+=100%',
    pin: true,
    scrub: true,
    onEnter: () => {
      isGalleryActive = true;
      gsap.to('#drag-hint', { opacity: 1, y: 0, duration: 0.5 });
    },
    onLeave: () => {
      isGalleryActive = false;
      gsap.to('#drag-hint', { opacity: 0, y: 20, duration: 0.5 });
    },
    onEnterBack: () => {
      isGalleryActive = true;
      gsap.to('#drag-hint', { opacity: 1, y: 0, duration: 0.5 });
    },
    onLeaveBack: () => {
      isGalleryActive = false;
      gsap.to('#drag-hint', { opacity: 0, y: -20, duration: 0.5 });
    }
  });

  // Chapter 4 Specifications Card reveals
  specCards.forEach((card, index) => {
    const isLeft = card.classList.contains('card-left');
    gsap.fromTo(card, 
      { x: isLeft ? -80 : 80, opacity: 0 },
      {
        x: 0, opacity: 1,
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          end: 'top 55%',
          scrub: 1
        }
      }
    );
  });

  // Chapter 5: Legacy Image Reveal Slider with Swipe
  const legacyWrap = document.querySelector('.legacy-image-wrap');
  const realCarImg = document.getElementById('legacy-car-real');

  // Trigger scale entrance of the legacy frames
  ScrollTrigger.create({
    trigger: '#chapter-five',
    start: 'top 60%',
    onEnter: () => {
      legacyWrap.classList.add('scale-up');
    }
  });

  // Reveal the real car image on scroll using clip-path swipe
  gsap.fromTo(realCarImg,
    { clipPath: 'polygon(0 0, 0 0, 0 100%, 0% 100%)' },
    {
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      scrollTrigger: {
        trigger: '#chapter-five',
        start: 'top 50%',
        end: 'top 10%',
        scrub: 0.8
      }
    }
  );

  // Sync navigation active links on scroll
  const sections = document.querySelectorAll('section');
  const navItems = document.querySelectorAll('.nav-item');
  
  sections.forEach((sec, idx) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 45%',
      end: 'bottom 45%',
      onEnter: () => updateNavActive(idx),
      onEnterBack: () => updateNavActive(idx)
    });
  });

  function updateNavActive(activeIndex) {
    navItems.forEach((item, idx) => {
      if (idx === activeIndex - 1) { // Offset since index 0 is hero
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
}

/* ==========================================================================
   MICRO-ANIMATIONS & INTERACTION REFINEMENTS
   ========================================================================== */
function setupCursorSpotlight() {
  // Main mouse movement trackers
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Draw immediate custom cursor dot
    customCursor.style.left = `${mouseX}px`;
    customCursor.style.top = `${mouseY}px`;
    
    // Pass coordinates to style.css for ambient lighting spotlight tracking
    document.documentElement.style.setProperty('--cursor-x', `${mouseX}px`);
    document.documentElement.style.setProperty('--cursor-y', `${mouseY}px`);
    
    // Force redraw of reflection layers if canvas is inactive (idle)
    if (!isDragging) {
      renderCanvasFrame();
    }
  });

  // Dynamic lagging ring glow using requestAnimationFrame
  function updateCursorGlow() {
    // Lerp algorithm for buttery smooth cursor outline lag
    const dx = mouseX - currentGlowX;
    const dy = mouseY - currentGlowY;
    
    currentGlowX += dx * 0.15;
    currentGlowY += dy * 0.15;
    
    cursorGlow.style.left = `${currentGlowX}px`;
    cursorGlow.style.top = `${currentGlowY}px`;
    
    requestAnimationFrame(updateCursorGlow);
  }
  
  updateCursorGlow();
  
  // Custom cursor active effects on links & CTA buttons
  const clickables = document.querySelectorAll('a, button, .sound-toggle, .spec-card');
  clickables.forEach(elem => {
    elem.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-active');
    });
    elem.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-active');
    });
  });
}

function setupMagneticCTA() {
  const magnets = document.querySelectorAll('.magnetic');
  
  magnets.forEach(magnet => {
    magnet.addEventListener('mousemove', (e) => {
      const bound = magnet.getBoundingClientRect();
      // Distance from center of button
      const x = e.clientX - bound.left - (bound.width / 2);
      const y = e.clientY - bound.top - (bound.height / 2);
      
      // Pull button slightly towards mouse
      gsap.to(magnet, {
        x: x * 0.35,
        y: y * 0.35,
        duration: 0.3,
        ease: 'power2.out'
      });
      
      // Shift text content in opposite direction for depth offset
      const text = magnet.querySelector('.cta-btn-text');
      if (text) {
        gsap.to(text, {
          x: x * 0.1,
          y: y * 0.1,
          duration: 0.3
        });
      }
    });
    
    magnet.addEventListener('mouseleave', () => {
      // Re-center button
      gsap.to(magnet, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1.2, 0.4)'
      });
      
      const text = magnet.querySelector('.cta-btn-text');
      if (text) {
        gsap.to(text, {
          x: 0,
          y: 0,
          duration: 0.5
        });
      }
    });
  });
}

function spawnSparks() {
  // Sparks trigger only during Chapter 1 (First Race)
  const ch1 = document.getElementById('chapter-one');
  
  ch1.addEventListener('mousemove', (e) => {
    // Limit sparks spawn rate
    if (Math.random() > 0.08) return;
    
    const spark = document.createElement('div');
    spark.classList.add('spark');
    ch1.appendChild(spark);
    
    // Spark spawn coordinates at mouse pointer
    const rect = ch1.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    
    // Random velocity trajectory
    const vx = (Math.random() - 0.5) * 150;
    const vy = -Math.random() * 200;
    
    gsap.fromTo(spark,
      { scale: Math.random() * 2 + 1, opacity: 1 },
      {
        x: `+=${vx}`,
        y: `+=${vy}`,
        opacity: 0,
        duration: 0.8 + Math.random() * 0.5,
        ease: 'power2.out',
        onComplete: () => spark.remove()
      }
    );
  });
}

/* ==========================================================================
   INITIALIZATION & EVENT BINDINGS
   ========================================================================== */
function init() {
  // 1. Setup smooth scroll (Lenis)
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-style exponential easing
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
    infinite: false,
  });

  // Bind Lenis scroll ticker to GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // 2. Setup button events
  startBtn.addEventListener('click', () => {
    if (isFirstPlay) {
      isFirstPlay = false;
      // Start audio synth (unmute and play engine start rev)
      toggleSound();
    }
    
    // Scroll down to Chapter 1
    lenis.scrollTo('#chapter-one', {
      offset: 0,
      duration: 1.8,
      ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });
  });

  restartBtn.addEventListener('click', () => {
    // Scroll back to Hero
    lenis.scrollTo('#chapter-hero', {
      offset: 0,
      duration: 2.2
    });
  });

  soundToggle.addEventListener('click', toggleSound);

  // Quick navigation link click scroll triggers
  const navLinks = document.querySelectorAll('.nav-item');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      lenis.scrollTo(targetId, {
        offset: 0,
        duration: 2.0
      });
    });
  });

  // 3. Preload all static 240 frames
  preloadImages();

  // 4. Setup Micro-interactions
  setupCursorSpotlight();
  setupDragRotation();
  setupScrollChoreography();
  setupMagneticCTA();
  spawnSparks();

  // 5. Handle resizing
  window.addEventListener('resize', resizeCanvas);
}

// Kickstart everything on page load
window.addEventListener('DOMContentLoaded', init);
