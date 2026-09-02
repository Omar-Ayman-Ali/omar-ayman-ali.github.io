/**
 * Magnetic Crosshair & Spring Physics Cursor
 * 2-layer Architecture: 4px Inner Dot & 28px Trailing Spring Ring (#00FF66)
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
      if (!this.dot || !this.ring) return;

      this.mouse = { x: -100, y: -100 };
      this.activeMagneticEl = null;
      this.isHoveringClickable = false;

      this.init();
    }

    init() {
      // Add custom cursor class to html to hide default pointer where appropriate
      document.documentElement.classList.add('has-custom-cursor');

      // GSAP QuickSetter / QuickTo for ultra-smooth 60fps tracking without lag or jitter
      this.setDotX = gsap.quickTo(this.dot, 'x', { duration: 0.05, ease: 'none' });
      this.setDotY = gsap.quickTo(this.dot, 'y', { duration: 0.05, ease: 'none' });

      this.setRingX = gsap.quickTo(this.ring, 'x', { duration: 0.32, ease: 'power3.out' });
      this.setRingY = gsap.quickTo(this.ring, 'y', { duration: 0.32, ease: 'power3.out' });

      this.bindEvents();
      this.bindMagneticElements();
    }

    bindEvents() {
      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;

        // Reveal cursor elements once initial coordinate is captured
        if (!this.cursorVisible) {
          this.cursorVisible = true;
          gsap.to([this.dot, this.ring], { opacity: 1, duration: 0.2 });
        }

        this.setDotX(this.mouse.x);
        this.setDotY(this.mouse.y);

        if (!this.activeMagneticEl) {
          this.setRingX(this.mouse.x);
          this.setRingY(this.mouse.y);
        }
      }, { passive: true });

      window.addEventListener('mouseleave', () => {
        this.cursorVisible = false;
        gsap.to([this.dot, this.ring], { opacity: 0, duration: 0.2 });
      });

      window.addEventListener('mouseenter', () => {
        this.cursorVisible = true;
        gsap.to([this.dot, this.ring], { opacity: 1, duration: 0.2 });
      });

      // Press down micro-interaction
      window.addEventListener('mousedown', () => {
        gsap.to(this.ring, { scale: 0.75, duration: 0.15, ease: 'power2.out' });
        gsap.to(this.dot, { scale: 1.5, duration: 0.15, ease: 'power2.out' });
      });

      window.addEventListener('mouseup', () => {
        const targetScale = this.isHoveringClickable ? 1.4 : 1.0;
        gsap.to(this.ring, { scale: targetScale, duration: 0.2, ease: 'power3.out' });
        gsap.to(this.dot, { scale: 1.0, duration: 0.2, ease: 'power3.out' });
      });
    }

    bindMagneticElements() {
      const magneticTargets = document.querySelectorAll(
        'a, button, [data-magnetic], .btn-primary, .btn-secondary, .btn-ctrl, .nav-coord, .telemetry-tile'
      );

      magneticTargets.forEach((el) => {
        el.addEventListener('mouseenter', () => {
          this.isHoveringClickable = true;
          this.activeMagneticEl = el;

          // Expand ring with glowing border
          gsap.to(this.ring, {
            scale: 1.55,
            borderColor: '#00FF66',
            backgroundColor: 'rgba(0, 255, 102, 0.08)',
            duration: 0.25,
            ease: 'power3.out'
          });
        });

        el.addEventListener('mousemove', (e) => {
          if (this.activeMagneticEl !== el) return;

          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          // Compute magnetic pull distance
          const deltaX = (e.clientX - centerX) * 0.25;
          const deltaY = (e.clientY - centerY) * 0.25;

          // Pull the element gently
          gsap.to(el, {
            x: deltaX,
            y: deltaY,
            duration: 0.25,
            ease: 'power2.out',
            overwrite: 'auto'
          });

          // Pull the ring slightly towards element center
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

          // Reset ring
          gsap.to(this.ring, {
            scale: 1.0,
            borderColor: '#00FF66',
            backgroundColor: 'transparent',
            duration: 0.3,
            ease: 'power3.out'
          });
        });
      });
    }
  }

  // Self-initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    window.magneticCursorInstance = new MagneticCursor();
  });
})();
