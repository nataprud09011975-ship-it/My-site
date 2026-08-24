/* Reviews carousel — одна карточка за раз, без GSAP */
function initReviewsStack(container) {
  if (!container) return null;

  const cards = [...container.querySelectorAll('.review-card')];
  const prevBtn = container.querySelector('[data-reviews-prev]');
  const nextBtn = container.querySelector('[data-reviews-next]');
  const dotsWrap = container.querySelector('[data-reviews-dots]');
  const counterEl = container.querySelector('[data-reviews-counter]');

  if (!cards.length) return null;

  const count = cards.length;
  let activeIndex = 0;
  let isAnimating = false;

  function updateUI() {
    if (counterEl) {
      counterEl.textContent = `${activeIndex + 1} / ${count}`;
    }
    if (dotsWrap) {
      dotsWrap.querySelectorAll('[data-reviews-dot]').forEach((dot, i) => {
        dot.classList.toggle('is-active', i === activeIndex);
        dot.setAttribute('aria-current', i === activeIndex ? 'true' : 'false');
      });
    }
  }

  function setActive(index) {
    const next = ((index % count) + count) % count;
    if (next === activeIndex || isAnimating) return;

    isAnimating = true;
    const prev = activeIndex;
    activeIndex = next;

    cards[prev].classList.remove('is-active');
    cards[prev].classList.add('is-leaving');

    cards[activeIndex].classList.remove('is-leaving');
    cards[activeIndex].classList.add('is-active');

    cards.forEach((card, i) => {
      card.setAttribute('aria-hidden', i === activeIndex ? 'false' : 'true');
    });

    updateUI();

    window.setTimeout(() => {
      cards[prev].classList.remove('is-leaving');
      isAnimating = false;
    }, 520);
  }

  function goNext() {
    setActive(activeIndex + 1);
  }

  function goPrev() {
    setActive(activeIndex - 1);
  }

  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'reviews-nav__dot';
      dot.dataset.reviewsDot = '';
      dot.setAttribute('aria-label', `Отзыв ${i + 1}`);
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        setActive(i);
      });
      dotsWrap.appendChild(dot);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goPrev();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goNext();
    });
  }

  const cardsWrap = container.querySelector('.reviews-cards');
  if (cardsWrap) {
    let touchStartX = 0;
    cardsWrap.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    cardsWrap.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) < 50) return;
      if (diff < 0) goNext();
      else goPrev();
    }, { passive: true });
  }

  container.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    }
  });

  cards.forEach((card, i) => {
    card.classList.toggle('is-active', i === 0);
    card.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
  });
  updateUI();

  return { setActive, goNext, goPrev };
}

(function bootReviews() {
  function start() {
    const container = document.getElementById('reviewsScroll');
    if (container && !container.dataset.reviewsReady) {
      container.dataset.reviewsReady = 'true';
      initReviewsStack(container);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
