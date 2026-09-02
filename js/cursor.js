/**
 * Magnetic Crosshair & Spring Physics Cursor with Heavy Palette Glow Trailing
 * 3-layer Architecture:
 *  - 4px Inner Dot (High-precision instantaneous tracker)
 *  - 28px Trailing Spring Ring (#00FF66 default, Codeforces Blue, GitHub Purple)
 *  - 56px Diffuse Ambient Glow Aura (Fluid spring follower)
 * Includes Magnetic Element Attraction and Automatic Touch Device Disabling
 */

(function () {
  'use strict';

  // Check touch devices or coarse pointers
  const isTouchDevice = () => {
    return (
      window.matchMedia('(pointer: coarse)').matches ||
      window.innerWidth <= 768 ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  };

  // Check reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class MagneticCursor {
    constructor() {
      if (isTouchDevice() || prefersReducedMotion) {
        document.documentElement.classList.add('no-custom-cursor');
        return;
      }

      this.dot = document.querySelector('.custom-cursor-dot');
      this.ring = document.querySelector('.custom-cursor-ring');
      this.glow = document.querySelector('.custom-cursor-glow');
      if (!this.dot || !this.ring) return;

      this.mouse = { x: -100, y: -100 };
      this.activeMagneticEl = null;
      this.isHoveringClickable = false;
      this.currentColor = '#00FF66';
      this.currentGlow = 'rgba(0, 255, 102, 0.28)';

      this.init();
    }

    init() {
      // Add custom cursor class to html to hide default pointer where appropriate
      document.documentElement.classList.add('has-custom-cursor');

      // GSAP quickTo for ultra-smooth 60fps tracking without lag or jitter
      this.setDotX = gsap.quickTo(this.dot, 'x', { duration: 0.04, ease: 'none' });
      this.setDotY = gsap.quickTo(this.dot, 'y', { duration: 0.04, ease: 'none' });

      this.setRingX = gsap.quickTo(this.ring, 'x', { duration: 0.28, ease: 'power3.out' });
      this.setRingY = gsap.quickTo(this.ring, 'y', { duration: 0.28, ease: 'power3.out' });

      if (this.glow) {
        this.setGlowX = gsap.quickTo(this.glow, 'x', { duration: 0.45, ease: 'power2.out' });
        this.setGlowY = gsap.quickTo(this.glow, 'y', { duration: 0.45, ease: 'power2.out' });
      }

      this.bindEvents();
      this.bindMagneticElements();
      this.bindPaletteContext();
    }

    bindEvents() {
      const allCursorEls = [this.dot, this.ring];
      if (this.glow) allCursorEls.push(this.glow);

      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;

        // Reveal cursor elements once initial coordinate is captured
        if (!this.cursorVisible) {
          this.cursorVisible = true;
          gsap.to(allCursorEls, { opacity: 1, duration: 0.25, overwrite: 'auto' });
        }

        this.setDotX(this.mouse.x);
        this.setDotY(this.mouse.y);

        if (!this.activeMagneticEl) {
          this.setRingX(this.mouse.x);
          this.setRingY(this.mouse.y);
        }

        if (this.glow) {
          this.setGlowX(this.mouse.x);
          this.setGlowY(this.mouse.y);
        }
      }, { passive: true });

      window.addEventListener('mouseleave', () => {
        this.cursorVisible = false;
        gsap.to(allCursorEls, { opacity: 0, duration: 0.2, overwrite: 'auto' });
      });

      window.addEventListener('mouseenter', () => {
        this.cursorVisible = true;
        gsap.to(allCursorEls, { opacity: 1, duration: 0.2, overwrite: 'auto' });
      });

      // Press down micro-interaction (spring compression)
      window.addEventListener('mousedown', () => {
        gsap.to(this.ring, { scale: 0.75, duration: 0.15, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(this.dot, { scale: 1.5, duration: 0.15, ease: 'power2.out', overwrite: 'auto' });
        if (this.glow) gsap.to(this.glow, { scale: 0.8, opacity: 0.4, duration: 0.15, overwrite: 'auto' });
      });

      window.addEventListener('mouseup', () => {
        const targetScale = this.isHoveringClickable ? 1.45 : 1.0;
        gsap.to(this.ring, { scale: targetScale, duration: 0.22, ease: 'power3.out', overwrite: 'auto' });
        gsap.to(this.dot, { scale: 1.0, duration: 0.2, ease: 'power3.out', overwrite: 'auto' });
        if (this.glow) gsap.to(this.glow, { scale: this.isHoveringClickable ? 1.5 : 1.0, opacity: 1, duration: 0.25, overwrite: 'auto' });
      });
    }

    // Context-aware palette adaptation across page sections
    bindPaletteContext() {
      // Codeforces sections or links
      const cfZones = document.querySelectorAll('#competitive, .cf-terminal-window, .cf-link, [data-theme="codeforces"]');
      cfZones.forEach(zone => {
        zone.addEventListener('mouseenter', () => this.setThemeColor('#318CE7', 'rgba(49, 140, 231, 0.35)'));
        zone.addEventListener('mouseleave', (e) => {
          if (!e.relatedTarget || !e.relatedTarget.closest('#github, .github-intelligence-section, .repo-slide-card')) {
            this.setThemeColor('#00FF66', 'rgba(0, 255, 102, 0.28)');
          }
        });
      });

      // GitHub sections or links
      const ghZones = document.querySelectorAll('#github, .github-intelligence-section, .repo-slide-card, .gh-btn-action, .gh-link');
      ghZones.forEach(zone => {
        zone.addEventListener('mouseenter', () => this.setThemeColor('#8957E5', 'rgba(137, 87, 229, 0.35)'));
        zone.addEventListener('mouseleave', (e) => {
          if (!e.relatedTarget || !e.relatedTarget.closest('#competitive, .cf-terminal-window')) {
            this.setThemeColor('#00FF66', 'rgba(0, 255, 102, 0.28)');
          }
        });
      });
    }

    setThemeColor(color, glow) {
      this.currentColor = color;
      this.currentGlow = glow;

      gsap.to(this.dot, {
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}`,
        duration: 0.25,
        overwrite: 'auto'
      });

      gsap.to(this.ring, {
        borderColor: color,
        boxShadow: `0 0 14px ${glow}`,
        duration: 0.25,
        overwrite: 'auto'
      });

      if (this.glow) {
        this.glow.style.background = `radial-gradient(circle, ${glow} 0%, transparent 70%)`;
      }
    }

    bindMagneticElements() {
      const magneticTargets = document.querySelectorAll(
        'a, button, [data-magnetic], .btn-primary, .btn-secondary, .btn-ctrl, .nav-coord, .telemetry-tile, .capability-pillar, .repo-slide-card'
      );

      magneticTargets.forEach((el) => {
        el.addEventListener('mouseenter', () => {
          this.isHoveringClickable = true;
          this.activeMagneticEl = el;

          // Expand ring and glow aura
          gsap.to(this.ring, {
            scale: 1.5,
            borderColor: this.currentColor,
            backgroundColor: this.currentColor === '#00FF66' ? 'rgba(0, 255, 102, 0.08)' : (this.currentColor === '#318CE7' ? 'rgba(49, 140, 231, 0.08)' : 'rgba(137, 87, 229, 0.08)'),
            duration: 0.25,
            ease: 'power3.out',
            overwrite: 'auto'
          });

          if (this.glow) {
            gsap.to(this.glow, {
              scale: 1.6,
              duration: 0.3,
              ease: 'power2.out',
              overwrite: 'auto'
            });
          }
        });

        el.addEventListener('mousemove', (e) => {
          if (this.activeMagneticEl !== el) return;

          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          // Subtle magnetic pull distance
          const deltaX = (e.clientX - centerX) * 0.22;
          const deltaY = (e.clientY - centerY) * 0.22;

          // Pull the element gently
          gsap.to(el, {
            x: deltaX,
            y: deltaY,
            duration: 0.25,
            ease: 'power2.out',
            overwrite: 'auto'
          });

          // Pull ring slightly towards element center
          this.setRingX(centerX + deltaX * 0.6);
          this.setRingY(centerY + deltaY * 0.6);
        });

        el.addEventListener('mouseleave', () => {
          this.isHoveringClickable = false;
          this.activeMagneticEl = null;

          // Reset element position with spring recovery
          gsap.to(el, {
            x: 0,
            y: 0,
            duration: 0.45,
            ease: 'elastic.out(1, 0.4)',
            overwrite: 'auto'
          });

          // Reset ring and glow
          gsap.to(this.ring, {
            scale: 1.0,
            borderColor: this.currentColor,
            backgroundColor: 'transparent',
            duration: 0.3,
            ease: 'power3.out',
            overwrite: 'auto'
          });

          if (this.glow) {
            gsap.to(this.glow, {
              scale: 1.0,
              duration: 0.35,
              ease: 'power2.out',
              overwrite: 'auto'
            });
          }
        });
      });
    }
  }

  // Self-initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    window.magneticCursorInstance = new MagneticCursor();
  });
})();
