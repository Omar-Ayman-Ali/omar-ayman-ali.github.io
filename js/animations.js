/**
 * Motion & Smooth Scroll Architecture
 * Lenis 1.1+ Synchronized with GSAP 3.12+ ScrollTrigger
 * Dials: MOTION_INTENSITY=8
 */

(function () {
  'use strict';

  // Check user system preference for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lenisInstance = null;

  /**
   * Initialize Lenis Smooth Scrolling Engine
   */
  function initLenis() {
    if (prefersReducedMotion || typeof Lenis === 'undefined') {
      console.info('[Motion] Reduced motion active or Lenis not present. Utilizing native scroll.');
      return null;
    }

    try {
      const lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
        infinite: false
      });

      // Synchronize Lenis scroll events directly with GSAP ScrollTrigger
      if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);

        // Bind Lenis to GSAP's internal high-performance ticker
        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });

        // Eliminate lag smoothing to prevent scroll jitter during sudden frame drops
        gsap.ticker.lagSmoothing(0);
      } else {
        // Fallback standalone requestAnimationFrame loop
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }

      window.lenis = lenis;
      lenisInstance = lenis;
      console.info('[Motion] Lenis 1.1 initialized and synchronized with GSAP.');
      return lenis;
    } catch (err) {
      console.error('[Motion] Error initializing Lenis engine:', err);
      return null;
    }
  }

  /**
   * Initialize GSAP ScrollTrigger Orchestrations
   */
  function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('[Motion] GSAP or ScrollTrigger not loaded.');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    if (typeof ScrollToPlugin !== 'undefined') {
      gsap.registerPlugin(ScrollToPlugin);
    }

    // 1. Hardware-Accelerated Right-Edge Scrubber & Corner Telemetry
    const scrubberBar = document.querySelector('.edge-scrubber-bar');
    const telemetryProgressEl = document.getElementById('telemetry-progress-val');

    if (scrubberBar) {
      gsap.to(scrubberBar, {
        scaleY: 1,
        ease: 'none',
        transformOrigin: 'top center',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.2,
          onUpdate: (self) => {
            if (telemetryProgressEl) {
              const progressPercent = Math.round(self.progress * 100)
                .toString()
                .padStart(3, '0');
              telemetryProgressEl.textContent = `${progressPercent}%`;
            }
          }
        }
      });
    }

    if (prefersReducedMotion) return;

    // 2. Hero Section Entrance: Synchronized with Intro or Immediate
    let heroEntered = false;
    function triggerHeroEntrance() {
      if (heroEntered || prefersReducedMotion) return;
      heroEntered = true;

      const heroMasterTl = gsap.timeline({ delay: 0.05 });

      const heroChip = document.querySelector('.hero-chip');
      if (heroChip) {
        heroMasterTl.fromTo(
          heroChip,
          { opacity: 0, x: -20, filter: 'drop-shadow(0 0 10px rgba(0, 255, 102, 0.45))' },
          { opacity: 1, x: 0, filter: 'drop-shadow(0 0 0px rgba(0, 255, 102, 0))', duration: 0.55, ease: 'power2.out' },
          0
        );
      }

      const headlineInners = document.querySelectorAll('.headline-inner');
      if (headlineInners.length > 0) {
        headlineInners.forEach((el, i) => {
          const isGreenLine = el.closest('.highlight-green') !== null;
          const glowColor = isGreenLine ? 'rgba(0, 255, 102, 0.8)' : 'rgba(255, 255, 255, 0.65)';
          const finalShadow = isGreenLine ? '0 0 16px rgba(0, 255, 102, 0.35)' : 'none';

          heroMasterTl.fromTo(
            el,
            {
              clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)',
              y: '105%',
              opacity: 0,
              textShadow: `0 0 32px ${glowColor}, 0 0 54px ${glowColor}`
            },
            {
              clipPath: 'polygon(0 0%, 100% 0%, 100% 100%, 0% 100%)',
              y: '0%',
              opacity: 1,
              textShadow: finalShadow,
              duration: 0.85,
              ease: 'power3.out',
              onComplete: () => {
                gsap.set(el, { clearProps: 'clipPath' });
              }
            },
            0.08 + i * 0.14
          );
        });
      }

      const heroSubtext = document.querySelector('.hero-subtext');
      const heroActions = document.querySelector('.hero-actions');
      if (heroSubtext && heroActions) {
        heroMasterTl.fromTo(
          [heroSubtext, heroActions],
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
          0.32
        );
      }

      const heroTerminal = document.querySelector('.hero-terminal-window');
      const heroGlow = document.querySelector('.hero-terminal-glow');
      if (heroTerminal) {
        heroMasterTl.fromTo(
          heroTerminal,
          { opacity: 0, x: 28, scale: 0.98 },
          { opacity: 1, x: 0, scale: 1.0, duration: 0.75, ease: 'power3.out' },
          0.2
        );
      }
      if (heroGlow) {
        heroMasterTl.fromTo(
          heroGlow,
          { opacity: 0, scale: 0.85 },
          { opacity: 0.35, scale: 1.0, duration: 0.85, ease: 'power2.out' },
          0.25
        );
      }
    }

    // 2.2. Terminal Backdrop Aura synced to scroll velocity (Lenis + GSAP ScrollTrigger)
    const terminalGlow = document.querySelector('.hero-terminal-glow');
    if (terminalGlow && !prefersReducedMotion) {
      const quickGlowScale = gsap.quickTo(terminalGlow, 'scale', { duration: 0.45, ease: 'power2.out' });
      const quickGlowOpacity = gsap.quickTo(terminalGlow, 'opacity', { duration: 0.45, ease: 'power2.out' });

      ScrollTrigger.create({
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => {
          const velocity = Math.abs(self.getVelocity() || 0);
          const intensity = Math.min(velocity / 2500, 1.0);
          quickGlowScale(1.0 + intensity * 0.25);
          quickGlowOpacity(0.35 + intensity * 0.45);
        }
      });
    }

    // Check if intro is actively running this session
    let isIntroActive = false;
    try {
      isIntroActive = !sessionStorage.getItem('arslan_intro_viewed') && !prefersReducedMotion && document.getElementById('site-intro-overlay');
    } catch (e) {
      isIntroActive = false;
    }

    if (!isIntroActive) {
      triggerHeroEntrance();
    }

    // Expose on motion namespace
    if (window.PortfolioMotion) {
      window.PortfolioMotion.triggerHeroEntrance = triggerHeroEntrance;
    } else {
      window.PortfolioMotion = { triggerHeroEntrance: triggerHeroEntrance };
    }

    // 2.4. Soft Neon-Green Entry Glow Pulse Helper (One-time entry pulse, zero continuous loop)
    function triggerEntryGlowPulse(elements, stagger = 0.08) {
      if (prefersReducedMotion) return;
      gsap.to(elements, {
        boxShadow: '0 0 24px rgba(0, 255, 102, 0.38), inset 0 0 10px rgba(0, 255, 102, 0.12)',
        borderColor: 'rgba(0, 255, 102, 0.65)',
        duration: 0.42,
        stagger: stagger,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
        clearProps: 'boxShadow,borderColor'
      });
    }

    // 2.5. Academic & Systems About Section Entrance
    const aboutTerminal = document.querySelector('.about-terminal-card');
    const aboutTiles = document.querySelectorAll('.about-metric-tile');

    if (aboutTerminal) {
      gsap.fromTo(
        aboutTerminal,
        { opacity: 0, y: 28, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.about-section',
            start: 'top 80%',
            toggleActions: 'play none none none',
            onEnter: () => triggerEntryGlowPulse(aboutTerminal, 0)
          }
        }
      );
    }

    if (aboutTiles.length > 0) {
      gsap.fromTo(
        aboutTiles,
        { opacity: 0, y: 24, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.about-metrics-grid',
            start: 'top 85%',
            toggleActions: 'play none none none',
            onEnter: () => triggerEntryGlowPulse(aboutTiles, 0.1)
          }
        }
      );
    }

    // 3. Telemetry Matrix Grid Staggered Reveal
    const telemetryTiles = document.querySelectorAll('.telemetry-tile');
    if (telemetryTiles.length > 0) {
      gsap.fromTo(
        telemetryTiles,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.metrics-section',
            start: 'top 85%',
            toggleActions: 'play none none none',
            onEnter: () => triggerEntryGlowPulse(telemetryTiles, 0.08)
          }
        }
      );
    }

    // 3. Capabilities Pillars Batch Entrance with Soft Neon Pulse
    const capabilityPillars = document.querySelectorAll('.capability-pillar');
    if (capabilityPillars.length > 0) {
      gsap.set(capabilityPillars, { opacity: 0, y: 28, scale: 0.98 });
      ScrollTrigger.batch(capabilityPillars, {
        start: 'top 85%',
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.12,
            duration: 0.6,
            ease: 'power3.out',
            overwrite: 'auto'
          });
          triggerEntryGlowPulse(batch, 0.12);
        }
      });
    }

    // 4. Arsenal Memory Allocation Blocks Batch Entrance with Soft Neon Pulse
    const arsenalBlocks = document.querySelectorAll('.arsenal-memory-block');
    if (arsenalBlocks.length > 0) {
      gsap.set(arsenalBlocks, { opacity: 0, y: 26, scale: 0.98 });
      ScrollTrigger.batch(arsenalBlocks, {
        start: 'top 85%',
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.1,
            duration: 0.55,
            ease: 'power3.out',
            overwrite: 'auto'
          });
          triggerEntryGlowPulse(batch, 0.1);
        }
      });
    }

    // 4.5. Codeforces Command Center Counter Tickers
    const cfCounterEls = document.querySelectorAll('.cf-counter-val');
    cfCounterEls.forEach((el) => {
      const target = parseInt(el.getAttribute('data-target'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      if (isNaN(target)) return;

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          const currentTarget = parseInt(el.getAttribute('data-target'), 10) || target;
          const currentSuffix = el.getAttribute('data-suffix') || suffix;
          const obj = { val: 0 };
          gsap.to(obj, {
            val: currentTarget,
            duration: 1.8,
            ease: 'power3.out',
            onUpdate: () => {
              el.textContent = Math.floor(obj.val).toLocaleString() + currentSuffix;
            }
          });
        }
      });
    });

    // Global helper for live API synchronization updates
    window.animateCounter = function (el, newTarget, suffix = '', duration = 0.8) {
      if (!el) return;
      const currentVal = parseInt(el.textContent.replace(/[^\d]/g, ''), 10) || 0;
      el.setAttribute('data-target', newTarget);
      el.setAttribute('data-suffix', suffix);

      const obj = { val: currentVal };
      gsap.killTweensOf(obj);
      gsap.to(obj, {
        val: newTarget,
        duration: duration,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = Math.round(obj.val).toLocaleString() + suffix;
        }
      });
    };

    // 4.6. Codeforces SVG Rating Trajectory Path Initialization
    const chartPath = document.getElementById('cf-rating-line');
    const chartGlow = document.getElementById('cf-rating-glow');
    const chartBeam = document.getElementById('cf-rating-beam');
    const chartArea = document.getElementById('cf-rating-area');
    const chartSvg = document.getElementById('cf-rating-chart');

    if (chartPath) {
      // Ensure trajectory line is 100% complete and reaches the right side (0 to 1000) instantly on page load / refresh
      chartPath.style.strokeDasharray = 'none';
      chartPath.style.strokeDashoffset = '0';
      if (chartGlow) {
        chartGlow.style.strokeDasharray = 'none';
        chartGlow.style.strokeDashoffset = '0';
      }
      if (chartArea) gsap.set(chartArea, { opacity: 1 });
      if (chartBeam) gsap.set(chartBeam, { opacity: 1 });

      // Initialize interactive scrubber immediately so it never waits
      if (window.initCodeforcesInteractiveScrubber) {
        window.initCodeforcesInteractiveScrubber();
      }

      // Hardware-accelerated neon glow bloom on scroll into view
      ScrollTrigger.create({
        trigger: '#cf-rating-chart',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo(chartSvg,
            { filter: 'drop-shadow(0 0 2px rgba(0, 255, 102, 0.2))' },
            { filter: 'drop-shadow(0 0 12px rgba(0, 255, 102, 0.45))', duration: 1.0, ease: 'power2.out' }
          );
        }
      });
    }

    // 4.7. Interactive Codeforces Curve Scrubber (gsap.quickTo 60FPS)
    window.initCodeforcesInteractiveScrubber = function () {
      const chartPath = document.getElementById('cf-rating-line');
      const pointGroup = document.getElementById('cf-interactive-point-group');
      const scrubGuide = document.getElementById('cf-scrub-guide');
      const tooltip = document.getElementById('cf-chart-tooltip');
      const svgContainer = document.querySelector('.cf-svg-container');
      const svg = document.getElementById('cf-rating-chart');

      if (!chartPath || !pointGroup || !scrubGuide || !tooltip || !svgContainer || !svg) return;

      const tooltipTitle = document.getElementById('tooltip-contest-title');
      const tooltipRating = document.getElementById('tooltip-rating-val');
      const tooltipRank = document.getElementById('tooltip-rank-val');
      const tooltipDelta = document.getElementById('tooltip-delta-val');

      const CONTEST_MILESTONES = [
        { x: 160, y: 313, rating: 356, delta: '+356', rank: '#13738', title: 'ROUND 1096 (DIV. 3)' },
        { x: 520, y: 236, rating: 614, delta: '+258', rank: '#14754', title: 'ROUND 1107 (DIV. 3)' },
        { x: 880, y: 196, rating: 747, delta: '+133', rank: '#22615', title: 'ROUND 1114 (DIV. 3) // PEAK' }
      ];

      // Set initial positions matching peak milestone (880, 196)
      gsap.set(pointGroup, { x: 880, y: 196, transformOrigin: 'center center' });
      gsap.set(scrubGuide, { x: 880, autoAlpha: 0 });
      gsap.set(tooltip, { autoAlpha: 0 });

      // Hardware-accelerated quickTo responders for 60fps tracking
      const quickPointX = gsap.quickTo(pointGroup, 'x', { duration: 0.1, ease: 'power2.out' });
      const quickPointY = gsap.quickTo(pointGroup, 'y', { duration: 0.1, ease: 'power2.out' });
      const quickGuideX = gsap.quickTo(scrubGuide, 'x', { duration: 0.08, ease: 'power2.out' });
      const quickTooltipX = gsap.quickTo(tooltip, 'x', { duration: 0.12, ease: 'power2.out' });
      const quickTooltipY = gsap.quickTo(tooltip, 'y', { duration: 0.12, ease: 'power2.out' });

      // gsap.utils clamp for sub-pixel boundary security
      const clampTargetX = gsap.utils.clamp(0, 1000);

      // Binary search on SVG path length for sub-pixel curve point resolution
      function getPathPointAtX(path, targetX) {
        let low = 0;
        let high = path.getTotalLength();
        let bestPoint = path.getPointAtLength(0);
        for (let i = 0; i < 14; i++) {
          const mid = (low + high) / 2;
          const pt = path.getPointAtLength(mid);
          bestPoint = pt;
          if (pt.x < targetX) {
            low = mid;
          } else {
            high = mid;
          }
        }
        return bestPoint;
      }

      function handleScrub(clientX) {
        const rect = svg.getBoundingClientRect();
        if (rect.width === 0) return;

        const relX = clientX - rect.left;
        const normX = Math.max(0, Math.min(1, relX / rect.width));
        let targetX = clampTargetX(normX * 1000);

        // Magnetic snapping to milestones within 35 SVG units
        let activeMilestone = null;
        for (const m of CONTEST_MILESTONES) {
          if (Math.abs(targetX - m.x) < 35) {
            activeMilestone = m;
            targetX = m.x; // Magnetic lock
            break;
          }
        }

        const pt = getPathPointAtX(chartPath, targetX);
        quickPointX(pt.x);
        quickPointY(pt.y);
        quickGuideX(pt.x);

        // Update telemetry data
        if (activeMilestone) {
          if (tooltipTitle) tooltipTitle.textContent = activeMilestone.title;
          if (tooltipRating) tooltipRating.textContent = activeMilestone.rating;
          if (tooltipRank) tooltipRank.textContent = activeMilestone.rank;
          if (tooltipDelta) tooltipDelta.textContent = activeMilestone.delta;
        } else {
          let approxRating = 747;
          let approxTitle = 'TRAJECTORY SCRUB';
          let approxDelta = 'ACTIVE TELEMETRY';
          if (targetX < 160) {
            approxRating = Math.round(300 + (targetX - 50) / 110 * 56);
            approxTitle = 'PRE-CONTEST ONBOARDING';
            approxDelta = 'INITIAL RATING';
          } else if (targetX < 520) {
            const t = (targetX - 160) / (520 - 160);
            approxRating = Math.round(356 + t * (614 - 356));
            approxTitle = 'PROGRESSION // R1096 → R1107';
            approxDelta = `+${Math.round(t * 258)} PTS`;
          } else if (targetX < 880) {
            const t = (targetX - 520) / (880 - 520);
            approxRating = Math.round(614 + t * (747 - 614));
            approxTitle = 'PROGRESSION // R1107 → R1114';
            approxDelta = `+${Math.round(t * 133)} PTS`;
          } else {
            approxRating = 747;
            approxTitle = 'CURRENT PEAK HOLD // ACTIVE';
            approxDelta = '747 ALL-TIME HIGH';
          }
          if (tooltipTitle) tooltipTitle.textContent = approxTitle;
          if (tooltipRating) tooltipRating.textContent = approxRating;
          if (tooltipRank) tooltipRank.textContent = 'INTERPOLATED';
          if (tooltipDelta) tooltipDelta.textContent = approxDelta;
        }

        // Float tooltip adjacent to cursor
        const containerRect = svgContainer.getBoundingClientRect();
        const pixelX = (pt.x / 1000) * containerRect.width;
        const pixelY = (pt.y / 420) * containerRect.height;

        let tooltipTargetX = pixelX + 16;
        if (tooltipTargetX + 220 > containerRect.width) {
          tooltipTargetX = pixelX - 220;
        }
        let tooltipTargetY = Math.max(10, Math.min(containerRect.height - 85, pixelY - 45));

        quickTooltipX(tooltipTargetX);
        quickTooltipY(tooltipTargetY);
      }

      let isHovering = false;

      svgContainer.addEventListener('pointerenter', (e) => {
        isHovering = true;
        gsap.to(scrubGuide, { autoAlpha: 0.85, duration: 0.2 });
        gsap.to(tooltip, { autoAlpha: 1, duration: 0.2 });
        handleScrub(e.clientX);
      });

      svgContainer.addEventListener('pointermove', (e) => {
        if (!isHovering) {
          isHovering = true;
          gsap.to(scrubGuide, { autoAlpha: 0.85, duration: 0.2 });
          gsap.to(tooltip, { autoAlpha: 1, duration: 0.2 });
        }
        handleScrub(e.clientX);
      });

      svgContainer.addEventListener('pointerleave', () => {
        isHovering = false;
        // Kinetic spring return to peak coordinate
        gsap.to(pointGroup, {
          x: 880,
          y: 196,
          duration: 0.6,
          ease: 'power3.out'
        });
        gsap.to(scrubGuide, {
          x: 880,
          autoAlpha: 0,
          duration: 0.45,
          ease: 'power3.out'
        });
        gsap.to(tooltip, {
          autoAlpha: 0,
          duration: 0.25,
          ease: 'power2.out'
        });
      });
    };

    // Initialize interactive scrubber immediately
    window.initCodeforcesInteractiveScrubber();

    // 4.8. Codeforces Annual Activity Heatmap & Consistency Matrix
    function initCodeforcesActivityHeatmap() {
      const svg = document.getElementById('cf-activity-heatmap');
      const tooltip = document.getElementById('cf-heatmap-tooltip');
      const tooltipCount = document.getElementById('heatmap-tooltip-count');
      const tooltipDate = document.getElementById('heatmap-tooltip-date');
      const yearSelect = document.getElementById('cf-year-select');
      const streakTag = document.querySelector('.cf-active-streak-tag');

      if (!svg) return;

      // Dataset 1: Rolling Last 12 Months (Sep 2025 -> Aug 2026) - 65 active days
      const activeRolling = {
        '8-1': { lvl: 1, count: 2, date: 'Nov 4, 2025' },
        '8-2': { lvl: 3, count: 7, date: 'Nov 5, 2025' },
        '8-3': { lvl: 2, count: 4, date: 'Nov 6, 2025' },
        '8-4': { lvl: 2, count: 5, date: 'Nov 7, 2025' },
        '8-5': { lvl: 3, count: 8, date: 'Nov 8, 2025' },
        '8-6': { lvl: 1, count: 2, date: 'Nov 9, 2025' },
        '9-0': { lvl: 3, count: 9, date: 'Nov 10, 2025' },
        '9-1': { lvl: 2, count: 4, date: 'Nov 11, 2025' },
        '9-4': { lvl: 3, count: 8, date: 'Nov 14, 2025' },
        '10-1': { lvl: 2, count: 5, date: 'Nov 18, 2025' },
        '10-2': { lvl: 1, count: 2, date: 'Nov 19, 2025' },
        '10-6': { lvl: 2, count: 4, date: 'Nov 23, 2025' },
        '11-0': { lvl: 2, count: 5, date: 'Nov 24, 2025' },
        '11-1': { lvl: 1, count: 3, date: 'Nov 25, 2025' },
        '11-5': { lvl: 1, count: 2, date: 'Nov 29, 2025' },
        '11-6': { lvl: 1, count: 2, date: 'Nov 30, 2025' },
        '12-0': { lvl: 2, count: 6, date: 'Dec 1, 2025' },
        '12-1': { lvl: 3, count: 10, date: 'Dec 2, 2025' },
        '12-2': { lvl: 2, count: 4, date: 'Dec 3, 2025' },
        '12-4': { lvl: 1, count: 2, date: 'Dec 5, 2025' },
        '12-5': { lvl: 3, count: 8, date: 'Dec 6, 2025' },
        '12-6': { lvl: 2, count: 5, date: 'Dec 7, 2025' },
        '13-0': { lvl: 3, count: 9, date: 'Dec 8, 2025' },
        '13-5': { lvl: 3, count: 7, date: 'Dec 13, 2025' },
        '14-5': { lvl: 3, count: 8, date: 'Dec 20, 2025' },
        '17-4': { lvl: 2, count: 4, date: 'Jan 9, 2026' },
        '17-5': { lvl: 3, count: 8, date: 'Jan 10, 2026' },
        '17-6': { lvl: 3, count: 9, date: 'Jan 11, 2026' },
        '18-1': { lvl: 3, count: 7, date: 'Jan 13, 2026' },
        '18-2': { lvl: 3, count: 9, date: 'Jan 14, 2026' },
        '19-4': { lvl: 2, count: 4, date: 'Jan 23, 2026' },
        '19-5': { lvl: 2, count: 5, date: 'Jan 24, 2026' },
        '21-6': { lvl: 1, count: 2, date: 'Feb 8, 2026' },
        '22-1': { lvl: 2, count: 5, date: 'Feb 10, 2026' },
        '22-3': { lvl: 3, count: 8, date: 'Feb 12, 2026' },
        '22-4': { lvl: 2, count: 4, date: 'Feb 13, 2026' },
        '22-5': { lvl: 2, count: 5, date: 'Feb 14, 2026' },
        '30-0': { lvl: 2, count: 6, date: 'Apr 6, 2026' },
        '30-2': { lvl: 3, count: 10, date: 'Apr 8, 2026' },
        '31-2': { lvl: 2, count: 5, date: 'Apr 15, 2026' },
        '31-4': { lvl: 2, count: 4, date: 'Apr 17, 2026' },
        '31-5': { lvl: 2, count: 6, date: 'Apr 18, 2026' },
        '32-4': { lvl: 2, count: 4, date: 'Apr 24, 2026' },
        '34-1': { lvl: 1, count: 2, date: 'May 5, 2026' },
        '34-2': { lvl: 1, count: 2, date: 'May 6, 2026' },
        '42-4': { lvl: 2, count: 5, date: 'Jul 3, 2026' },
        '42-5': { lvl: 3, count: 7, date: 'Jul 4, 2026' },
        '43-2': { lvl: 2, count: 4, date: 'Jul 8, 2026' },
        '44-3': { lvl: 2, count: 5, date: 'Jul 16, 2026' },
        '46-4': { lvl: 2, count: 4, date: 'Jul 31, 2026' },
        '46-5': { lvl: 2, count: 5, date: 'Aug 1, 2026' },
        '48-2': { lvl: 3, count: 8, date: 'Aug 12, 2026' },
        '48-4': { lvl: 3, count: 11, date: 'Aug 14, 2026' },
        '48-5': { lvl: 3, count: 9, date: 'Aug 15, 2026' },
        '48-6': { lvl: 2, count: 6, date: 'Aug 16, 2026' },
        '49-1': { lvl: 3, count: 12, date: 'Aug 18, 2026' },
        '50-3': { lvl: 3, count: 9, date: 'Aug 20, 2026' },
        '50-5': { lvl: 3, count: 11, date: 'Aug 22, 2026' },
        '50-6': { lvl: 2, count: 5, date: 'Aug 23, 2026' },
        '51-3': { lvl: 3, count: 10, date: 'Aug 27, 2026' },
        '51-5': { lvl: 3, count: 12, date: 'Aug 29, 2026' },
        '51-6': { lvl: 3, count: 14, date: 'Aug 30, 2026' },
        '52-0': { lvl: 2, count: 6, date: 'Aug 31, 2026' },
        '52-1': { lvl: 3, count: 15, date: 'Sep 1, 2026' },
        '52-2': { lvl: 3, count: 11, date: 'Sep 2, 2026' }
      };

      // Dataset 2: 2026 Calendar Year (Jan 2026 -> Dec 2026) - 40 active days
      const active2026 = {
        '1-4': { lvl: 2, count: 4, date: 'Jan 9, 2026' },
        '1-5': { lvl: 3, count: 8, date: 'Jan 10, 2026' },
        '1-6': { lvl: 3, count: 9, date: 'Jan 11, 2026' },
        '2-1': { lvl: 3, count: 7, date: 'Jan 13, 2026' },
        '2-2': { lvl: 3, count: 9, date: 'Jan 14, 2026' },
        '3-4': { lvl: 2, count: 4, date: 'Jan 23, 2026' },
        '3-5': { lvl: 2, count: 5, date: 'Jan 24, 2026' },
        '5-6': { lvl: 1, count: 2, date: 'Feb 8, 2026' },
        '6-1': { lvl: 2, count: 5, date: 'Feb 10, 2026' },
        '6-3': { lvl: 3, count: 8, date: 'Feb 12, 2026' },
        '6-4': { lvl: 2, count: 4, date: 'Feb 13, 2026' },
        '6-5': { lvl: 2, count: 5, date: 'Feb 14, 2026' },
        '14-0': { lvl: 2, count: 6, date: 'Apr 6, 2026' },
        '14-2': { lvl: 3, count: 10, date: 'Apr 8, 2026' },
        '15-2': { lvl: 2, count: 5, date: 'Apr 15, 2026' },
        '15-4': { lvl: 2, count: 4, date: 'Apr 17, 2026' },
        '15-5': { lvl: 2, count: 6, date: 'Apr 18, 2026' },
        '16-4': { lvl: 2, count: 4, date: 'Apr 24, 2026' },
        '18-1': { lvl: 1, count: 2, date: 'May 5, 2026' },
        '18-2': { lvl: 1, count: 2, date: 'May 6, 2026' },
        '26-4': { lvl: 2, count: 5, date: 'Jul 3, 2026' },
        '26-5': { lvl: 3, count: 7, date: 'Jul 4, 2026' },
        '27-2': { lvl: 2, count: 4, date: 'Jul 8, 2026' },
        '28-3': { lvl: 2, count: 5, date: 'Jul 16, 2026' },
        '30-4': { lvl: 2, count: 4, date: 'Jul 31, 2026' },
        '30-5': { lvl: 2, count: 5, date: 'Aug 1, 2026' },
        '32-2': { lvl: 3, count: 8, date: 'Aug 12, 2026' },
        '32-4': { lvl: 3, count: 11, date: 'Aug 14, 2026' },
        '32-5': { lvl: 3, count: 9, date: 'Aug 15, 2026' },
        '32-6': { lvl: 2, count: 6, date: 'Aug 16, 2026' },
        '33-1': { lvl: 3, count: 12, date: 'Aug 18, 2026' },
        '34-3': { lvl: 3, count: 9, date: 'Aug 20, 2026' },
        '34-5': { lvl: 3, count: 11, date: 'Aug 22, 2026' },
        '34-6': { lvl: 2, count: 5, date: 'Aug 23, 2026' },
        '35-3': { lvl: 3, count: 10, date: 'Aug 27, 2026' },
        '35-5': { lvl: 3, count: 12, date: 'Aug 29, 2026' },
        '35-6': { lvl: 3, count: 14, date: 'Aug 30, 2026' },
        '36-0': { lvl: 2, count: 6, date: 'Aug 31, 2026' },
        '36-1': { lvl: 3, count: 15, date: 'Sep 1, 2026' },
        '36-2': { lvl: 3, count: 11, date: 'Sep 2, 2026' }
      };

      // Dataset 3: 2025 Calendar Year (Joined Codeforces Oct 15, 2025) - 25 active days (Nov/Dec)
      const active2025 = {
        '44-1': { lvl: 1, count: 2, date: 'Nov 4, 2025' },
        '44-2': { lvl: 3, count: 7, date: 'Nov 5, 2025' },
        '44-3': { lvl: 2, count: 4, date: 'Nov 6, 2025' },
        '44-4': { lvl: 2, count: 5, date: 'Nov 7, 2025' },
        '44-5': { lvl: 3, count: 8, date: 'Nov 8, 2025' },
        '44-6': { lvl: 1, count: 2, date: 'Nov 9, 2025' },
        '45-0': { lvl: 3, count: 9, date: 'Nov 10, 2025' },
        '45-1': { lvl: 2, count: 4, date: 'Nov 11, 2025' },
        '45-4': { lvl: 3, count: 8, date: 'Nov 14, 2025' },
        '46-1': { lvl: 2, count: 5, date: 'Nov 18, 2025' },
        '46-2': { lvl: 1, count: 2, date: 'Nov 19, 2025' },
        '46-6': { lvl: 2, count: 4, date: 'Nov 23, 2025' },
        '47-0': { lvl: 2, count: 5, date: 'Nov 24, 2025' },
        '47-1': { lvl: 1, count: 3, date: 'Nov 25, 2025' },
        '47-5': { lvl: 1, count: 2, date: 'Nov 29, 2025' },
        '47-6': { lvl: 1, count: 2, date: 'Nov 30, 2025' },
        '48-0': { lvl: 2, count: 6, date: 'Dec 1, 2025' },
        '48-1': { lvl: 3, count: 10, date: 'Dec 2, 2025' },
        '48-2': { lvl: 2, count: 4, date: 'Dec 3, 2025' },
        '48-4': { lvl: 1, count: 2, date: 'Dec 5, 2025' },
        '48-5': { lvl: 3, count: 8, date: 'Dec 6, 2025' },
        '48-6': { lvl: 2, count: 5, date: 'Dec 7, 2025' },
        '49-0': { lvl: 3, count: 9, date: 'Dec 8, 2025' },
        '49-5': { lvl: 3, count: 7, date: 'Dec 13, 2025' },
        '50-5': { lvl: 3, count: 8, date: 'Dec 20, 2025' }
      };

      const yearConfigs = {
        rolling: {
          months: [
            { col: 1, name: 'Sep' }, { col: 5, name: 'Oct' }, { col: 9, name: 'Nov' },
            { col: 14, name: 'Dec' }, { col: 18, name: 'Jan' }, { col: 22, name: 'Feb' },
            { col: 26, name: 'Mar' }, { col: 30, name: 'Apr' }, { col: 34, name: 'May' },
            { col: 38, name: 'Jun' }, { col: 42, name: 'Jul' }, { col: 47, name: 'Aug' }
          ],
          active: activeRolling,
          counters: { alltime: 219, year: 219, month: 103, streakMax: 11, streakYear: 11, streakMonth: 5 },
          streakHtml: '<span class="streak-dot"></span><span class="streak-text">ACTIVE STREAK: <strong>5 DAYS</strong> // MAX: <strong>11 DAYS</strong></span>'
        },
        '2026': {
          months: [
            { col: 1, name: 'Jan' }, { col: 5, name: 'Feb' }, { col: 9, name: 'Mar' },
            { col: 14, name: 'Apr' }, { col: 18, name: 'May' }, { col: 22, name: 'Jun' },
            { col: 26, name: 'Jul' }, { col: 31, name: 'Aug' }, { col: 35, name: 'Sep' },
            { col: 40, name: 'Oct' }, { col: 44, name: 'Nov' }, { col: 48, name: 'Dec' }
          ],
          active: active2026,
          counters: { alltime: 219, year: 219, month: 103, streakMax: 11, streakYear: 11, streakMonth: 5 },
          streakHtml: '<span class="streak-dot"></span><span class="streak-text">2026 ACTIVE STREAK: <strong>5 DAYS</strong> // 2026 SOLVED: <strong>219 PROBLEMS</strong></span>'
        },
        '2025': {
          months: [
            { col: 1, name: 'Jan' }, { col: 5, name: 'Feb' }, { col: 9, name: 'Mar' },
            { col: 14, name: 'Apr' }, { col: 18, name: 'May' }, { col: 22, name: 'Jun' },
            { col: 26, name: 'Jul' }, { col: 31, name: 'Aug' }, { col: 35, name: 'Sep' },
            { col: 40, name: 'Oct' }, { col: 44, name: 'Nov' }, { col: 48, name: 'Dec' }
          ],
          active: active2025,
          counters: { alltime: 219, year: 116, month: 0, streakMax: 11, streakYear: 11, streakMonth: 0 },
          streakHtml: '<span class="streak-dot"></span><span class="streak-text">JOINED CODEFORCES: <strong>OCT 15, 2025</strong> // 2025 RECORD STREAK: <strong>11 DAYS</strong></span>'
        }
      };

      let currentYearKey = 'rolling';

      function renderHeatmap(yearKey, animate = false) {
        const config = yearConfigs[yearKey] || yearConfigs.rolling;
        let svgContent = '';

        // Render month labels
        config.months.forEach(m => {
          const x = 36 + m.col * 15.5;
          svgContent += `<text x="${x}" y="14" class="cf-month-label">${m.name}</text>`;
        });

        // Render weekday labels (Mon, Wed, Fri)
        svgContent += `
          <text x="26" y="41" class="cf-weekday-label" text-anchor="end">Mon</text>
          <text x="26" y="72" class="cf-weekday-label" text-anchor="end">Wed</text>
          <text x="26" y="103" class="cf-weekday-label" text-anchor="end">Fri</text>
        `;

        // Render 53 columns x 7 rows
        for (let col = 0; col < 53; col++) {
          for (let row = 0; row < 7; row++) {
            const key = `${col}-${row}`;
            const active = config.active[key];
            const lvl = active ? active.lvl : 0;
            const count = active ? active.count : 0;
            const dt = active ? active.date : `Week ${col + 1}`;
            const x = 36 + col * 15.5;
            const y = 22 + row * 15.5;

            svgContent += `<rect class="cf-heatmap-cell cf-cell-lvl-${lvl}" x="${x}" y="${y}" width="12" height="12" rx="2" data-key="${key}" data-lvl="${lvl}" data-count="${count}" data-date="${dt}"></rect>`;
          }
        }

        svg.innerHTML = svgContent;

        // Update streak tag
        if (streakTag && config.streakHtml) {
          streakTag.innerHTML = config.streakHtml;
        }

        // Animate metrics
        if (window.animateCounter) {
          const c = config.counters;
          const map = [
            { id: 'cf-heatmap-solved-alltime', val: c.alltime },
            { id: 'cf-heatmap-solved-year', val: c.year },
            { id: 'cf-heatmap-solved-month', val: c.month },
            { id: 'cf-heatmap-streak-max', val: c.streakMax },
            { id: 'cf-heatmap-streak-year', val: c.streakYear },
            { id: 'cf-heatmap-streak-month', val: c.streakMonth }
          ];
          map.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) window.animateCounter(el, item.val, '');
          });
        }

        if (animate) {
          gsap.fromTo(svg.querySelectorAll('.cf-cell-lvl-1, .cf-cell-lvl-2, .cf-cell-lvl-3'),
            { scale: 0.3, opacity: 0 },
            { scale: 1, opacity: 1, stagger: 0.015, duration: 0.35, ease: 'back.out(2)' }
          );
        }
      }

      // Initial render
      renderHeatmap('rolling', false);

      // Tooltip Hover Interactions
      const innerContainer = document.querySelector('.cf-heatmap-inner');
      svg.addEventListener('mousemove', (e) => {
        const cell = e.target.closest('.cf-heatmap-cell');
        if (cell && tooltip && innerContainer) {
          const count = parseInt(cell.getAttribute('data-count'), 10) || 0;
          const date = cell.getAttribute('data-date') || '';
          
          if (tooltipCount) {
            tooltipCount.textContent = count > 0 ? `${count} problems solved` : 'No activity';
          }
          if (tooltipDate) {
            tooltipDate.textContent = date;
          }

          const containerRect = innerContainer.getBoundingClientRect();
          const cellRect = cell.getBoundingClientRect();
          const posX = cellRect.left - containerRect.left + cellRect.width / 2;
          const posY = cellRect.top - containerRect.top;

          tooltip.style.left = `${posX}px`;
          tooltip.style.top = `${posY}px`;
          tooltip.classList.add('active');
        } else if (tooltip) {
          tooltip.classList.remove('active');
        }
      });

      svg.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.classList.remove('active');
      });

      // Functional Year Selector Switcher
      if (yearSelect) {
        yearSelect.addEventListener('change', (e) => {
          const selected = e.target.value;
          currentYearKey = selected;
          renderHeatmap(selected, true);
        });
      }

      // ScrollTrigger for entrance counter roll-up
      const consistencyGrid = document.querySelector('.cf-consistency-grid');
      if (consistencyGrid) {
        ScrollTrigger.create({
          trigger: consistencyGrid,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            renderHeatmap(currentYearKey, true);
          }
        });
      }
    }

    // Initialize Codeforces Annual Activity Heatmap & Consistency Matrix
    initCodeforcesActivityHeatmap();

    // 4.9. Codeforces Problem Taxonomy // Interactive Glowing Donut Chart
    function initCodeforcesTagsChart() {
      const slicesGroup = document.getElementById('cf-donut-slices-group');
      const legendContainer = document.getElementById('cf-tags-legend');
      const donutSvg = document.getElementById('cf-donut-chart');
      const hudTagName = document.getElementById('cf-donut-tag-name');
      const hudTagCount = document.getElementById('cf-donut-tag-count');
      const hudTagMeta = document.getElementById('cf-donut-tag-meta');
      const centerHud = document.getElementById('cf-donut-center-hud');

      if (!slicesGroup || !legendContainer) return;

      const TAG_PALETTE = {
        'implementation': { color: '#FF705A', glow: 'rgba(255, 112, 90, 0.85)' },
        'math': { color: '#FF5D8F', glow: 'rgba(255, 93, 143, 0.85)' },
        'greedy': { color: '#D946EF', glow: 'rgba(217, 70, 239, 0.85)' },
        'brute force': { color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.85)' },
        'strings': { color: '#6366F1', glow: 'rgba(99, 102, 241, 0.85)' },
        'sortings': { color: '#38BDF8', glow: 'rgba(56, 189, 248, 0.85)' },
        'number theory': { color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.85)' },
        '*special': { color: '#2DD4BF', glow: 'rgba(45, 212, 191, 0.85)' },
        'constructive algorithms': { color: '#10B981', glow: 'rgba(16, 185, 129, 0.85)' },
        'games': { color: '#84CC16', glow: 'rgba(132, 204, 22, 0.85)' },
        'data structures': { color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.85)' },
        'dp': { color: '#EC4899', glow: 'rgba(236, 72, 153, 0.85)' },
        'dfs and similar': { color: '#14B8A6', glow: 'rgba(20, 184, 166, 0.85)' },
        'graphs': { color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.85)' }
      };
      const FALLBACK_COLORS = ['#FF705A', '#FF5D8F', '#D946EF', '#8B5CF6', '#6366F1', '#38BDF8', '#06B6D4', '#2DD4BF', '#10B981', '#84CC16'];

      let tagsData = [
        { name: 'implementation', count: 10, color: '#FF705A', glow: 'rgba(255, 112, 90, 0.85)' },
        { name: 'math', count: 7, color: '#FF5D8F', glow: 'rgba(255, 93, 143, 0.85)' },
        { name: 'greedy', count: 6, color: '#D946EF', glow: 'rgba(217, 70, 239, 0.85)' },
        { name: 'brute force', count: 5, color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.85)' },
        { name: 'strings', count: 5, color: '#6366F1', glow: 'rgba(99, 102, 241, 0.85)' },
        { name: 'sortings', count: 2, color: '#38BDF8', glow: 'rgba(56, 189, 248, 0.85)' },
        { name: 'number theory', count: 2, color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.85)' },
        { name: '*special', count: 1, color: '#2DD4BF', glow: 'rgba(45, 212, 191, 0.85)' },
        { name: 'constructive algorithms', count: 1, color: '#10B981', glow: 'rgba(16, 185, 129, 0.85)' },
        { name: 'games', count: 1, color: '#84CC16', glow: 'rgba(132, 204, 22, 0.85)' }
      ];

      // Verified Codeforces Solved Problems by Tag for Itz_Arslan
      const TAG_PROBLEMS_MAP = window.CF_TAG_PROBLEMS_MAP || {
        'implementation': [
          { id: '2254A', name: 'Riptide', rating: 800, url: 'https://codeforces.com/problemset/problem/2254/A' },
          { id: '1900A', name: 'Cover in Water', rating: 800, url: 'https://codeforces.com/problemset/problem/1900/A' },
          { id: '110A', name: 'Nearly Lucky Number', rating: 800, url: 'https://codeforces.com/problemset/problem/110/A' },
          { id: '2227A', name: 'Koshary', rating: 800, url: 'https://codeforces.com/problemset/problem/2227/A' },
          { id: '118A', name: 'String Task', rating: 1000, url: 'https://codeforces.com/problemset/problem/118/A' },
          { id: '236A', name: 'Boy or Girl', rating: 800, url: 'https://codeforces.com/problemset/problem/236/A' },
          { id: '112A', name: 'Petya and Strings', rating: 800, url: 'https://codeforces.com/problemset/problem/112/A' },
          { id: '263A', name: 'Beautiful Matrix', rating: 800, url: 'https://codeforces.com/problemset/problem/263/A' },
          { id: '158A', name: 'Next Round', rating: 800, url: 'https://codeforces.com/problemset/problem/158/A' },
          { id: '282A', name: 'Bit++', rating: 800, url: 'https://codeforces.com/problemset/problem/282/A' }
        ],
        'math': [
          { id: '1899A', name: 'Game with Integers', rating: 800, url: 'https://codeforces.com/problemset/problem/1899/A' },
          { id: '1901A', name: 'Line Trip', rating: 800, url: 'https://codeforces.com/problemset/problem/1901/A' },
          { id: '2241A', name: 'Divide and Conquer', rating: 800, url: 'https://codeforces.com/problemset/problem/2241/A' },
          { id: '617A', name: 'Elephant', rating: 800, url: 'https://codeforces.com/problemset/problem/617/A' },
          { id: '50A', name: 'Domino piling', rating: 800, url: 'https://codeforces.com/problemset/problem/50/A' },
          { id: '2227A', name: 'Koshary', rating: 800, url: 'https://codeforces.com/problemset/problem/2227/A' },
          { id: '1A', name: 'Theatre Square', rating: 1000, url: 'https://codeforces.com/problemset/problem/1/A' }
        ],
        'greedy': [
          { id: '1900A', name: 'Cover in Water', rating: 800, url: 'https://codeforces.com/problemset/problem/1900/A' },
          { id: '1901A', name: 'Line Trip', rating: 800, url: 'https://codeforces.com/problemset/problem/1901/A' },
          { id: '2241A', name: 'Divide and Conquer', rating: 800, url: 'https://codeforces.com/problemset/problem/2241/A' },
          { id: '50A', name: 'Domino piling', rating: 800, url: 'https://codeforces.com/problemset/problem/50/A' },
          { id: '1903A', name: 'Halloumi Boxes', rating: 800, url: 'https://codeforces.com/problemset/problem/1903/A' },
          { id: '231A', name: 'Team', rating: 800, url: 'https://codeforces.com/problemset/problem/231/A' }
        ],
        'strings': [
          { id: '1900A', name: 'Cover in Water', rating: 800, url: 'https://codeforces.com/problemset/problem/1900/A' },
          { id: '118A', name: 'String Task', rating: 1000, url: 'https://codeforces.com/problemset/problem/118/A' },
          { id: '236A', name: 'Boy or Girl', rating: 800, url: 'https://codeforces.com/problemset/problem/236/A' },
          { id: '112A', name: 'Petya and Strings', rating: 800, url: 'https://codeforces.com/problemset/problem/112/A' },
          { id: '71A', name: 'Way Too Long Words', rating: 800, url: 'https://codeforces.com/problemset/problem/71/A' }
        ],
        'brute force': [
          { id: '271A', name: 'Beautiful Year', rating: 800, url: 'https://codeforces.com/problemset/problem/271/A' },
          { id: '1903A', name: 'Halloumi Boxes', rating: 800, url: 'https://codeforces.com/problemset/problem/1903/A' },
          { id: '236A', name: 'Boy or Girl', rating: 800, url: 'https://codeforces.com/problemset/problem/236/A' },
          { id: '231A', name: 'Team', rating: 800, url: 'https://codeforces.com/problemset/problem/231/A' },
          { id: '25A', name: 'IQ test', rating: 1300, url: 'https://codeforces.com/problemset/problem/25/A' }
        ],
        'sortings': [
          { id: '2254A', name: 'Riptide', rating: 800, url: 'https://codeforces.com/problemset/problem/2254/A' },
          { id: '1903A', name: 'Halloumi Boxes', rating: 800, url: 'https://codeforces.com/problemset/problem/1903/A' }
        ],
        'number theory': [
          { id: '1899A', name: 'Game with Integers', rating: 800, url: 'https://codeforces.com/problemset/problem/1899/A' },
          { id: '2241A', name: 'Divide and Conquer', rating: 800, url: 'https://codeforces.com/problemset/problem/2241/A' }
        ],
        'games': [
          { id: '1899A', name: 'Game with Integers', rating: 800, url: 'https://codeforces.com/problemset/problem/1899/A' }
        ],
        'constructive algorithms': [
          { id: '1900A', name: 'Cover in Water', rating: 800, url: 'https://codeforces.com/problemset/problem/1900/A' }
        ],
        '*special': [
          { id: '158A', name: 'Next Round', rating: 800, url: 'https://codeforces.com/problemset/problem/158/A' }
        ]
      };
      window.CF_TAG_PROBLEMS_MAP = TAG_PROBLEMS_MAP;

      let defaultUniqueCount = 21;
      const cx = 170, cy = 170, R = 130, r = 75, gapDeg = 1.2;

      function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
          x: centerX + (radius * Math.cos(angleInRadians)),
          y: centerY + (radius * Math.sin(angleInRadians))
        };
      }

      function describeArcSlice(centerX, centerY, innerR, outerR, startAngle, endAngle) {
        const p1 = polarToCartesian(centerX, centerY, outerR, startAngle);
        const p2 = polarToCartesian(centerX, centerY, outerR, endAngle);
        const p3 = polarToCartesian(centerX, centerY, innerR, endAngle);
        const p4 = polarToCartesian(centerX, centerY, innerR, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

        return [
          'M', p1.x.toFixed(2), p1.y.toFixed(2),
          'A', outerR, outerR, 0, largeArcFlag, 1, p2.x.toFixed(2), p2.y.toFixed(2),
          'L', p3.x.toFixed(2), p3.y.toFixed(2),
          'A', innerR, innerR, 0, largeArcFlag, 0, p4.x.toFixed(2), p4.y.toFixed(2),
          'Z'
        ].join(' ');
      }

      function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (m) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[m]));
      }

      function renderChart(animate = false) {
        const totalTags = tagsData.reduce((acc, t) => acc + t.count, 0) || 1;
        let slicesHtml = '';
        let legendHtml = '';
        let currentAngle = 0;

        tagsData.forEach((tag, idx) => {
          const pct = (tag.count / totalTags) * 100;
          const sweep = (tag.count / totalTags) * 360;
          const startAngle = currentAngle + gapDeg / 2;
          const endAngle = currentAngle + sweep - gapDeg / 2;
          const pathD = describeArcSlice(cx, cy, r, R, startAngle, endAngle);
          currentAngle += sweep;

          tag.startAngle = startAngle;
          tag.endAngle = endAngle;

          const safeName = escapeHtml(tag.name);
          const safeColor = escapeHtml(tag.color);
          const safeGlow = escapeHtml(tag.glow);
          const safeCount = parseInt(tag.count, 10) || 0;
          const safePct = pct.toFixed(1);

          slicesHtml += `
            <path class="cf-donut-slice"
                  d="${pathD}"
                  fill="${safeColor}"
                  style="--slice-glow: ${safeGlow};"
                  data-index="${idx}"
                  data-name="${safeName}"
                  data-count="${safeCount}"
                  data-pct="${safePct}%"
                  data-color="${safeColor}">
            </path>
          `;

          legendHtml += `
            <div class="legend-tag-row" data-index="${idx}" style="--tag-color: ${safeColor};">
              <div class="legend-tag-left">
                <span class="legend-color-box" style="background-color: ${safeColor}; color: ${safeColor};"></span>
                <span class="legend-tag-label">${safeName}</span>
              </div>
              <div class="legend-tag-right">
                <span class="legend-tag-colon">:</span>
                <span class="legend-tag-val">${safeCount}</span>
                <span class="legend-tag-pct">(${pct.toFixed(0)}%)</span>
              </div>
            </div>
          `;
        });

        slicesGroup.innerHTML = slicesHtml;
        legendContainer.innerHTML = legendHtml;

        const sliceEls = document.querySelectorAll('.cf-donut-slice');
        const legendEls = document.querySelectorAll('.legend-tag-row');

        // Spreading lines DOM references
        const spreadingOverlay = document.getElementById('cf-donut-spreading-overlay');
        const spreadingSvg = document.getElementById('cf-donut-spreading-svg');
        const spreadingLabels = document.getElementById('cf-donut-spreading-labels');
        const tagsBody = document.querySelector('.cf-tags-body');
        const donutStage = document.querySelector('.cf-donut-stage');

        let hideTimeout = null;
        let activeTagIndex = -1;

        function showSpreadingLines(index) {
          if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
          }

          if (index < 0 || index >= tagsData.length) return;
          if (activeTagIndex === index && spreadingOverlay && spreadingOverlay.classList.contains('active')) return;
          activeTagIndex = index;

          const tag = tagsData[index];
          const problems = TAG_PROBLEMS_MAP[tag.name] || [];
          if (!spreadingOverlay || !spreadingSvg || !spreadingLabels || !tagsBody || !donutStage) return;

          const bodyRect = tagsBody.getBoundingClientRect();
          const stageRect = donutStage.getBoundingClientRect();
          const cxPos = stageRect.left - bodyRect.left + 160;
          const cyPos = stageRect.top - bodyRect.top + 160;
          const outerRadius = 130;

          // Clear previous elements
          spreadingSvg.innerHTML = '';
          spreadingLabels.innerHTML = '';

          // Visual angles (-90deg SVG transform and polar offset)
          const visStart = (tag.startAngle || 0) - 180;
          const visEnd = (tag.endAngle || 360) - 180;
          const visMid = (visStart + visEnd) / 2;
          const isRightSide = Math.cos(visMid * Math.PI / 180) >= -0.25;

          // Softly dim the background legend so laser circuits pop
          legendContainer.classList.add('dimmed');
          spreadingOverlay.classList.add('active');
          gsap.set(spreadingOverlay, { autoAlpha: 1 });

          const isCompact = bodyRect.width < 860;
          const allProblems = TAG_PROBLEMS_MAP[tag.name] || [];
          const hasMore = allProblems.length > 5 || tag.count > 5;
          const displayProblems = allProblems.slice(0, 5);
          const totalItems = hasMore ? displayProblems.length + 1 : displayProblems.length;
          if (totalItems === 0) return;

          const pathsToAnimate = [];
          const dotsToAnimate = [];
          const chipsToAnimate = [];

          for (let i = 0; i < totalItems; i++) {
            const isMoreItem = hasMore && i === displayProblems.length;
            const p = isMoreItem ? null : displayProblems[i];
            const angleDeg = visStart + (i + 0.5) * (visEnd - visStart) / totalItems;
            const rad = angleDeg * Math.PI / 180;
            const startX = cxPos + (outerRadius + 4) * Math.cos(rad);
            const startY = cyPos + (outerRadius + 4) * Math.sin(rad);

            let endX, endY, d;

            if (isCompact) {
              const chipWidth = Math.min(280, bodyRect.width - 48);
              endX = Math.max(24, cxPos - chipWidth / 2);
              endY = cyPos + 155 + i * 38;
              const wpY = (startY + endY) * 0.5;
              d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${startX.toFixed(1)} ${wpY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
            } else {
              endX = cxPos + 180 + (i % 2 === 1 ? 14 : 0);
              if (totalItems <= 2) {
                const baseY = cyPos + Math.sin(rad) * 45 - ((totalItems - 1) * 18);
                endY = Math.max(30, Math.min(bodyRect.height - 40, baseY + i * 36));
              } else if (Math.sin(visMid * Math.PI / 180) < 0) {
                const baseY = Math.max(26, cyPos - 130);
                endY = baseY + i * 36;
              } else {
                const baseY = Math.max(30, cyPos - 35);
                endY = baseY + i * 36;
              }

              if (isRightSide) {
                const midX = cxPos + (outerRadius + 25 + i * 8) * Math.cos(rad);
                const midY = cyPos + (outerRadius + 25 + i * 8) * Math.sin(rad);
                d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${midX.toFixed(1)} ${midY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`;
              } else {
                const wpX = cxPos + Math.cos(rad) * 35 + (i * 20);
                const wpY = Math.sin(rad) < 0
                  ? Math.max(16, startY - 35 - (i * 10))
                  : Math.min(bodyRect.height - 20, startY + 35 + (i * 10));
                d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${wpX.toFixed(1)} ${wpY.toFixed(1)} ${(endX - 30).toFixed(1)} ${endY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`;
              }
            }

            // Path line
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('class', 'cf-spread-line');
            path.setAttribute('stroke', tag.color);
            path.style.filter = `drop-shadow(0 0 6px ${tag.glow})`;
            spreadingSvg.appendChild(path);
            pathsToAnimate.push(path);

            // Node dot
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', endX);
            dot.setAttribute('cy', endY);
            dot.setAttribute('r', isMoreItem ? '4.5' : '3.5');
            dot.setAttribute('fill', tag.color);
            dot.setAttribute('class', 'cf-spread-dot');
            dot.style.filter = `drop-shadow(0 0 8px ${tag.glow})`;
            spreadingSvg.appendChild(dot);
            dotsToAnimate.push(dot);

            // Clickable problem link chip
            const chip = document.createElement('a');
            chip.target = '_blank';
            chip.rel = 'noopener noreferrer';
            chip.style.left = `${(endX + 8).toFixed(1)}px`;
            chip.style.top = `${(endY - 13).toFixed(1)}px`;
            chip.style.setProperty('--chip-color', tag.color);
            chip.style.setProperty('--chip-glow', tag.glow);

            if (isMoreItem) {
              chip.href = `problems.html?tag=${encodeURIComponent(tag.name)}`;
              chip.className = 'cf-spread-chip cf-spread-more-chip';
              chip.innerHTML = `
                <span class="cf-spread-more-text" style="color: ${tag.color}; font-weight: 700;">Want to see more questions?</span>
                <span class="cf-spread-chip-arrow" style="color: ${tag.color}; font-weight: 700;">↗</span>
              `;
            } else {
              chip.href = p.url;
              chip.className = 'cf-spread-chip';
              const ratingColor = p.rating >= 1900 ? '#A855F7' : (p.rating >= 1600 ? '#3B82F6' : (p.rating >= 1400 ? '#06B6D4' : (p.rating >= 1200 ? '#22C55E' : '#94A3B8')));
              chip.innerHTML = `
                <span class="cf-spread-chip-id">${escapeHtml(p.id)}</span>
                <span class="cf-spread-chip-name">${escapeHtml(p.name)}</span>
                <span class="cf-spread-chip-rating" style="color: ${ratingColor}; border: 1px solid ${ratingColor}44; background: ${ratingColor}15;">${escapeHtml(p.rating)}</span>
                <span class="cf-spread-chip-arrow">↗</span>
              `;
            }

            chip.addEventListener('pointerenter', () => {
              if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
              }
            });

            chip.addEventListener('pointerleave', () => {
              scheduleHide();
            });

            spreadingLabels.appendChild(chip);
            chipsToAnimate.push(chip);
          }

          // GSAP laser draw animation
          pathsToAnimate.forEach((p, lineIdx) => {
            const len = p.getTotalLength() || 150;
            gsap.fromTo(p,
              { strokeDasharray: len, strokeDashoffset: len },
              {
                strokeDashoffset: 0,
                duration: 0.35,
                delay: lineIdx * 0.03,
                ease: 'power2.out',
                onComplete: () => {
                  p.style.strokeDasharray = '6 4';
                }
              }
            );
          });

          gsap.fromTo(dotsToAnimate,
            { scale: 0, transformOrigin: 'center center' },
            { scale: 1, stagger: 0.03, duration: 0.3, delay: 0.15, ease: 'back.out(2)' }
          );

          gsap.fromTo(chipsToAnimate,
            { autoAlpha: 0, x: -15, scale: 0.95 },
            { autoAlpha: 1, x: 0, scale: 1, stagger: 0.04, duration: 0.3, delay: 0.1, ease: 'power2.out' }
          );
        }

        function scheduleHide() {
          if (hideTimeout) clearTimeout(hideTimeout);
          // Exactly 1.5 seconds retention after mouse leaves the shape
          hideTimeout = setTimeout(() => {
            retractSpreadingLines();
          }, 1500);
        }

        function retractSpreadingLines() {
          if (!spreadingOverlay || !spreadingOverlay.classList.contains('active')) return;
          activeTagIndex = -1;

          gsap.to([spreadingSvg, spreadingLabels], {
            autoAlpha: 0,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => {
              spreadingOverlay.classList.remove('active');
              spreadingSvg.innerHTML = '';
              spreadingLabels.innerHTML = '';
              gsap.set([spreadingSvg, spreadingLabels], { autoAlpha: 1 });
              legendContainer.classList.remove('dimmed');
              unhighlightTag();
            }
          });
        }

        if (spreadingOverlay) {
          spreadingOverlay.addEventListener('pointerenter', () => {
            if (hideTimeout) {
              clearTimeout(hideTimeout);
              hideTimeout = null;
            }
          });
          spreadingOverlay.addEventListener('pointerleave', () => {
            scheduleHide();
          });
        }

        function highlightTag(index) {
          if (index < 0 || index >= tagsData.length) return;
          const tag = tagsData[index];
          const pct = ((tag.count / totalTags) * 100).toFixed(1);

          donutSvg.classList.add('has-active');

          sliceEls.forEach((s, i) => {
            if (i === index) s.classList.add('active');
            else s.classList.remove('active');
          });

          legendEls.forEach((l, i) => {
            if (i === index) l.classList.add('active');
            else l.classList.remove('active');
          });

          if (hudTagName && hudTagCount && hudTagMeta) {
            hudTagName.textContent = tag.name;
            hudTagName.style.color = tag.color;
            hudTagCount.textContent = tag.count;
            hudTagCount.style.color = tag.color;
            hudTagCount.style.textShadow = `0 0 16px ${tag.glow}`;
            hudTagMeta.textContent = `${pct}% OF TAGGED`;
          }

          if (centerHud) {
            centerHud.style.borderColor = tag.color;
            centerHud.style.boxShadow = `inset 0 0 20px rgba(0, 0, 0, 0.9), 0 0 18px ${tag.glow}`;
          }
        }

        function unhighlightTag() {
          donutSvg.classList.remove('has-active');
          sliceEls.forEach(s => s.classList.remove('active'));
          legendEls.forEach(l => l.classList.remove('active'));

          if (hudTagName && hudTagCount && hudTagMeta) {
            hudTagName.textContent = 'TOPICS';
            hudTagName.style.color = '';
            hudTagCount.textContent = defaultUniqueCount;
            hudTagCount.style.color = '';
            hudTagCount.style.textShadow = '';
            hudTagMeta.textContent = 'UNIQUE SOLVED';
          }

          if (centerHud) {
            centerHud.style.borderColor = '';
            centerHud.style.boxShadow = '';
          }
        }

        // Bind slice events (Glow slice and show spreading questions on hover)
        sliceEls.forEach(el => {
          el.addEventListener('pointerenter', () => {
            const idx = parseInt(el.getAttribute('data-index'), 10);
            highlightTag(idx);
            showSpreadingLines(idx);
          });
          el.addEventListener('pointerleave', () => {
            scheduleHide();
          });
        });

        // Bind legend row events (Glow graph slice only, do NOT display spreading questions)
        legendEls.forEach(el => {
          el.addEventListener('pointerenter', () => {
            const idx = parseInt(el.getAttribute('data-index'), 10);
            highlightTag(idx);
          });
          el.addEventListener('pointerleave', () => {
            unhighlightTag();
          });
        });

        if (animate) {
          gsap.fromTo(sliceEls,
            { scale: 0.4, opacity: 0, transformOrigin: '170px 170px' },
            { scale: 1, opacity: 1, stagger: 0.02, duration: 0.4, ease: 'back.out(1.6)' }
          );
        }
      }

      renderChart(false);

      // Global Live API hook to update the Donut Chart when Codeforces API returns fresh tags
      window.updateCodeforcesTagsChart = function (tagCountsMap, uniqueSolvedCount, tagProblemsMap) {
        if (tagProblemsMap && typeof tagProblemsMap === 'object') {
          Object.assign(TAG_PROBLEMS_MAP, tagProblemsMap);
        }
        if (!tagCountsMap || typeof tagCountsMap !== 'object') return;
        const keys = Object.keys(tagCountsMap);
        if (keys.length === 0) return;

        const updatedList = keys
          .map((rawName, i) => {
            const name = String(rawName).replace(/[^a-zA-Z0-9\s*+\-_]/g, '').trim();
            if (!name || name === '__proto__' || name === 'constructor' || name === 'prototype') return null;
            const pal = TAG_PALETTE[name] || {
              color: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
              glow: 'rgba(0, 255, 102, 0.85)'
            };
            return {
              name,
              count: parseInt(tagCountsMap[rawName], 10) || 0,
              color: pal.color,
              glow: pal.glow
            };
          })
          .filter(t => t && t.count > 0)
          .sort((a, b) => b.count - a.count);

        if (updatedList.length > 0) {
          tagsData = updatedList;
          if (uniqueSolvedCount) {
            defaultUniqueCount = uniqueSolvedCount;
            const badgeUnique = document.getElementById('cf-unique-solved-badge');
            if (badgeUnique) badgeUnique.textContent = `${uniqueSolvedCount} UNIQUE PROBLEMS`;
            if (hudTagCount) hudTagCount.textContent = defaultUniqueCount;
          }
          const totalTags = tagsData.reduce((acc, t) => acc + t.count, 0);
          const badgeTagged = document.getElementById('cf-tagged-instances-badge');
          if (badgeTagged) badgeTagged.textContent = `// ${totalTags} TAGGED INSTANCES`;

          renderChart(true);
        }
      };

      // ScrollTrigger Entrance Animation
      const tagsCard = document.querySelector('.cf-tags-card');
      if (tagsCard) {
        ScrollTrigger.create({
          trigger: tagsCard,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            renderChart(true);
          }
        });
      }
    }

    initCodeforcesTagsChart();

    // 4.10. Interactive Code Snap 3-Second Hover Growth & Glow
    function initCodeSnapHoverExpansion() {
      const snaps = document.querySelectorAll('.code-snap-card');
      snaps.forEach((snap) => {
        let hoverTimer = null;

        const onEnter = () => {
          if (hoverTimer || snap.classList.contains('code-snap-charging')) return;
          snap.classList.add('code-snap-charging');
          hoverTimer = setTimeout(() => {
            snap.classList.add('code-snap-expanded');
            if (typeof gsap !== 'undefined') {
              gsap.fromTo(
                snap,
                { scale: 1.01 },
                { scale: 1.025, duration: 0.45, ease: 'back.out(1.8)' }
              );
            }
          }, 3000);
        };

        const cancelHover = () => {
          if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
          }
          snap.classList.remove('code-snap-charging');
          if (snap.classList.contains('code-snap-expanded')) {
            snap.classList.remove('code-snap-expanded');
            if (typeof gsap !== 'undefined') {
              gsap.to(snap, {
                scale: 1,
                duration: 0.35,
                ease: 'power2.out',
                clearProps: 'transform'
              });
            }
          }
        };

        snap.addEventListener('pointerenter', onEnter);
        snap.addEventListener('mouseenter', onEnter);
        snap.addEventListener('pointerleave', cancelHover);
        snap.addEventListener('mouseleave', cancelHover);
        snap.addEventListener('pointercancel', cancelHover);
      });
    }

    initCodeSnapHoverExpansion();

    // 5. GitHub Activity Card Entrance
    const githubCard = document.querySelector('.github-matrix-card');
    if (githubCard) {
      gsap.fromTo(
        githubCard,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.github-section',
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    // 6. GSAP Pinned Horizontal Projects Gallery
    // Uses ScrollTrigger.matchMedia() for smooth desktop pinning with scrub: 1,
    // and automatic fallback to vertical stack on mobile (<= 768px).
    ScrollTrigger.matchMedia({
      // Desktop: screens > 768px
      '(min-width: 769px)': function () {
        const track = document.querySelector('.projects-horizontal-track');
        const section = document.querySelector('.projects-pinned-section');

        if (track && section) {
          const getScrollAmount = () => {
            const trackWidth = track.scrollWidth;
            const viewportWidth = window.innerWidth;
            return Math.max(0, trackWidth - viewportWidth + 80);
          };

          const tween = gsap.to(track, {
            x: () => -getScrollAmount(),
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              pin: true,
              scrub: 1,
              start: 'top top',
              end: () => `+=${getScrollAmount()}`,
              invalidateOnRefresh: true
            }
          });

          return () => {
            if (tween.scrollTrigger) tween.scrollTrigger.kill();
            gsap.set(track, { clearProps: 'all' });
          };
        }
      },

      // Mobile / Tablet: screens <= 768px
      '(max-width: 768px)': function () {
        const track = document.querySelector('.projects-horizontal-track');
        if (track) {
          gsap.set(track, { clearProps: 'all' });
        }
      }
    });

    // 7. Algorithmic Manifesto Kinetic Scroll Scrub
    const manifestoStatement = document.getElementById('manifesto-statement');
    const manifestoSection = document.getElementById('philosophy');
    if (manifestoStatement && manifestoSection) {
      gsap.fromTo(
        manifestoStatement,
        {
          letterSpacing: '-0.02em',
          filter: 'brightness(0.85)'
        },
        {
          letterSpacing: '0.04em',
          filter: 'brightness(1.15)',
          ease: 'none',
          scrollTrigger: {
            trigger: manifestoSection,
            start: 'top 80%',
            end: 'bottom 40%',
            scrub: 1
          }
        }
      );

      const words = manifestoStatement.querySelectorAll('.manifesto-word');
      if (words.length) {
        gsap.from(words, {
          opacity: 0.25,
          y: 10,
          stagger: 0.08,
          scrollTrigger: {
            trigger: manifestoSection,
            start: 'top 75%',
            end: 'top 35%',
            scrub: 0.8
          }
        });
      }
    }

    // 8. Contact Terminal Simulation
    const cmdBar = document.querySelector('.terminal-cmd-line');
    if (cmdBar) {
      cmdBar.addEventListener('click', () => {
        const banner = document.querySelector('.terminal-banner-text');
        if (banner) {
          banner.textContent = '[RE-TRANSMITTING...] Handshake re-established: All 4 socket routes active.';
          banner.style.color = 'var(--accent-green)';
          setTimeout(() => {
            banner.style.color = '';
          }, 1800);
        }
      });
    }
  }

  /**
   * Wire Anchor Links to Lenis Smooth Scroll
   */
  function initAnchorNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        if (lenisInstance) {
          lenisInstance.scrollTo(target, {
            offset: -72,
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        } else {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // Self-initializing lifecycle hook
  document.addEventListener('DOMContentLoaded', () => {
    initLenis();
    initScrollAnimations();
    initAnchorNavigation();
  });

  // Re-calculate layouts on complete page resource load (fonts, scripts)
  window.addEventListener('load', () => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  });

  // Export for external modules
  window.PortfolioMotion = {
    getLenis: () => lenisInstance,
    refreshScrollTrigger: () => {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }
  };
})();
