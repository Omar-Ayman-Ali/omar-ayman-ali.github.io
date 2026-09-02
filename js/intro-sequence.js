/**
 * Cinematic One-Time Intro Sequence
 * 4-Phase GSAP Master Timeline
 * 
 * Phase 1: Interactive Box Grid Stagger Reveal (~0–1s)
 * Phase 2: SplitText 2-Line Typography ("Welcome," / "to Arslan's website") (~1–3s)
 * Phase 3: Hacker Code-Rain & Compiler Telemetry (~3–4.8s)
 * Phase 4: Seamless Dissolve into Site & Hero Reveal (~4.8–5.4s)
 * 
 * Technical Controls:
 * - Session Gated: Plays once per session via sessionStorage ('arslan_intro_viewed')
 * - Skippable: Click anywhere, click [SKIP // ESC], or press ESC key
 * - Accessibility: Honors prefers-reduced-motion with instant 0.3s dissolve
 * - 60fps Performance: Hardware-accelerated transforms and autoAlpha
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'arslan_intro_viewed';
  const overlay = document.getElementById('site-intro-overlay');
  const gridContainer = document.getElementById('intro-grid');
  const textContainer = document.getElementById('intro-text-container');
  const rainContainer = document.getElementById('intro-hacker-rain');
  const statusBar = document.getElementById('intro-status-bar');
  const statusText = document.getElementById('intro-status-text');
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

  // Master GSAP Timeline instance
  let masterTl = null;
  let isFinished = false;

  /**
   * Finalize and dismantle intro sequence
   */
  function finishIntro() {
    if (isFinished) return;
    isFinished = true;

    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {}

    document.body.style.overflow = '';

    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }

    // Trigger homepage hero entrance animation in synchrony
    if (window.PortfolioMotion && typeof window.PortfolioMotion.triggerHeroEntrance === 'function') {
      window.PortfolioMotion.triggerHeroEntrance();
    }
  }

  /**
   * Fast-forward / Skip Intro
   */
  function skipIntro() {
    if (isFinished) return;

    if (masterTl) {
      masterTl.pause();
      masterTl.kill();
    }

    gsap.to(overlay, {
      autoAlpha: 0,
      duration: 0.25,
      ease: 'power2.inOut',
      overwrite: true,
      onComplete: finishIntro
    });
  }

  // Wire skip triggers: Button, Overlay Click, and ESC key
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      skipIntro();
    });
  }

  overlay.addEventListener('click', (e) => {
    // Only skip if clicking overlay or backdrop, not interactive elements inside
    if (e.target === overlay || e.target.closest('#intro-grid') || e.target.closest('#intro-text-container') || e.target.closest('#intro-hacker-rain')) {
      skipIntro();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      skipIntro();
    }
  });

  // If user prefers reduced motion, bypass the multi-step animation
  if (prefersReducedMotion) {
    gsap.to(overlay, {
      autoAlpha: 0,
      duration: 0.35,
      delay: 0.1,
      ease: 'power2.out',
      onComplete: finishIntro
    });
    return;
  }

  /**
   * Generate Box Grid Tiles
   * Calculates dynamic rows & columns to ensure 100+ performant tiles
   */
  function buildBoxGrid() {
    if (!gridContainer) return { rows: 8, cols: 12 };

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Responsive cell target dimension (~65-80px desktop, ~50-60px mobile)
    const targetCellSize = vw < 600 ? 55 : 75;
    const cols = Math.max(8, Math.round(vw / targetCellSize));
    const rows = Math.max(6, Math.round(vh / targetCellSize));

    gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const totalCells = cols * rows;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < totalCells; i++) {
      const tile = document.createElement('div');
      tile.className = 'intro-tile';
      fragment.appendChild(tile);
    }

    gridContainer.innerHTML = '';
    gridContainer.appendChild(fragment);

    return { rows, cols };
  }

  /**
   * Generate Hacker Matrix Rain Monospace Columns
   */
  function buildHackerRain() {
    if (!rainContainer) return;

    const vw = window.innerWidth;
    // Number of columns: restrained count (8 to 14 columns)
    const colCount = vw < 600 ? 7 : Math.min(14, Math.floor(vw / 110));
    const charsPool = '010101XYZABCDEF!@#$%^&*<>[]{}+=-/::λO(N)0x7Fvoid*';

    rainContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (let c = 0; c < colCount; c++) {
      const col = document.createElement('div');
      col.className = 'intro-rain-col';
      col.style.left = `${((c + 0.5) / colCount) * 100}%`;

      const glyphCount = Math.floor(Math.random() * 7) + 10;
      let colHtml = '';

      for (let g = 0; g < glyphCount; g++) {
        const char = charsPool[Math.floor(Math.random() * charsPool.length)];
        const isHead = g === 0;
        const opacity = isHead ? 1 : Math.max(0.15, (1 - g / glyphCount) * 0.85);
        colHtml += `<span class="intro-glyph ${isHead ? 'intro-glyph-head' : ''}" style="opacity: ${opacity.toFixed(2)};">${char}</span>`;
      }

      col.innerHTML = colHtml;
      fragment.appendChild(col);
    }

    rainContainer.appendChild(fragment);
  }

  /**
   * Initialize and orchestrate the full GSAP Master Timeline
   */
  function startIntroTimeline() {
    // Register plugins
    if (typeof gsap !== 'undefined') {
      if (typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);
      if (typeof ScrambleTextPlugin !== 'undefined') gsap.registerPlugin(ScrambleTextPlugin);
    } else {
      finishIntro();
      return;
    }

    const { rows, cols } = buildBoxGrid();
    buildHackerRain();

    // Prepare SplitText on the two welcome lines
    let split1 = null;
    let split2 = null;
    let allChars = [];

    if (typeof SplitText !== 'undefined') {
      try {
        split1 = new SplitText('.intro-line-1', { type: 'words, chars', charsClass: 'intro-char' });
        split2 = new SplitText('.intro-line-2', { type: 'words, chars', charsClass: 'intro-char' });
        allChars = [...(split1.chars || []), ...(split2.chars || [])];
      } catch (e) {
        console.warn('[Intro] SplitText fallback:', e);
      }
    }

    masterTl = gsap.timeline({
      id: 'introMasterTimeline',
      defaults: { ease: 'power2.out' },
      onComplete: finishIntro
    });

    // -------------------------------------------------------------
    // PHASE 1: Box Grid Reveal (~0.0s – 0.9s)
    // -------------------------------------------------------------
    masterTl.addLabel('phase1', 0);

    masterTl.fromTo(
      '.intro-tile',
      {
        scale: 0.15,
        autoAlpha: 0,
        backgroundColor: 'rgba(0, 255, 102, 0.14)',
        borderColor: 'rgba(0, 255, 102, 0.35)'
      },
      {
        scale: 1,
        autoAlpha: 1,
        backgroundColor: 'rgba(10, 14, 22, 0.5)',
        borderColor: 'rgba(255, 255, 255, 0.05)',
        duration: 0.5,
        ease: 'power2.out',
        stagger: {
          grid: [rows, cols],
          from: 'center',
          amount: 0.55
        }
      },
      'phase1'
    );

    // -------------------------------------------------------------
    // PHASE 2: Text Reveal & Receding Grid (~0.9s – 3.2s)
    // -------------------------------------------------------------
    masterTl.addLabel('phase2', 0.9);

    // Recede the grid into a subtle blueprint matrix
    masterTl.to(
      '.intro-tile',
      {
        scale: 0.94,
        autoAlpha: 0.12,
        borderColor: 'rgba(255, 255, 255, 0.025)',
        duration: 0.75,
        ease: 'power2.out'
      },
      'phase2'
    );

    // Text appearance
    masterTl.set(textContainer, { autoAlpha: 1 }, 'phase2');

    if (allChars.length > 0) {
      masterTl.from(
        allChars,
        {
          autoAlpha: 0,
          y: 28,
          scale: 0.7,
          stagger: 0.032,
          duration: 0.55,
          ease: 'back.out(1.8)'
        },
        'phase2+=0.1'
      );
    } else {
      masterTl.fromTo(
        ['.intro-line-1', '.intro-line-2'],
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power3.out' },
        'phase2+=0.1'
      );
    }

    // Neon accent pulse on "Arslan"
    masterTl.fromTo(
      '.intro-accent',
      {
        textShadow: '0 0 0px rgba(0, 255, 102, 0)'
      },
      {
        textShadow: '0 0 24px rgba(0, 255, 102, 0.75), 0 0 42px rgba(0, 255, 102, 0.3)',
        duration: 0.6,
        ease: 'power2.out'
      },
      'phase2+=0.5'
    );

    // -------------------------------------------------------------
    // PHASE 3: Fade + Hacker Matrix Rain (~3.2s – 4.8s)
    // -------------------------------------------------------------
    masterTl.addLabel('phase3', 3.2);

    // Welcome text exits with subtle blur and lift
    masterTl.to(
      textContainer,
      {
        autoAlpha: 0,
        y: -26,
        scale: 0.95,
        duration: 0.42,
        ease: 'power2.in'
      },
      'phase3'
    );

    // Rain columns fall down the viewport with randomized speeds and delays
    masterTl.set(rainContainer, { autoAlpha: 1 }, 'phase3+=0.1');

    const rainCols = document.querySelectorAll('.intro-rain-col');
    if (rainCols.length > 0) {
      rainCols.forEach((col) => {
        const fallSpeed = gsap.utils.random(1.2, 1.8);
        const colDelay = gsap.utils.random(0, 0.35);

        masterTl.fromTo(
          col,
          {
            yPercent: -120,
            autoAlpha: 0
          },
          {
            yPercent: 120,
            autoAlpha: 1,
            duration: fallSpeed,
            ease: 'none'
          },
          `phase3+=${0.1 + colDelay}`
        );
      });
    }

    // Telemetry status compilation line
    if (statusBar) {
      masterTl.to(statusBar, { autoAlpha: 1, duration: 0.3 }, 'phase3+=0.2');

      if (typeof ScrambleTextPlugin !== 'undefined' && statusText) {
        masterTl.to(
          statusText,
          {
            duration: 1.25,
            scrambleText: {
              text: 'SYS_CORE // ARSLAN_RUNTIME_V2.6 [READY]',
              chars: '01ABCDEF!@#$%^&*<>[]',
              speed: 0.4
            },
            ease: 'none'
          },
          'phase3+=0.3'
        );
      }
    }

    // -------------------------------------------------------------
    // PHASE 4: Seamless Dissolve into Site (~4.8s – 5.4s)
    // -------------------------------------------------------------
    masterTl.addLabel('phase4', 4.8);

    // Fade out rain and status bar
    masterTl.to(
      [rainContainer, statusBar, gridContainer],
      {
        autoAlpha: 0,
        duration: 0.4,
        ease: 'power2.out'
      },
      'phase4'
    );

    // Clean dissolve of the full overlay
    masterTl.to(
      overlay,
      {
        autoAlpha: 0,
        duration: 0.55,
        ease: 'power2.inOut',
        onStart: () => {
          // Trigger hero entrance at the exact moment the overlay begins dissolving
          if (window.PortfolioMotion && typeof window.PortfolioMotion.triggerHeroEntrance === 'function') {
            window.PortfolioMotion.triggerHeroEntrance();
          }
        }
      },
      'phase4+=0.15'
    );
  }

  // Boot the intro once the DOM and GSAP are ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Small tick to ensure layout is measured accurately
      requestAnimationFrame(startIntroTimeline);
    });
  } else {
    requestAnimationFrame(startIntroTimeline);
  }

  // Expose controls for testing and external trigger
  window.PortfolioIntro = {
    skip: skipIntro,
    replay: () => {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      window.location.reload();
    }
  };
})();
