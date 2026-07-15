/**
 * NOVA Nourish Foundation — Shared JavaScript
 * Handles: Navigation, Scroll Effects, Animations, Toast
 */

/* ============================================================
   NAVIGATION
   ============================================================ */
(function initNav() {
  const nav = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.nav-mobile-menu');

  // Scroll effect
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // Mobile menu toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
  }

  // Mark active link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .nav-mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPath)) {
      link.classList.add('active');
    }
  });
})();

/* ============================================================
   SCROLL ANIMATIONS (Intersection Observer)
   ============================================================ */
(function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Don't unobserve — keep visible
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  // Animated counters
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-counter]').forEach(el => counterObserver.observe(el));
})();

function animateCounter(el) {
  const target = parseFloat(el.dataset.counter);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * ease * 10) / 10;
    el.textContent = prefix + (Number.isInteger(current) ? current : current.toFixed(1)) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* ============================================================
   PROGRESS BAR ANIMATION
   ============================================================ */
(function initProgressBars() {
  const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const width = bar.dataset.width || '0%';
        setTimeout(() => { bar.style.width = width; }, 100);
        progressObserver.unobserve(bar);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.progress-bar[data-width]').forEach(bar => {
    bar.style.width = '0%';
    progressObserver.observe(bar);
  });
})();

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function showToast(message, duration = 3000) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ============================================================
   NEWSLETTER FORM
   ============================================================ */
(function initNewsletter() {
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input && input.value) {
        showToast('🎉 Thank you for subscribing!');
        input.value = '';
      }
    });
  });
})();

/* ============================================================
   DONATION BUTTON
   ============================================================ */
(function initDonation() {
  document.querySelectorAll('[data-donate]').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('🙏 Redirecting to donation portal...');
    });
  });
})();

/* ============================================================
   SMOOTH ANCHOR SCROLL
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ============================================================
   LAZY LOAD IMAGES
   ============================================================ */
(function initLazyLoad() {
  if ('loading' in HTMLImageElement.prototype) return;
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        imageObserver.unobserve(img);
      }
    });
  });
  document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
})();
