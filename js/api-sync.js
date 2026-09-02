/**
 * Live Stats Synchronization Module (Hybrid Cache-First Architecture)
 * Safely synchronizes Codeforces and GitHub metrics with rate-limit protection,
 * 1-hour LocalStorage caching, 4-second timeout, and zero innerHTML injection.
 */

(function () {
  'use strict';

  const CF_HANDLE = 'Itz_Arslan';
  const GH_HANDLE = 'Omar-Ayman-Ali';
  const CACHE_KEY = 'omar_portfolio_live_stats_v1';
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour TTL
  const FETCH_TIMEOUT_MS = 4000; // 4-second timeout

  // Ground-truth verified fallback baseline
  const BASELINE_STATS = {
    cfRating: 747,
    cfPeakRating: 747,
    cfRank: 'newbie',
    cfMaxRank: 'newbie',
    cfSolved: 219,
    cfUniqueSolved: 21,
    cfContests: 3,
    ghRepos: 4,
    cfTags: {
      'implementation': 10,
      'math': 7,
      'greedy': 6,
      'brute force': 5,
      'strings': 5,
      'sortings': 2,
      'number theory': 2,
      '*special': 1,
      'constructive algorithms': 1,
      'games': 1
    }
  };

  /**
   * Safe Fetch with AbortController timeout and silent fallback on rate-limits
   */
  async function safeFetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timer);
      if (!response.ok) {
        return null; // Silent fallback to baseline stats without console errors
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timer);
      return null;
    }
  }

  /**
   * Rank title to badge CSS class helper
   */
  function getRankBadgeClass(rating) {
    if (rating >= 1900) return 'badge-candidate-master';
    if (rating >= 1600) return 'badge-expert';
    if (rating >= 1400) return 'badge-specialist';
    if (rating >= 1200) return 'badge-pupil';
    return 'badge-newbie';
  }

  /**
   * Apply stats to DOM elements safely
   */
  function applyStatsToDOM(stats) {
    if (!stats) return;

    // 1. Codeforces Rating
    const ratingEl = document.getElementById('cf-rating-val');
    if (ratingEl && stats.cfRating) {
      if (window.animateCounter) {
        window.animateCounter(ratingEl, stats.cfRating);
      } else {
        ratingEl.textContent = stats.cfRating.toLocaleString();
      }
    }

    // 2. Codeforces Rank Badge
    const rankBadgeEl = document.getElementById('cf-rating-badge');
    if (rankBadgeEl && stats.cfRank && stats.cfRating) {
      const safeRankText = stats.cfRank.replace(/[^a-zA-Z\s\-]/g, '').toUpperCase();
      rankBadgeEl.textContent = safeRankText;
      rankBadgeEl.className = `cf-metric-badge ${getRankBadgeClass(stats.cfRating)}`;
    }

    // 3. Codeforces Peak Rating
    const peakEl = document.getElementById('cf-peak-val');
    if (peakEl && stats.cfPeakRating) {
      if (window.animateCounter) {
        window.animateCounter(peakEl, stats.cfPeakRating);
      } else {
        peakEl.textContent = stats.cfPeakRating.toLocaleString();
      }
    }

    // 4. Codeforces Peak Badge
    const peakBadgeEl = document.getElementById('cf-peak-badge');
    if (peakBadgeEl && stats.cfPeakRating) {
      peakBadgeEl.textContent = `PEAK ${stats.cfPeakRating}`;
    }

    // 5. Codeforces Problems Solved
    const solvedEl = document.getElementById('cf-solved-val');
    const heatmapSolvedAlltime = document.getElementById('cf-heatmap-solved-alltime');
    const heatmapSolvedYear = document.getElementById('cf-heatmap-solved-year');
    if (solvedEl && stats.cfSolved) {
      if (window.animateCounter) {
        window.animateCounter(solvedEl, stats.cfSolved);
        if (heatmapSolvedAlltime) window.animateCounter(heatmapSolvedAlltime, stats.cfSolved);
        if (heatmapSolvedYear) window.animateCounter(heatmapSolvedYear, stats.cfSolved);
      } else {
        solvedEl.textContent = stats.cfSolved.toLocaleString();
        if (heatmapSolvedAlltime) heatmapSolvedAlltime.textContent = stats.cfSolved.toLocaleString();
        if (heatmapSolvedYear) heatmapSolvedYear.textContent = stats.cfSolved.toLocaleString();
      }
    }

    // 6. Codeforces Contests Attended
    const contestsEl = document.getElementById('cf-contests-val');
    if (contestsEl && stats.cfContests) {
      if (window.animateCounter) {
        window.animateCounter(contestsEl, stats.cfContests);
      } else {
        contestsEl.textContent = stats.cfContests.toLocaleString();
      }
    }

    // 7. GitHub Public Repositories
    const reposEl = document.getElementById('github-repos-val');
    if (reposEl && stats.ghRepos) {
      reposEl.textContent = `${stats.ghRepos} REPOS`;
    }

    // 8. Codeforces Problem Taxonomy Tags Donut Chart
    if (stats.cfTags && typeof window.updateCodeforcesTagsChart === 'function') {
      window.updateCodeforcesTagsChart(stats.cfTags, stats.cfUniqueSolved || 21, stats.cfTagProblems);
    }

    // 9. Stream entry to diagnostic log feed if available
    if (typeof window.PortfolioAppState !== 'undefined' && window.PortfolioAppState.appendLog) {
      window.PortfolioAppState.appendLog('SYNC', `Live telemetry applied (CF: ${stats.cfRating}, Solved: ${stats.cfSolved}, Tags: ${Object.keys(stats.cfTags || {}).length})`);
    }
  }

  /**
   * Load stats from LocalStorage Cache
   */
  function loadFromCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (!cached || !cached.timestamp || !cached.data) return null;

      const age = Date.now() - cached.timestamp;
      if (age < CACHE_TTL_MS) {
        return cached.data;
      }
    } catch (e) {
      // Ignore parse or storage errors
    }
    return null;
  }

  /**
   * Save stats to LocalStorage Cache
   */
  function saveToCache(stats) {
    try {
      const payload = {
        timestamp: Date.now(),
        data: stats
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (e) {
      // Storage quota or privacy restriction
    }
  }

  /**
   * Fetch Live Codeforces Data
   */
  async function fetchCodeforcesData() {
    const result = {};

    // 1. user.info
    try {
      const infoData = await safeFetchJson(`https://codeforces.com/api/user.info?handles=${CF_HANDLE}`);
      if (infoData && infoData.status === 'OK' && Array.isArray(infoData.result) && infoData.result.length > 0) {
        const u = infoData.result[0];
        const rating = parseInt(u.rating, 10);
        const maxRating = parseInt(u.maxRating, 10);
        if (!isNaN(rating) && rating > 0) result.cfRating = rating;
        if (!isNaN(maxRating) && maxRating > 0) result.cfPeakRating = maxRating;
        if (typeof u.rank === 'string') result.cfRank = u.rank;
        if (typeof u.maxRank === 'string') result.cfMaxRank = u.maxRank;
      }
    } catch (e) {
      // Silent fallback
    }

    // 2. user.rating (contests attended)
    try {
      const ratingData = await safeFetchJson(`https://codeforces.com/api/user.rating?handle=${CF_HANDLE}`);
      if (ratingData && ratingData.status === 'OK' && Array.isArray(ratingData.result)) {
        result.cfContests = ratingData.result.length;
      }
    } catch (e) {
      // Silent fallback
    }

    // 3. user.status (solved problems & problem taxonomy tags)
    try {
      const statusData = await safeFetchJson(`https://codeforces.com/api/user.status?handle=${CF_HANDLE}&from=1&count=2000`);
      if (statusData && statusData.status === 'OK' && Array.isArray(statusData.result)) {
        const solvedSet = new Set();
        const tagCounts = Object.create(null);
        const tagProblems = Object.create(null);

        statusData.result.forEach((sub) => {
          if (sub.verdict === 'OK' && sub.problem) {
            const id = sub.problem.contestId
              ? `${sub.problem.contestId}_${sub.problem.index}`
              : sub.problem.name;
            if (id && !solvedSet.has(id)) {
              solvedSet.add(id);
              const pItem = {
                id: sub.problem.contestId && sub.problem.index ? `${sub.problem.contestId}${sub.problem.index}` : sub.problem.name,
                name: sub.problem.name,
                rating: sub.problem.rating || 800,
                url: sub.problem.contestId && sub.problem.index ? `https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}` : '#'
              };
              if (Array.isArray(sub.problem.tags)) {
                sub.problem.tags.forEach((rawTag) => {
                  if (typeof rawTag === 'string' || typeof rawTag === 'number') {
                    const tag = String(rawTag).replace(/[^a-zA-Z0-9\s*+\-_]/g, '').trim();
                    if (tag && tag !== '__proto__' && tag !== 'constructor' && tag !== 'prototype') {
                      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                      if (!tagProblems[tag]) tagProblems[tag] = [];
                      tagProblems[tag].push(pItem);
                    }
                  }
                });
              }
            }
          }
        });

        // Guarantee monotonicity: never display less than verified baseline
        result.cfSolved = Math.max(BASELINE_STATS.cfSolved, solvedSet.size);
        result.cfUniqueSolved = Math.max(BASELINE_STATS.cfUniqueSolved, solvedSet.size);
        if (Object.keys(tagCounts).length > 0) {
          result.cfTags = tagCounts;
          result.cfTagProblems = tagProblems;
        }
      }
    } catch (e) {
      // Silent fallback
    }

    return result;
  }

  /**
   * Fetch Live GitHub Data
   */
  async function fetchGitHubData() {
    const result = {};
    try {
      const ghData = await safeFetchJson(`https://api.github.com/users/${GH_HANDLE}`);
      if (ghData && typeof ghData.public_repos === 'number') {
        result.ghRepos = Math.max(BASELINE_STATS.ghRepos, ghData.public_repos);
      }
    } catch (e) {
      // Silent fallback
    }
    return result;
  }

  /**
   * Main Synchronization Controller
   */
  async function syncMetrics() {
    // 1. Check local cache first for instant update
    const cachedStats = loadFromCache();
    if (cachedStats) {
      applyStatsToDOM(cachedStats);
      return;
    }

    // 2. Otherwise run asynchronous background fetch
    try {
      const [cfStats, ghStats] = await Promise.allSettled([
        fetchCodeforcesData(),
        fetchGitHubData()
      ]);

      const mergedStats = {
        ...BASELINE_STATS,
        ...(cfStats.status === 'fulfilled' ? cfStats.value : {}),
        ...(ghStats.status === 'fulfilled' ? ghStats.value : {})
      };

      // Apply to UI
      applyStatsToDOM(mergedStats);

      // Save valid payload to cache
      saveToCache(mergedStats);
    } catch (err) {
      // On network failure, baseline numbers already in HTML remain visible
    }
  }

  // Initialize via requestIdleCallback to guarantee zero competition with critical path
  function scheduleSync() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => syncMetrics(), { timeout: 3500 });
    } else {
      setTimeout(syncMetrics, 2000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleSync);
  } else {
    scheduleSync();
  }

  // Expose test hooks for automated verification
  window.__OmarPortfolioLiveStats = {
    syncMetrics,
    applyStatsToDOM,
    loadFromCache,
    saveToCache,
    BASELINE_STATS
  };
})();
