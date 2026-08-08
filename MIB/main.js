import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Initialize Smooth Scroll (Lenis)
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  touchMultiplier: 1.5
});

// Update ScrollTrigger on Lenis scroll
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

/* ==========================================================================
   WEB AUDIO SYNTH ENGINE (SCI-FI SOUNDS)
   ========================================================================== */

class AudioSynthEngine {
  constructor() {
    this.ctx = null;
    this.masterVolume = null;
    this.bgHumNode = null;
    this.isMuted = true;
  }
  
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.value = 0.0; // Start muted/silent
      this.masterVolume.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }
  
  playBeep(freq, duration, type = 'sine', vol = 0.15) {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(this.masterVolume);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
  
  playScannerClick() {
    this.playBeep(1200, 0.05, 'sine', 0.05);
  }
  
  playAlertChirp() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
      
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      osc.connect(gainNode);
      gainNode.connect(this.masterVolume);
      osc.start();
      osc.stop(now + 0.15);
    } catch (e) {}
  }
  
  playHydraulicUnlock() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const noise = this.ctx.createOscillator(); // Sine sweep fallback
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.6);
      
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      osc.connect(gainNode);
      gainNode.connect(this.masterVolume);
      osc.start();
      osc.stop(now + 0.6);
      
      // Secondary hiss
      const hiss = this.ctx.createOscillator();
      const hissGain = this.ctx.createGain();
      hiss.type = 'sine';
      hiss.frequency.setValueAtTime(1000, now);
      hiss.frequency.exponentialRampToValueAtTime(400, now + 0.4);
      hissGain.gain.setValueAtTime(0.05, now);
      hissGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      hiss.connect(hissGain);
      hissGain.connect(this.masterVolume);
      hiss.start();
      hiss.stop(now + 0.4);
    } catch (e) {}
  }
  
  playBackgroundHum() {
    if (this.isMuted || !this.ctx) return;
    if (this.bgHumNode) return;
    
    try {
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, now); // Low A hum
      
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.4, now); // slow filter filter sweep
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(110, now);
      filter.Q.setValueAtTime(6, now);
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(40, now);
      
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.03, now); // ambient noise level
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterVolume);
      
      lfo.start();
      osc.start();
      
      this.bgHumNode = { osc, lfo, gainNode };
    } catch (e) {}
  }
  
  stopBackgroundHum() {
    if (this.bgHumNode) {
      try {
        this.bgHumNode.osc.stop();
        this.bgHumNode.lfo.stop();
      } catch (e) {}
      this.bgHumNode = null;
    }
  }

  playFlash() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(3000, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.9);
      
      gainNode.gain.setValueAtTime(0.25, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      
      osc.connect(gainNode);
      gainNode.connect(this.masterVolume);
      osc.start();
      osc.stop(now + 0.9);
    } catch (e) {}
  }
  
  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    if (this.masterVolume) {
      this.masterVolume.gain.setValueAtTime(this.isMuted ? 0.0 : 0.3, this.ctx.currentTime);
    }
    if (!this.isMuted) {
      this.playBackgroundHum();
    } else {
      this.stopBackgroundHum();
    }
    return this.isMuted;
  }
}

const synth = new AudioSynthEngine();

// Hook navigation bar audio control
const audioBtn = document.getElementById('audio-toggle');
if (audioBtn) {
  audioBtn.addEventListener('click', () => {
    const isMuted = synth.toggleMute();
    if (isMuted) {
      audioBtn.classList.remove('playing');
    } else {
      audioBtn.classList.add('playing');
      synth.playAlertChirp();
    }
  });
}

/* ==========================================================================
   CUSTOM CURSOR & HOVER INTERACTION
   ========================================================================== */

const cursor = document.getElementById('custom-cursor');
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let cursorX = mouseX;
let cursorY = mouseY;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Smooth cursor positioning using linear interpolation (lerp)
const updateCursor = () => {
  const lerpFactor = 0.15;
  cursorX += (mouseX - cursorX) * lerpFactor;
  cursorY += (mouseY - cursorY) * lerpFactor;
  
  if (cursor) {
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
  }
  requestAnimationFrame(updateCursor);
};
updateCursor();

// Click ripples
window.addEventListener('mousedown', () => {
  document.body.classList.add('c-click');
  synth.playScannerClick();
  setTimeout(() => {
    document.body.classList.remove('c-click');
  }, 600);
});

// Handle hover tags
const attachCursorHovers = () => {
  const hoverables = document.querySelectorAll('a, button, .holo-card, .reality-scanner, .alien-card, .tech-item-card, .vehicle-card, .handle-node');
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('c-hover');
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('c-hover');
    });
  });
};
attachCursorHovers();

/* ==========================================================================
   TERMINAL BOOT PRELOADER
   ========================================================================== */

const terminalBody = document.getElementById('terminal-body');
const loaderProgress = document.getElementById('loader-progress');
const loaderPct = document.getElementById('loader-pct');
const accessBtn = document.getElementById('access-btn');
const statusText = document.getElementById('status-text');
const loader = document.getElementById('loader');

const terminalMessages = [
  "DECRYPTING ARCHIVAL CHRONICLES...",
  "BYPASSING UNITED NATIONS SECURE FILTERS...",
  "ESTABLISHING STELLAR RADAR LINK...",
  "RETRIEVING ORBITAL TELEMETRY... STABLE",
  "RETINA GEOMETRY CORRELATION: 99.8% OK",
  "DNA TELEMETRY MATCH: SPECIES (HUMAN / AGENT)",
  "SYNAPSE ENCRYPTION KEY ACTIVATED...",
  "STATUS: ACCESS GRANTED BY O5 OFFICE."
];

let msgIdx = 0;
const printTerminalLine = () => {
  if (!terminalBody || msgIdx >= terminalMessages.length) return;
  const line = document.createElement('div');
  line.className = 'terminal-line';
  line.innerHTML = `<span class="t-cyan">></span> ${terminalMessages[msgIdx]}`;
  terminalBody.appendChild(line);
  terminalBody.scrollTop = terminalBody.scrollHeight;
  msgIdx++;
  setTimeout(printTerminalLine, 400);
};

// Start printing lines
setTimeout(printTerminalLine, 300);

// preloading MIB lobby frames
const frameCount = 82;
const images = [];
let loadedCount = 0;

const currentFramePath = index => `./office_frames/office_${(index - 1).toString().padStart(3, '0')}.png`;

const updateLoadingProgress = () => {
  loadedCount++;
  const percent = Math.floor((loadedCount / frameCount) * 100);
  
  if (loaderProgress) loaderProgress.style.width = `${percent}%`;
  if (loaderPct) loaderPct.style.textContent = `${percent.toString().padStart(2, '0')}%`;
  
  if (loadedCount === frameCount) {
    onLoadComplete();
  }
};

const preloadHqFrames = () => {
  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.onload = updateLoadingProgress;
    img.onerror = updateLoadingProgress; // fallback on error so we don't freeze the boot screen
    img.src = currentFramePath(i);
    images.push(img);
  }
};

const onLoadComplete = () => {
  if (statusText) {
    statusText.textContent = "DECRYPTION COMPLETE // RETINA SYNCED";
    statusText.style.color = "var(--color-green)";
  }
  if (accessBtn) {
    accessBtn.removeAttribute('disabled');
    accessBtn.classList.add('ready');
  }
};

// Start image frames load
preloadHqFrames();

// Access button handler
if (accessBtn) {
  accessBtn.addEventListener('click', () => {
    synth.init(); // Initialize audio context
    synth.playHydraulicUnlock();
    
    // Animate boot loader screen sliding up
    gsap.to(loader, {
      y: '-100%',
      duration: 1.2,
      ease: 'power4.inOut',
      onComplete: () => {
        loader.style.display = 'none';
        synth.playBackgroundHum();
        
        // Trigger entrance animations in hero section
        triggerHeroIntro();
      }
    });
  });
}

/* ==========================================================================
   HERO DOOR OPENING & SCROLL TO HQ
   ========================================================================== */

const triggerHeroIntro = () => {
  // Animate lines of hero text sequentially
  gsap.fromTo('.hero-text-line', 
    { opacity: 0, y: 30 }, 
    { opacity: 1, y: 0, duration: 1, stagger: 0.25, ease: 'power2.out' }
  );
  gsap.fromTo('.sub-fade, .hero-cta-wrap, .scroll-prompt',
    { opacity: 0 },
    { opacity: 1, duration: 1.5, delay: 1.2 }
  );
};

const enterHqBtn = document.getElementById('enter-hq-btn');
if (enterHqBtn) {
  enterHqBtn.addEventListener('click', () => {
    synth.playHydraulicUnlock();
    
    // Animate a brief scanning ripple
    gsap.to('.fingerprint-scan-overlay', {
      top: '100%',
      duration: 0.6,
      onComplete: () => {
        // Unlock door / smooth scroll to Chapter 01
        lenis.scrollTo('#chapter-recruitment', { duration: 1.8, ease: (t) => t });
      }
    });
  });
}

/* ==========================================================================
   CHAPTER 01: 3D CARD PARALLAX TILT
   ========================================================================== */

let isCameraActive = false;

const initCardTilt = (elementId) => {
  const card = document.getElementById(elementId);
  if (!card) return;
  const container = card.parentElement;
  
  container.addEventListener('mousemove', (e) => {
    if (isCameraActive) return; // Ignore mouse coordinates if camera face-tracking is running!
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = (x / rect.width) - 0.5;
    const yc = (y / rect.height) - 0.5;
    
    const rotX = -yc * 24; // Limit to 24deg
    const rotY = xc * 24;
    
    gsap.to(card, {
      rotateX: rotX,
      rotateY: rotY,
      transformPerspective: 1000,
      ease: 'power2.out',
      duration: 0.5
    });
    
    const glare = card.querySelector('.card-glare');
    if (glare) {
      gsap.to(glare, {
        background: `radial-gradient(circle at ${x}px ${y}px, rgba(79, 216, 255, 0.15) 0%, transparent 60%)`,
        duration: 0.2
      });
    }
  });
  
  container.addEventListener('mouseleave', () => {
    if (isCameraActive) return; // Keep face tracking control active
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      ease: 'power2.out',
      duration: 0.8
    });
    
    const glare = card.querySelector('.card-glare');
    if (glare) {
      gsap.to(glare, {
        background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
        duration: 0.5
      });
    }
  });
};

initCardTilt('agent-card');

// MIB ID Card Activation & Face Tracking Web Camera
const activationOverlay = document.getElementById('card-activation-overlay');
if (activationOverlay) {
  activationOverlay.addEventListener('click', (e) => {
    e.stopPropagation();
    
    const video = document.getElementById('agent-webcam');
    const placeholder = document.getElementById('avatar-placeholder');
    const nameVal = document.getElementById('badge-agent-name');
    const statusVal = document.getElementById('badge-agent-status');
    const card = document.getElementById('agent-card');
    
    // Play holographic interface double beep
    synth.playAlertChirp();
    
    if (statusVal) {
      statusVal.textContent = "VERIFYING RETINA...";
      statusVal.style.color = "var(--color-cyan)";
    }
    
    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
      .then(stream => {
        isCameraActive = true;
        
        if (video) {
          video.srcObject = stream;
          video.style.opacity = 1;
        }
        if (placeholder) {
          placeholder.style.opacity = 0;
        }
        
        gsap.to(activationOverlay, {
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            activationOverlay.style.display = 'none';
          }
        });
        
        if (nameVal) {
          nameVal.textContent = "AUTHORIZED AGENT";
        }
        if (statusVal) {
          statusVal.textContent = "SEARCHING SYNAPSE...";
          statusVal.style.color = "var(--color-cyan)";
        }
        
        // Play scan confirmation click sound
        setTimeout(() => {
          synth.playScannerClick();
        }, 300);
        
        // Initialize circular scan tracking radar animation loop
        targetIrisX = 0;
        targetIrisY = 0;
        currentIrisX = 0;
        currentIrisY = 0;
        requestAnimationFrame(updateRadarCircularMotion);
        
        startMibFaceTracker(video);
      })
      .catch(err => {
        console.error("Camera access denied or failed", err);
        if (statusVal) {
          statusVal.textContent = "ACCESS DENIED";
          statusVal.style.color = "var(--color-orange)";
        }
      });
  });
}

let targetIrisX = 0;
let targetIrisY = 0;
let currentIrisX = 0;
let currentIrisY = 0;

const updateRadarCircularMotion = () => {
  if (!isCameraActive) return;
  
  // Calculate continuous circular scan orbital coordinate offsets
  const time = Date.now() * 0.005; // speed of circular rotation
  const orbitRadius = 15; // orbit offset size in pixels
  const orbitX = Math.cos(time) * orbitRadius;
  const orbitY = Math.sin(time) * orbitRadius;
  
  // Smoothly interpolate (lerp) current position to (target face center + circle scan offset)
  currentIrisX += (targetIrisX + orbitX - currentIrisX) * 0.1;
  currentIrisY += (targetIrisY + orbitY - currentIrisY) * 0.1;
  
  const irisElement = document.querySelector('.lens-iris');
  if (irisElement) {
    gsap.set(irisElement, {
      x: currentIrisX,
      y: currentIrisY
    });
  }
  
  requestAnimationFrame(updateRadarCircularMotion);
};

function startMibFaceTracker(videoElement) {
  if (typeof tracking === 'undefined') {
    console.warn("tracking.js library not loaded yet");
    return;
  }
  
  const tracker = new tracking.ObjectTracker('face');
  tracker.setInitialScale(4);
  tracker.setStepSize(2);
  tracker.setEdgesDensity(0.1);
  
  try {
    tracking.track('#agent-webcam', tracker);
  } catch(e) {
    console.error("tracking.js track error", e);
  }
  
  const faceBox = document.getElementById('face-scanner-box');
  const card = document.getElementById('agent-card');
  const statusVal = document.getElementById('badge-agent-status');
  
  let lostFaceTimeout = null;
  
  tracker.on('track', (event) => {
    if (event.data.length === 0) {
      if (!lostFaceTimeout) {
        lostFaceTimeout = setTimeout(() => {
          if (faceBox) faceBox.style.display = 'none';
          if (statusVal) {
            statusVal.textContent = "VERIFYING RETINA...";
            statusVal.style.color = "var(--color-cyan)";
          }
          
          // Reset targets to center
          targetIrisX = 0;
          targetIrisY = 0;
          
          gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            transformPerspective: 1000,
            ease: 'power2.out',
            duration: 0.8
          });
        }, 1200);
      }
      return;
    }
    
    if (lostFaceTimeout) {
      clearTimeout(lostFaceTimeout);
      lostFaceTimeout = null;
    }
    
    const rect = event.data[0];
    
    if (statusVal) {
      statusVal.textContent = "ACTIVE AGENT";
      statusVal.style.color = "var(--color-green)";
    }
    
    if (faceBox) {
      faceBox.style.display = 'block';
      
      const scaleX = 100 / 320;
      const scaleY = 100 / 240;
      const mirroredX = 320 - rect.x - rect.width;
      
      faceBox.style.left = `${mirroredX * scaleX}%`;
      faceBox.style.top = `${rect.y * scaleY}%`;
      faceBox.style.width = `${rect.width * scaleX}%`;
      faceBox.style.height = `${rect.height * scaleY}%`;
    }
    
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    
    const normX = (centerX / 320) - 0.5;
    const normY = (centerY / 240) - 0.5;
    
    // Tilt coordinates driven by face tracking
    const rotY = -normX * 40;
    const rotX = normY * 30;
    
    gsap.to(card, {
      rotateX: rotX,
      rotateY: rotY,
      transformPerspective: 1000,
      ease: 'power2.out',
      duration: 0.4
    });
    
    // Update dynamic radar targets (scaled up Y/X bounds slightly for circular scanning)
    targetIrisX = normX * 45;
    targetIrisY = normY * 45;
    
    // Sync reflective glare highlights
    const glare = card.querySelector('.card-glare');
    if (glare) {
      const cardRect = card.getBoundingClientRect();
      const glX = (0.5 - normX) * cardRect.width;
      const glY = (0.5 + normY) * cardRect.height;
      gsap.to(glare, {
        background: `radial-gradient(circle at ${glX}px ${glY}px, rgba(79, 216, 255, 0.22) 0%, transparent 60%)`,
        duration: 0.25
      });
    }
  });
}

// Dynamic retina scan tracking mouse coordinates
const retinaScreen = document.querySelector('.scanner-screen');
const iris = document.querySelector('.lens-iris');
if (retinaScreen && iris) {
  retinaScreen.addEventListener('mousemove', (e) => {
    if (isCameraActive) return; // Ignore mouse if camera face-tracking is active!
    const rect = retinaScreen.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const moveX = (x / rect.width - 0.5) * 20;
    const moveY = (y / rect.height - 0.5) * 20;
    
    gsap.to(iris, {
      x: moveX,
      y: moveY,
      duration: 0.3
    });
  });
  
  retinaScreen.addEventListener('mouseleave', () => {
    if (isCameraActive) return; // Keep face tracking control active
    gsap.to(iris, {
      x: 0,
      y: 0,
      duration: 0.5
    });
  });
}

/* ==========================================================================
   CHAPTER 02: REALITY SHIFT SCANNER
   ========================================================================== */

const scannerContainer = document.getElementById('reality-scanner-container');
const scannerHandle = document.getElementById('scanner-handle');
const alienView = document.getElementById('alien-view');

if (scannerContainer && scannerHandle && alienView) {
  let isDragging = false;
  
  const updateScanner = (clientX) => {
    const rect = scannerContainer.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const percent = (x / rect.width) * 100;
    
    scannerHandle.style.left = `${percent}%`;
    alienView.style.width = `${percent}%`;
  };
  
  scannerHandle.addEventListener('mousedown', () => {
    isDragging = true;
    document.body.classList.add('c-hover');
  });
  
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateScanner(e.clientX);
  });
  
  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.classList.remove('c-hover');
    }
  });
  
  // Touch support for mobile devices
  scannerHandle.addEventListener('touchstart', () => {
    isDragging = true;
  });
  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    updateScanner(e.touches[0].clientX);
  });
  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Dynamic image width syncing for perfect pixel alignment
  const syncImageWidths = () => {
    const rect = scannerContainer.getBoundingClientRect();
    const imgs = scannerContainer.querySelectorAll('.reality-img');
    imgs.forEach(img => {
      img.style.width = `${rect.width}px`;
    });
  };

  // Sync on startup, load, and window resize
  syncImageWidths();
  window.addEventListener('load', syncImageWidths);
  window.addEventListener('resize', syncImageWidths);
}

/* ==========================================================================
   CHAPTER 03: CLASS-BASED 3D TILT FOR ALIEN CARDS
   ========================================================================== */

const alienCardWraps = document.querySelectorAll('.alien-card-wrap');
alienCardWraps.forEach(wrap => {
  const card = wrap.querySelector('.alien-card');
  if (!card) return;
  
  wrap.addEventListener('mousemove', (e) => {
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = (x / rect.width) - 0.5;
    const yc = (y / rect.height) - 0.5;
    
    gsap.to(card, {
      rotateX: -yc * 20,
      rotateY: xc * 20,
      transformPerspective: 800,
      ease: 'power2.out',
      duration: 0.4
    });
  });
  
  wrap.addEventListener('mouseleave', () => {
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      ease: 'power2.out',
      duration: 0.6
    });
  });
});

/* ==========================================================================
   CHAPTER 04: MIB TECHNOLOGY SCROLL-DRIVEN 3D IMAGE ROTATION & SCAN
   ========================================================================== */

const neuralyzerCard = document.getElementById('tech-neuralyzer');
if (neuralyzerCard) {
  const container = document.getElementById('neuralyzer-img-container');
  const sweep = document.getElementById('neuralyzer-sweep');

  gsap.timeline({
    scrollTrigger: {
      trigger: '#tech-neuralyzer',
      start: 'top 85%',
      end: 'bottom 35%',
      scrub: 0.5
    }
  })
  .fromTo(container, 
    { rotateY: -35, rotateX: 10, scale: 0.9, y: 10 }, 
    { rotateY: 35, rotateX: -10, scale: 1.05, y: -10, ease: 'none' }, 
    0
  )
  .fromTo(sweep, 
    { top: '0%', opacity: 0 }, 
    { top: '100%', opacity: 0.85, ease: 'none' }, 
    0
  );
}

const cricketCard = document.getElementById('tech-cricket');
if (cricketCard) {
  const img = document.getElementById('cricket-img');
  const sweep = document.getElementById('cricket-sweep');

  gsap.timeline({
    scrollTrigger: {
      trigger: '#tech-cricket',
      start: 'top 85%',
      end: 'bottom 35%',
      scrub: 0.5
    }
  })
  .fromTo(img, 
    { rotateY: -35, rotateX: 10, scale: 0.9, y: 10 }, 
    { rotateY: 35, rotateX: -10, scale: 1.05, y: -10, ease: 'none' }, 
    0
  )
  .fromTo(sweep, 
    { top: '0%', opacity: 0 }, 
    { top: '100%', opacity: 0.85, ease: 'none' }, 
    0
  );
}

/* ==========================================================================
   CHAPTER 04: NEURALYZER FLASH ACTION
   ========================================================================== */

const flashTrigger = document.getElementById('neuralyzer-trigger');
const flashWipe = document.getElementById('neuralyzer-flash');

if (flashTrigger && flashWipe) {
  flashTrigger.addEventListener('click', () => {
    synth.playFlash();
    
    // Immediately set flash overlay opacity to 1
    gsap.set(flashWipe, { opacity: 1 });
    
    // Neuralyzer blinding light decay
    gsap.to(flashWipe, {
      opacity: 0,
      duration: 1.4,
      ease: 'power2.out'
    });
    
    // Fun Gen Z interaction: wipe page content colors momentarily
    gsap.fromTo('#smooth-content', 
      { filter: 'brightness(1.5) saturate(0) contrast(2)' },
      { filter: 'brightness(1) saturate(1) contrast(1)', duration: 2.0, ease: 'power1.out', delay: 0.1 }
    );
  });
}

/* ==========================================================================
   CHAPTER 05: COMMAND HQ VIDEO FRAME SCRUBBER
   ========================================================================== */

const hqCanvas = document.getElementById('hq-scrub-canvas');
const hqCtx = hqCanvas?.getContext('2d');

const renderFrameOnCanvas = (img) => {
  if (!img || !hqCanvas || !hqCtx) return;
  
  const wWidth = hqCanvas.width = window.innerWidth;
  const wHeight = hqCanvas.height = window.innerHeight;
  
  const iWidth = img.naturalWidth || 1280;
  const iHeight = img.naturalHeight || 720;
  
  const imgRatio = iWidth / iHeight;
  const screenRatio = wWidth / wHeight;
  
  let drawWidth = wWidth;
  let drawHeight = wHeight;
  let offsetX = 0;
  let offsetY = 0;
  
  if (imgRatio > screenRatio) {
    drawWidth = wHeight * imgRatio;
    offsetX = (wWidth - drawWidth) / 2;
  } else {
    drawHeight = wWidth / imgRatio;
    offsetY = (wHeight - drawHeight) / 2;
  }
  
  hqCtx.clearRect(0, 0, wWidth, wHeight);
  hqCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
};

// Scrubbing wrapper object
const scrubAnimation = { frame: 1 };

if (hqCanvas) {
  // Initially draw frame 1
  window.addEventListener('load', () => {
    if (images[0]) {
      renderFrameOnCanvas(images[0]);
    }
  });
  
  window.addEventListener('resize', () => {
    const idx = Math.min(frameCount, Math.max(1, Math.floor(scrubAnimation.frame)));
    if (images[idx - 1]) {
      renderFrameOnCanvas(images[idx - 1]);
    }
  });

  gsap.to(scrubAnimation, {
    frame: frameCount,
    snap: "frame",
    ease: "none",
    scrollTrigger: {
      trigger: "#chapter-headquarters",
      start: "top top",
      end: "bottom+=2500 top", // Length of pin scroll
      scrub: 0.5,
      pin: true,
      onUpdate: (self) => {
        const frameIdx = Math.min(frameCount, Math.max(1, Math.floor(scrubAnimation.frame)));
        if (images[frameIdx - 1]) {
          renderFrameOnCanvas(images[frameIdx - 1]);
        }
        
        // Active panels in Chapters based on progress
        const p = self.progress;
        const panel1 = document.querySelector('.scrub-panel.panel-1');
        const panel2 = document.querySelector('.scrub-panel.panel-2');
        const panel3 = document.querySelector('.scrub-panel.panel-3');
        
        if (p < 0.3) {
          panel1?.classList.add('active');
          panel2?.classList.remove('active');
          panel3?.classList.remove('active');
        } else if (p >= 0.3 && p < 0.65) {
          panel1?.classList.remove('active');
          panel2?.classList.add('active');
          panel3?.classList.remove('active');
        } else {
          panel1?.classList.remove('active');
          panel2?.classList.remove('active');
          panel3?.classList.add('active');
        }
      }
    }
  });
}

/* ==========================================================================
   CHAPTER 06: SECRET VEHICLES PARALLAX TILT
   ========================================================================== */

const vehicles = document.querySelectorAll('.vehicle-card');
vehicles.forEach(car => {
  car.addEventListener('mousemove', (e) => {
    const rect = car.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = (x / rect.width) - 0.5;
    const yc = (y / rect.height) - 0.5;
    
    gsap.to(car, {
      rotateX: -yc * 15,
      rotateY: xc * 15,
      transformPerspective: 800,
      ease: 'power2.out',
      duration: 0.4
    });
  });
  
  car.addEventListener('mouseleave', () => {
    gsap.to(car, {
      rotateX: 0,
      rotateY: 0,
      ease: 'power2.out',
      duration: 0.6
    });
  });
});

/* ==========================================================================
   CHAPTER 07: HIGH-PERFORMANCE 3D STARFIELD CANVAS
   ========================================================================== */

class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.speed = 0.5;
    this.baseSpeed = 0.5;
    this.targetSpeed = 0.5;
    this.maxSpeed = 35;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initStars();
  }
  
  resize() {
    if (!this.canvas) return;
    this.width = this.canvas.width = this.canvas.offsetWidth;
    this.height = this.canvas.height = this.canvas.offsetHeight;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
  }
  
  initStars() {
    this.stars = [];
    for (let i = 0; i < 500; i++) {
      this.stars.push({
        x: Math.random() * this.width - this.centerX,
        y: Math.random() * this.height - this.centerY,
        z: Math.random() * this.width,
        color: Math.random() > 0.82 ? 'rgba(79, 216, 255, 0.85)' : 'rgba(201, 205, 210, 0.75)'
      });
    }
  }
  
  update() {
    // Smooth speed interpolation
    this.speed += (this.targetSpeed - this.speed) * 0.1;
    
    this.ctx.fillStyle = 'rgba(5, 5, 5, 0.18)'; // trail effect
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      star.z -= this.speed;
      
      if (star.z <= 0) {
        star.z = this.width;
        star.x = Math.random() * this.width - this.centerX;
        star.y = Math.random() * this.height - this.centerY;
      }
      
      // Project 3D coordinate to 2D screen
      const k = 128.0 / star.z;
      const px = star.x * k + this.centerX;
      const py = star.y * k + this.centerY;
      
      if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
        const size = (1 - star.z / this.width) * 3;
        this.ctx.fillStyle = star.color;
        this.ctx.beginPath();
        this.ctx.arc(px, py, size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }
}

const galaxyCanvas = document.getElementById('galaxy-canvas');
let starfield = null;

if (galaxyCanvas) {
  starfield = new Starfield(galaxyCanvas);
  
  // Velocity trigger for galaxy speed-up on scroll
  ScrollTrigger.create({
    trigger: '#chapter-galaxy',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      if (starfield) {
        // Map ScrollTrigger velocity to starfield speed
        const velocity = Math.abs(self.getVelocity() / 90);
        starfield.targetSpeed = starfield.baseSpeed + Math.min(starfield.maxSpeed, velocity);
      }
    },
    onToggle: (self) => {
      if (starfield) {
        if (!self.isActive) {
          starfield.targetSpeed = starfield.baseSpeed;
        }
      }
    }
  });

  // Loop stars animation
  const animateStars = () => {
    if (starfield) {
      // If we aren't scrolling, decelerate stars speed back to base speed
      if (starfield.targetSpeed > starfield.baseSpeed) {
        starfield.targetSpeed -= 0.15;
        if (starfield.targetSpeed < starfield.baseSpeed) {
          starfield.targetSpeed = starfield.baseSpeed;
        }
      }
      starfield.update();
    }
    requestAnimationFrame(animateStars);
  };
  
  animateStars();
}

/* ==========================================================================
   NAVIGATION ACTIVE STATES & SMOOTH ANCHOR LINKS
   ========================================================================== */

const sections = document.querySelectorAll('.chapter-section');
sections.forEach(section => {
  const id = section.getAttribute('id');
  const cleanId = id.replace('chapter-', '');
  const navLink = document.querySelector(`.nav-item[data-target="${cleanId}"]`);
  
  if (navLink) {
    ScrollTrigger.create({
      trigger: section,
      start: "top 40%",
      end: "bottom 40%",
      onEnter: () => {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navLink.classList.add('active');
      },
      onEnterBack: () => {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navLink.classList.add('active');
      }
    });
  }
});

// Smooth anchor scrolling
const navLinks = document.querySelectorAll('.nav-item');
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href');
    if (targetId) {
      lenis.scrollTo(targetId, { duration: 1.5, ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    }
  });
});

// Restart button in footer
const restartBtn = document.getElementById('reboot-portal-btn');
if (restartBtn) {
  restartBtn.addEventListener('click', () => {
    synth.playHydraulicUnlock();
    lenis.scrollTo('#hero', { duration: 2, ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  });
}
