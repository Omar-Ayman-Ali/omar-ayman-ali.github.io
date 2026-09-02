/**
 * 2D HTML5 Canvas Algorithmic Graph Visualizer
 * Simulates DFS/BFS Graph Traversal & Node Proximity Waves
 * Architecture: 45 dynamic nodes, electric green edges (#00FF66), 60 FPS loop
 */

(function () {
  'use strict';

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class GraphVisualizer {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.nodeCount = window.innerWidth <= 768 ? 20 : 45;
      this.maxEdgeDistance = 140;
      this.mouseProximityDistance = 160;
      this.nodes = [];
      this.mouse = { x: -9999, y: -9999, active: false };
      this.animFrameId = null;
      this.isPaused = false;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      window.GraphVisualizerInstance = this;
      this.init();
    }

    init() {
      this.handleResize();
      this.createNodes();
      this.bindEvents();

      if (!prefersReducedMotion) {
        this.startRenderLoop();
      } else {
        this.renderStatic();
      }
    }

    handleResize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      const targetCount = this.width <= 768 ? 20 : 45;
      const countChanged = this.nodeCount !== targetCount;
      this.nodeCount = targetCount;

      // Scale for device pixel ratio
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;

      this.ctx.scale(this.dpr, this.dpr);

      if (countChanged) {
        this.createNodes();
      }
    }

    createNodes() {
      this.nodes = [];
      for (let i = 0; i < this.nodeCount; i++) {
        // Distribute across viewport
        this.nodes.push({
          id: i,
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.75,
          vy: (Math.random() - 0.5) * 0.75,
          radius: 1.8 + Math.random() * 1.4,
          baseRadius: 1.8 + Math.random() * 1.4,
          frontierAlpha: 0,
          depth: Math.floor(Math.random() * 4) // Simulated graph depth
        });
      }
    }

    bindEvents() {
      // Debounced window resize
      let resizeTimeout;
      this.onResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.handleResize();
        }, 150);
      };
      window.addEventListener('resize', this.onResize, { passive: true });

      // Mouse proximity tracking
      this.onMouseMove = (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.mouse.active = true;
      };
      window.addEventListener('mousemove', this.onMouseMove, { passive: true });

      this.onMouseLeave = () => {
        this.mouse.active = false;
        this.mouse.x = -9999;
        this.mouse.y = -9999;
      };
      window.addEventListener('mouseout', this.onMouseLeave, { passive: true });

      // Tab visibility listener to halt RAF when tab is hidden (zero memory leaks/CPU load)
      this.onVisibilityChange = () => {
        if (document.hidden) {
          this.isPaused = true;
          if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        } else {
          this.isPaused = false;
          this.startRenderLoop();
        }
      };
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }

    startRenderLoop() {
      const render = () => {
        if (this.isPaused) return;
        this.updateAndDraw();
        this.animFrameId = requestAnimationFrame(render);
      };
      this.animFrameId = requestAnimationFrame(render);
    }

    renderStatic() {
      this.updateAndDraw(true);
    }

    updateAndDraw(staticOnly = false) {
      this.ctx.clearRect(0, 0, this.width, this.height);

      const nodes = this.nodes;
      const count = nodes.length;

      // 1. Update node physics & positions
      for (let i = 0; i < count; i++) {
        const node = nodes[i];

        if (!staticOnly) {
          node.x += node.vx;
          node.y += node.vy;

          // Boundary bounce with padding
          if (node.x <= 0 || node.x >= this.width) node.vx *= -1;
          if (node.y <= 0 || node.y >= this.height) node.vy *= -1;
        }

        // Pointer proximity calculation (algorithmic search frontier)
        let isFrontier = false;
        if (this.mouse.active) {
          const dx = this.mouse.x - node.x;
          const dy = this.mouse.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < this.mouseProximityDistance) {
            isFrontier = true;
            // Decay frontier alpha based on proximity
            const factor = 1 - dist / this.mouseProximityDistance;
            node.frontierAlpha = Math.min(1, node.frontierAlpha + factor * 0.1);

            // Subtle algorithmic repulsion/attraction
            if (!staticOnly) {
              node.x -= (dx / dist) * factor * 0.8;
              node.y -= (dy / dist) * factor * 0.8;
            }

            // Draw search ray to mouse
            this.ctx.beginPath();
            this.ctx.moveTo(node.x, node.y);
            this.ctx.lineTo(this.mouse.x, this.mouse.y);
            this.ctx.strokeStyle = `rgba(0, 255, 102, ${factor * 0.45})`;
            this.ctx.lineWidth = 0.9;
            this.ctx.stroke();
          }
        }

        if (!isFrontier) {
          node.frontierAlpha = Math.max(0, node.frontierAlpha - 0.03);
        }
      }

      // 2. Draw Graph Edges (Connecting lines where distance < 140px)
      for (let i = 0; i < count; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < count; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < this.maxEdgeDistance) {
            const proximityFactor = 1 - dist / this.maxEdgeDistance;
            const frontierBoost = Math.max(nodeA.frontierAlpha, nodeB.frontierAlpha);
            const edgeAlpha = (proximityFactor * 0.5 + frontierBoost * 0.45).toFixed(3);

            this.ctx.beginPath();
            this.ctx.moveTo(nodeA.x, nodeA.y);
            this.ctx.lineTo(nodeB.x, nodeB.y);

            // Active BFS/DFS frontier edge turns bright neon green
            if (frontierBoost > 0.3) {
              this.ctx.strokeStyle = `rgba(0, 255, 102, ${edgeAlpha})`;
              this.ctx.lineWidth = 1.1;
            } else {
              this.ctx.strokeStyle = `rgba(0, 255, 102, ${edgeAlpha * 0.7})`;
              this.ctx.lineWidth = 0.75;
            }
            this.ctx.stroke();
          }
        }
      }

      // 3. Draw Graph Nodes
      for (let i = 0; i < count; i++) {
        const node = nodes[i];
        const activeRadius = node.baseRadius + node.frontierAlpha * 2.2;

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, activeRadius, 0, Math.PI * 2);

        if (node.frontierAlpha > 0.2) {
          this.ctx.fillStyle = '#00FF66';
          this.ctx.shadowColor = '#00FF66';
          this.ctx.shadowBlur = 8;
        } else {
          this.ctx.fillStyle = 'rgba(0, 255, 102, 0.75)';
          this.ctx.shadowBlur = 0;
        }

        this.ctx.fill();
        this.ctx.shadowBlur = 0; // Reset shadow for next primitive
      }
    }

    destroy() {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
      }
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('mouseout', this.onMouseLeave);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.nodes = [];
    }
  }

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    window.graphVisualizerInstance = new GraphVisualizer('graph-canvas');
  });
})();
