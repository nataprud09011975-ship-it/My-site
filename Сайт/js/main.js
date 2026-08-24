const header = document.getElementById('header');
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');

if (header) {
  const onScroll = () => {
    header.classList.toggle('header--scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

if (menuBtn && nav) {
  const closeMenu = () => {
    menuBtn.classList.remove('is-open');
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  menuBtn.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    menuBtn.classList.toggle('is-open', open);
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
);

document.querySelectorAll('.reveal, .fade-up').forEach((el) => {
  revealObserver.observe(el);
});

document.querySelectorAll(
  '.section__head, .project-card, .skills__card, .approach__step, .why__grid, .audience__inner, .manifest__quote, .reviews__head, .cta__inner, .contact__inner, .about__photo, .about__content'
).forEach((el) => {
  el.classList.add('fade-up');
  revealObserver.observe(el);
});

const syncProjectView = () => {
  const opened = document.querySelector('.project-detail:target');
  const work = document.getElementById('work');
  if (opened && work) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    work.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
};

window.addEventListener('hashchange', syncProjectView);
if (window.location.hash.startsWith('#project-')) {
  syncProjectView();
}

const splashMount = document.getElementById('splash-cursor');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (splashMount && typeof initSplashCursor === 'function' && !prefersReducedMotion) {
  const isMobile = window.innerWidth < 768;
  initSplashCursor(splashMount, {
    DENSITY_DISSIPATION: 10,
    VELOCITY_DISSIPATION: 1,
    PRESSURE: 0.05,
    CURL: 2,
    SPLAT_RADIUS: 0.06,
    SPLAT_FORCE: 2000,
    COLOR_UPDATE_SPEED: 29,
    SHADING: true,
    RAINBOW_MODE: false,
    COLOR: '#F97316',
    DYE_RESOLUTION: isMobile ? 720 : 1440,
    SIM_RESOLUTION: isMobile ? 96 : 128
  });
}

const strokeTextOptions = {
  strokeColor: '#9a7b4f',
  fillColor: '#f6f4f0',
  strokeWidth: 1.3,
  drawDuration: 1.6,
  fillDelay: 0.2,
  stagger: 0.05,
  ease: 'power2.out',
  fillMode: 'wipe'
};

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  if (typeof initStrokeText === 'function') {
    initStrokeText('.hero__title', {
      ...strokeTextOptions,
      trigger: 'mount',
      playDelay: 0.5
    });

    initStrokeText('.section__title, .cta__title, .contact__title', {
      ...strokeTextOptions,
      trigger: 'scroll'
    });
  }
}
