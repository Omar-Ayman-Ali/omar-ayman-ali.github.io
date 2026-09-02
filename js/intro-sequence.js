/**
 * ============================================================================
 * Cinematic Master Intro Sequence
 * Single Orchestrated GSAP Master Timeline (#site-intro-overlay)
 * 
 * Master Timeline Labels:
 * 1. "grid" — Interactive Box Grid Ripple Reveal & Magnetic Cursor Glow Trail
 * 2. "text" — SplitText Character Reveal & "Arslan" Electric Hero Flicker
 * 3. "rain" — Canvas Hacker Matrix Rain (gsap.ticker) & ScrambleText Telemetry
 * 4. "exit" — High-Ceremony Emerald Flash & Shutter Wipe Handoff to Hero
 * 
 * Skill Principles Applied:
 * - Phase 1 (Grid): Jakub Krehel (2D matrix grid stagger ripple from center with autoAlpha)
 *                   + Jhey Tompkins (magnetic tile glow trail on pointer hover)
 * - Phase 2 (Typography): ui-ux-pro-max (SplitText character reveal with expo.out curve)
 *                         + Jhey Tompkins (accent hero word keyframe flicker & neon green aura)
 * - Phase 3 (Matrix Rain): design-taste-frontend-v1 (canvas-based matrix rain on gsap.ticker)
 *                          + ui-ux-pro-max (multi-stage ScrambleText status decoding telemetry)
 * - Phase 4 (Exit Handoff): Jakub Krehel (high-ceremony flash-burst & clip-path wipe seamlessly triggering hero)
 *                           + Emil Kowalski (sessionStorage frequency discipline & clean gsap.context teardown)
 * ============================================================================
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'arslan_intro_viewed';
  const overlay = document.getElementById('site-intro-overlay');
  const gridContainer = document.getElementById('intro-grid');
  const textContainer = document.getElementById('intro-text-container');
  const rainContainer = document.getElementById('intro-hacker-rain');
  const rainCanvas = document.getElementById('intro-rain-canvas');
  const statusBar = document.getElementById('intro-status-bar');
  const statusText = document.getElementById('intro-status-text');
  const flashLayer = document.getElementById('intro-flash-layer');
  const skipBtn = document.getElementById('intro-skip-btn');

  // If overlay elements are absent, exit safely
  if (!overlay) return;

  // Check user motion preferences & prior view status
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alreadyViewed = false;
  try {
    alreadyViewed = sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch (e) {
    alreadyViewed = false;
  }

  // If already viewed this session, tear down immediately with zero delay
  if (alreadyViewed) {
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    return;
  }

  // Prevent background scrolling while intro is active
  document.body.style.overflow = 'hidden';

  // Master GSAP Timeline & Context references
  let masterTl = null;
  let introCtx = null;
  let isFinished = false;
  let rainTickerActive = false;
  let rainCtx = null;
  let rainDrops = [];
  let rainSpeeds = [];
  const rainChars = '0123456789ABCDEFλΣπO(N)0x7Fvoid*&{}[]!=<>+-/:;';
  let rainFontSize = 14;

  /**
   * Finalize and dismantle intro sequence
   */
  function finishIntro() {
    if (isFinished) return;
    isFinished = true;

    // Stop canvas animation loop immediately
    stopRainTicker();

    // Revert/kill GSAP intro context
    if (introCtx) {
      try {
        introCtx.revert();
      } catch (e) {}
    }

    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {}

    document.body.style.overflow = '';

    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }

    // Return focus to page content for accessibility
    const heroSection = document.getElementById('hero') || document.querySelector('main') || document.body;
    if (heroSection && typeof heroSection.focus === 'function') {
      heroSection.setAttribute('tabindex', '-1');
      heroSection.focus({ preventScroll: true });
      heroSection.blur();
    }

    // Trigger homepage hero entrance animation in synchrony if not already running
    if (window.PortfolioMotion && typeof window.PortfolioMotion.triggerHeroEntrance === 'function') {
      window.PortfolioMotion.triggerHeroEntrance();
    }

    // Dispatch intro completion event so canvas-graph and background workers awaken cleanly
    try {
      window.dispatchEvent(new CustomEvent('portfolio:intro-complete'));
    } catch (e) {}
  }

  /**
   * Fast-forward / Skip Intro straight to Phase 4 exit transition
   */
  function skipIntro() {
    if (isFinished) return;

    if (masterTl) {
      const currentTime = masterTl.time();
      const exitTime = masterTl.labels['exit'] || 4.3;

      if (currentTime < exitTime) {
        // Jump directly to exit beat and play forward so the transition remains seamless
        masterTl.seek('exit');
        masterTl.play();
      } else {
        finishIntro();
      }
    } else {
      finishIntro();
    }
  }

  // Wire skip triggers: Skip button, backdrop click, and ESC key
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      skipIntro();
    });
  }

  overlay.addEventListener('click', (e) => {
    // Skip on backdrop or ambient click
    if (e.target === overlay || e.target.closest('#intro-grid') || e.target.closest('#intro-hacker-rain')) {
      skipIntro();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      skipIntro();
    }
  });

  /**
   * Reduced Motion Fallback Path: Simple gentle fade with zero heavy loops
   */
  if (prefersReducedMotion) {
    gsap.set(textContainer, { autoAlpha: 1 });
    gsap.to(overlay, {
      autoAlpha: 0,
      duration: 0.6,
      delay: 1.0,
      ease: 'power2.inOut',
      onComplete: finishIntro
    });
    return;
  }

  /**
   * Build Responsive Interactive Box Grid
   */
  function buildBoxGrid() {
    if (!gridContainer) return { rows: 8, cols: 12, tiles: [] };

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw <= 768;
    const targetCellSize = isMobile ? 88 : 72;
    const cols = Math.max(isMobile ? 5 : 8, Math.round(vw / targetCellSize));
    const rows = Math.max(isMobile ? 6 : 6, Math.round(vh / targetCellSize));

    gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const totalCells = cols * rows;
    const fragment = document.createDocumentFragment();
    const tiles = [];

    for (let i = 0; i < totalCells; i++) {
      const tile = document.createElement('div');
      tile.className = 'intro-tile';
      fragment.appendChild(tile);
      tiles.push(tile);
    }

    gridContainer.innerHTML = '';
    gridContainer.appendChild(fragment);

    return { rows, cols, tiles };
  }

  /**
   * Setup Matrix Rain Canvas
   */
  function setupRainCanvas() {
    if (!rainCanvas) return;

    rainCtx = rainCanvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    rainCanvas.width = width * dpr;
    rainCanvas.height = height * dpr;
    rainCanvas.style.width = `${width}px`;
    rainCanvas.style.height = `${height}px`;

    if (rainCtx) {
      rainCtx.scale(dpr, dpr);
    }

    rainFontSize = width < 600 ? 12 : 14;
    const numCols = Math.floor(width / rainFontSize);
    rainDrops = [];
    rainSpeeds = [];

    for (let i = 0; i < numCols; i++) {
      rainDrops[i] = gsap.utils.random(-40, 0);
      rainSpeeds[i] = gsap.utils.random(0.75, 1.35);
    }
  }

  /**
   * Render Rain Canvas Tick Frame (synced to gsap.ticker)
   */
  function renderRainCanvas() {
    if (!rainCtx || !rainCanvas || !rainTickerActive) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Crucial: reset shadow blur before background sweep to keep void black
    rainCtx.shadowColor = 'transparent';
    rainCtx.shadowBlur = 0;
    rainCtx.fillStyle = 'rgba(5, 5, 5, 0.22)';
    rainCtx.fillRect(0, 0, width, height);

    rainCtx.font = `600 ${rainFontSize}px "Fira Code", monospace`;

    for (let i = 0; i < rainDrops.length; i++) {
      const char = rainChars[Math.floor(Math.random() * rainChars.length)];
      const x = i * rainFontSize;
      const y = rainDrops[i] * rainFontSize;

      if (y > 0 && y < height + 40) {
        // Leading glyph: bright white with glowing emerald shadow
        rainCtx.fillStyle = '#FFFFFF';
        rainCtx.shadowColor = '#00FF66';
        rainCtx.shadowBlur = 12;
        rainCtx.fillText(char, x, y);

        // Body glyphs: electric matrix neon green
        const trailChar = rainChars[Math.floor(Math.random() * rainChars.length)];
        const trailY = y - rainFontSize * 1.2;
        if (trailY > 0) {
          rainCtx.fillStyle = '#00FF66';
          rainCtx.shadowColor = '#00FF66';
          rainCtx.shadowBlur = 6;
          rainCtx.fillText(trailChar, x, trailY);
        }
      }

      // Reset drop to top once off-screen
      if (y > height && Math.random() > 0.975) {
        rainDrops[i] = 0;
      }

      rainDrops[i] += rainSpeeds[i];
    }
  }

  function startRainTicker() {
    if (rainTickerActive) return;
    rainTickerActive = true;
    setupRainCanvas();
    gsap.ticker.add(renderRainCanvas);
  }

  function stopRainTicker() {
    if (!rainTickerActive) return;
    rainTickerActive = false;
    gsap.ticker.remove(renderRainCanvas);
    if (rainCtx && rainCanvas) {
      rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    }
  }

  /**
   * Pointer Trail Interaction across Grid Tiles (Jhey Tompkins Lens)
   */
  function onOverlayPointerMove(e) {
    if (isFinished) return;
    const tile = e.target.closest('.intro-tile');
    if (tile && !tile.classList.contains('tile-lit')) {
      tile.classList.add('tile-lit');
      gsap.to(tile, {
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          tile.classList.remove('tile-lit');
        }
      });
    }
  }

  /**
   * Build & Orchestrate the 4-Phase Master Timeline
   */
  function initIntroMasterTimeline() {
    // Register GSAP plugins
    if (typeof gsap !== 'undefined') {
      if (typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);
      if (typeof ScrambleTextPlugin !== 'undefined') gsap.registerPlugin(ScrambleTextPlugin);
    } else {
      finishIntro();
      return;
    }

    // Accessible focus management on mount
    if (skipBtn) {
      try {
        skipBtn.focus({ preventScroll: true });
      } catch (e) {}
    }

    // Build responsive layout components
    const { rows, cols, tiles } = buildBoxGrid();

    // Attach pointermove for magnetic ripple trail
    overlay.addEventListener('pointermove', onOverlayPointerMove, { passive: true });

    // Scope all intro animations inside gsap.context for clean cleanup
    introCtx = gsap.context(() => {
      // SplitText on the two welcome lines
      let split1 = null;
      let split2 = null;
      let chars1 = [];
      let chars2 = [];

      if (typeof SplitText !== 'undefined') {
        try {
          split1 = new SplitText('.intro-line-1', { type: 'words,chars', charsClass: 'intro-char' });
          split2 = new SplitText('.intro-line-2', { type: 'words,chars', charsClass: 'intro-char' });
          chars1 = split1.chars || [];
          chars2 = split2.chars || [];
        } catch (e) {
          console.warn('[Intro] SplitText error:', e);
        }
      }

      // Initialize Master Timeline with explicit labels: "grid", "text", "rain", "exit"
      masterTl = gsap.timeline({
        id: 'introMasterTimeline',
        paused: false,
        defaults: { ease: 'power2.out' },
        onComplete: finishIntro
      });

      // ======================================================================
      // PHASE 1 — #intro-grid (label: "grid")
      // Principle: Jakub Krehel (2D matrix center ripple) + entry glow pulse
      // ======================================================================
      masterTl.addLabel('grid', 0.0);

      masterTl.fromTo(
        tiles,
        {
          scale: 0.1,
          autoAlpha: 0,
          backgroundColor: 'rgba(0, 255, 102, 0.35)',
          borderColor: 'rgba(0, 255, 102, 0.75)',
          boxShadow: '0 0 16px rgba(0, 255, 102, 0.6)'
        },
        {
          scale: 1,
          autoAlpha: 0.9,
          backgroundColor: 'rgba(12, 18, 28, 0.75)',
          borderColor: 'rgba(0, 255, 102, 0.18)',
          boxShadow: '0 0 0 rgba(0, 255, 102, 0)',
          duration: 0.6,
          ease: 'back.out(1.6)',
          stagger: {
            grid: [rows, cols],
            from: 'center',
            amount: 0.65
          }
        },
        'grid'
      );

      // ======================================================================
      // PHASE 2 — #intro-text-container (label: "text")
      // Principle: ui-ux-pro-max (SplitText expo.out) + Jhey Tompkins (hero flicker)
      // ======================================================================
      masterTl.addLabel('text', 0.9);

      // Recede grid to ambient negative space as text approaches
      masterTl.to(
        tiles,
        {
          scale: 0.94,
          autoAlpha: 0.08,
          borderColor: 'rgba(255, 255, 255, 0.03)',
          duration: 0.75,
          ease: 'power2.out'
        },
        'text'
      );

      // Make text container active
      masterTl.set(textContainer, { autoAlpha: 1 }, 'text');

      if (chars1.length > 0) {
        // Welcome line 1 character reveal
        masterTl.fromTo(
          chars1,
          {
            autoAlpha: 0,
            y: 35,
            rotationX: -45,
            filter: 'blur(6px)'
          },
          {
            autoAlpha: 1,
            y: 0,
            rotationX: 0,
            filter: 'blur(0px)',
            stagger: 0.025,
            duration: 0.55,
            ease: 'expo.out'
          },
          'text+=0.1'
        );

        // Welcome line 2 character reveal
        masterTl.fromTo(
          chars2,
          {
            autoAlpha: 0,
            y: 35,
            rotationX: -45,
            filter: 'blur(6px)'
          },
          {
            autoAlpha: 1,
            y: 0,
            rotationX: 0,
            filter: 'blur(0px)',
            stagger: 0.025,
            duration: 0.55,
            ease: 'expo.out'
          },
          'text+=0.3'
        );
      } else {
        // Fallback typography animation
        masterTl.fromTo(
          ['.intro-line-1', '.intro-line-2'],
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.18, ease: 'expo.out' },
          'text+=0.1'
        );
      }

      // Hero Beat for .intro-accent ("Arslan"): Dedicated entrance + electric neon keyframe flickers
      const accentEl = document.querySelector('.intro-accent');
      if (accentEl) {
        masterTl.fromTo(
          accentEl,
          {
            scale: 0.75,
            autoAlpha: 0,
            filter: 'brightness(2.2) drop-shadow(0 0 35px #00FF66)'
          },
          {
            scale: 1,
            autoAlpha: 1,
            filter: 'brightness(1) drop-shadow(0 0 16px rgba(0, 255, 102, 0.7))',
            duration: 0.45,
            ease: 'back.out(2.2)'
          },
          'text+=0.55'
        );

        // 3-step high-voltage electric flicker (Jhey Tompkins playful creative-coding lens)
        masterTl.to(
          accentEl,
          {
            keyframes: [
              { opacity: 0.35, duration: 0.05 },
              { opacity: 1, filter: 'brightness(2.4) drop-shadow(0 0 45px #00FF66)', duration: 0.07 },
              { opacity: 0.65, duration: 0.05 },
              { opacity: 1, filter: 'brightness(1.1) drop-shadow(0 0 20px rgba(0, 255, 102, 0.85))', duration: 0.12 }
            ],
            ease: 'none'
          },
          'text+=0.85'
        );
      }

      // ======================================================================
      // PHASE 3 — #intro-hacker-rain + #intro-status-bar (label: "rain")
      // Principle: design-taste-frontend-v1 (canvas ticker) + ui-ux-pro-max (ScrambleText telemetry)
      // ======================================================================
      masterTl.addLabel('rain', 2.5);

      // Text lifts gracefully and blurs out
      masterTl.to(
        textContainer,
        {
          autoAlpha: 0,
          y: -28,
          filter: 'blur(8px)',
          duration: 0.45,
          ease: 'power2.in'
        },
        'rain'
      );

      // Reveal Hacker Rain Canvas and initiate ticker
      masterTl.to(
        rainContainer,
        {
          autoAlpha: 0.9,
          duration: 0.35,
          onStart: startRainTicker
        },
        'rain+=0.15'
      );

      // Status Bar entrance
      masterTl.to(
        statusBar,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          ease: 'back.out(1.4)'
        },
        'rain+=0.2'
      );

      // Status indicator continuous pulse loop
      masterTl.to(
        '.intro-status-pulse',
        {
          scale: 1.35,
          boxShadow: '0 0 14px #00FF66',
          opacity: 1,
          duration: 0.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        },
        'rain+=0.2'
      );

      // Chained multi-stage ScrambleText telemetry
      if (typeof ScrambleTextPlugin !== 'undefined' && statusText) {
        masterTl.to(
          statusText,
          {
            duration: 0.65,
            scrambleText: {
              text: 'INITIALIZING CORE TELEMETRY...',
              chars: '01ABCDEF!@#$%^&*',
              speed: 0.45
            },
            ease: 'none'
          },
          'rain+=0.3'
        );

        masterTl.to(
          statusText,
          {
            duration: 0.75,
            scrambleText: {
              text: 'COMPILING ALGORITHMS & SYSTEMS...',
              chars: '01XYZ<>{}[]',
              speed: 0.45
            },
            ease: 'none'
          },
          'rain+=1.05'
        );

        masterTl.to(
          statusText,
          {
            duration: 0.65,
            scrambleText: {
              text: 'SYSTEM READY // OMAR AYMAN',
              chars: '01#*=',
              speed: 0.5
            },
            ease: 'none'
          },
          'rain+=1.9'
        );
      }

      // ======================================================================
      // PHASE 4 — Exit / Handoff (label: "exit")
      // Principle: Jakub Krehel (flash burst & shutter wipe handoff) + Emil Kowalski
      // ======================================================================
      masterTl.addLabel('exit', 4.3);

      // High-ceremony emerald glow flash across overlay
      if (flashLayer) {
        masterTl.to(
          flashLayer,
          {
            autoAlpha: 0.95,
            duration: 0.18,
            ease: 'power2.in'
          },
          'exit'
        );
      }

      // Dissolve rain, status bar, and grid during flash peak
      masterTl.to(
        [rainContainer, statusBar, gridContainer],
        {
          autoAlpha: 0,
          duration: 0.2,
          ease: 'power1.out'
        },
        'exit+=0.1'
      );

      // Shutter wipe revealing homepage hero section
      masterTl.to(
        overlay,
        {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power4.inOut',
          onStart: () => {
            stopRainTicker();
            // Trigger hero entrance at the exact start of the wipe
            if (window.PortfolioMotion && typeof window.PortfolioMotion.triggerHeroEntrance === 'function') {
              window.PortfolioMotion.triggerHeroEntrance();
            }
          },
          onComplete: finishIntro
        },
        'exit+=0.15'
      );
    }, overlay); // Scoped cleanly to #site-intro-overlay
  }

  // Handle window resize for dynamic canvas dimensions
  window.addEventListener('resize', () => {
    if (rainTickerActive) {
      setupRainCanvas();
    }
  });

  // Boot sequence when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      requestAnimationFrame(initIntroMasterTimeline);
    });
  } else {
    requestAnimationFrame(initIntroMasterTimeline);
  }

  // Expose global intro API for testing, skipping, and replaying
  window.PortfolioIntro = {
    skip: skipIntro,
    seek: (label) => {
      if (masterTl) {
        masterTl.seek(label);
      }
    },
    pause: () => {
      if (masterTl) masterTl.pause();
    },
    play: () => {
      if (masterTl) masterTl.play();
    },
    replay: () => {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      window.location.reload();
    }
  };
})();
