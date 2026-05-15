/* ============================================================
   DEEP FIELD — script.js
   Interactions, Scroll Logic & Visual Effects
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   1. STARFIELD — Procedural canvas star background
   ───────────────────────────────────────────────────────────── */
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, stars = [];
  let rafId = null;

  /* Resize canvas to full viewport */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* Create a single star descriptor */
  function makeStar() {
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.1 + 0.15,          // radius 0.15–1.25px
      phase: Math.random() * Math.PI * 2,           // twinkle offset
      speed: Math.random() * 0.0025 + 0.0008,       // twinkle speed
    };
  }

  /* Populate star array proportional to screen area */
  function buildStars() {
    const count = Math.min(Math.round((W * H) / 5800), 340);
    stars = Array.from({ length: count }, makeStar);
  }

  /* Render loop — timestamp in ms for twinkle calc */
  function render(t) {
    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      // Sine-based alpha oscillation
      const alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(s.phase + t * s.speed));

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210, 228, 255, ${alpha.toFixed(3)})`;
      ctx.fill();
    }

    rafId = requestAnimationFrame(render);
  }

  /* Handle window resize — debounced */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      buildStars();
    }, 200);
  }, { passive: true });

  /* Boot */
  resize();
  buildStars();
  rafId = requestAnimationFrame(render);
})();


/* ─────────────────────────────────────────────────────────────
   2. HEADER — Glassmorphism on scroll
   ───────────────────────────────────────────────────────────── */
(function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  let ticking = false;

  function update() {
    header.classList.toggle('scrolled', window.scrollY > 24);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  /* Run once on load in case page starts mid-scroll */
  update();
})();


/* ─────────────────────────────────────────────────────────────
   3. MOBILE NAV — Hamburger toggle
   ───────────────────────────────────────────────────────────── */
(function initMobileNav() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;

  function openMenu() {
    btn.classList.add('open');
    nav.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    nav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // prevent scroll-through
  }

  function closeMenu() {
    btn.classList.remove('open');
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    nav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    btn.classList.contains('open') ? closeMenu() : openMenu();
  });

  /* Close on any nav link click */
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  /* Close on Escape key */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && btn.classList.contains('open')) closeMenu();
  });

  /* Close when clicking outside the drawer */
  document.addEventListener('click', e => {
    if (
      btn.classList.contains('open') &&
      !nav.contains(e.target) &&
      !btn.contains(e.target)
    ) closeMenu();
  });
})();


/* ─────────────────────────────────────────────────────────────
   4. SCROLL REVEAL — IntersectionObserver for .reveal elements
   ───────────────────────────────────────────────────────────── */
(function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target); // fire once only
        }
      });
    },
    {
      threshold:  0.10,
      rootMargin: '0px 0px -55px 0px',
    }
  );

  items.forEach(el => observer.observe(el));
})();


/* ─────────────────────────────────────────────────────────────
   5. SMOOTH ANCHOR SCROLL — respects sticky header offset
   ───────────────────────────────────────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id     = link.getAttribute('href');
      const target = document.querySelector(id);
      if (!target || id === '#') return;

      e.preventDefault();

      const headerH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-h'),
        10
      ) || 72;

      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ─────────────────────────────────────────────────────────────
   6. CTA BUTTON — Shimmer ripple on mouse-enter
      Injects a transient element that expands and fades out
   ───────────────────────────────────────────────────────────── */
(function initCtaRipple() {
  document.querySelectorAll('.btn--cta').forEach(btn => {
    btn.addEventListener('mouseenter', function (e) {
      /* Remove any leftover ripple */
      this.querySelectorAll('.btn-ripple').forEach(r => r.remove());

      const rect   = this.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const ripple = document.createElement('span');

      ripple.className = 'btn-ripple';

      Object.assign(ripple.style, {
        position:     'absolute',
        borderRadius: '50%',
        background:   'rgba(255,255,255,0.22)',
        width:        '6px',
        height:       '6px',
        left:         `${x - 3}px`,
        top:          `${y - 3}px`,
        pointerEvents: 'none',
        transform:    'scale(0)',
        animation:    'ripple-expand 0.55s ease-out forwards',
      });

      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });
  });

  /* Inject keyframe into document if not already present */
  if (!document.getElementById('ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `
      @keyframes ripple-expand {
        to { transform: scale(30); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
})();


/* ─────────────────────────────────────────────────────────────
   7. SERVICE ITEMS — Stagger-in on first intersection
      Adds progressive delay to each row in the list
   ───────────────────────────────────────────────────────────── */
(function initServiceStagger() {
  const list = document.querySelector('.services__list');
  if (!list) return;

  const items = list.querySelectorAll('.service-item');

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        items.forEach((item, i) => {
          /* Override transition-delay for a staircase reveal */
          item.style.transitionDelay = `${i * 0.09}s`;
          item.classList.add('in-view');
        });
        observer.disconnect();
      }
    },
    { threshold: 0.1 }
  );

  observer.observe(list);
})();


/* ─────────────────────────────────────────────────────────────
   8. FOOTER YEAR — Dynamic copyright year
   ───────────────────────────────────────────────────────────── */
(function setYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();


/* ─────────────────────────────────────────────────────────────
   9. PERFORMANCE — Pause starfield when tab is hidden
   ───────────────────────────────────────────────────────────── */
(function initVisibilityOptimization() {
  /* The starfield RAF is self-contained above; we pause via
     canvas opacity to save GPU cycles when tab is backgrounded */
  const canvas = document.getElementById('starfield');
  if (!canvas) return;

  document.addEventListener('visibilitychange', () => {
    canvas.style.opacity = document.hidden ? '0' : '';
  });
})();
