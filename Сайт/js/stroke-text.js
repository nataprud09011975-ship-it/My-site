/* StrokeText — vanilla port (react-bits / GSAP) */
(function () {
  let uid = 0;

  function parseLines(el) {
    return el.innerHTML
      .split(/<br\s*\/?>/gi)
      .map((part) => part.replace(/<[^>]*>/g, '').trim())
      .filter(Boolean);
  }

  function parseLetterSpacing(value, fontSize) {
    if (!value || value === 'normal') return 0;
    if (value.endsWith('px')) return parseFloat(value);
    if (value.endsWith('em')) return parseFloat(value) * fontSize;
    return parseFloat(value) || 0;
  }

  function createStrokeText(root, options) {
    const lines = parseLines(root);
    const ariaLabel = lines.join(' ');
    const computed = window.getComputedStyle(root);
    const fontSize = parseFloat(computed.fontSize) || 32;
    const fontWeight = computed.fontWeight || '300';
    const letterSpacing = parseLetterSpacing(computed.letterSpacing, fontSize);
    const lineHeight = parseFloat(computed.lineHeight) || fontSize * 1.2;
    const lineStep = lineHeight / fontSize;
    const preserveAspect = computed.textAlign === 'center' ? 'xMidYMid meet' : 'xMinYMid meet';

    const {
      strokeColor = '#9a7b4f',
      fillColor = '#f6f4f0',
      strokeWidth = 1.3,
      drawDuration = 1.6,
      fillDelay = 0.2,
      stagger = 0.05,
      ease = 'power2.out',
      trigger = 'scroll',
      fillMode = 'wipe',
      reverse = false,
      playDelay = 0
    } = options;

    const dash = Math.max(fontSize * 7, 200);
    const id = `stroke-text-wipe-${++uid}`;
    const fontStyle = `font-size:${fontSize}px;font-weight:${fontWeight};letter-spacing:${letterSpacing}px`;

    const wrapper = document.createElement('span');
    wrapper.className = `stroke-text${trigger === 'hover' ? ' stroke-text--hover' : ''}`;
    wrapper.setAttribute('role', 'img');
    wrapper.setAttribute('aria-label', ariaLabel);
    wrapper.style.setProperty('--stroke-text-height', `${Math.round(fontSize * lineStep * lines.length * 1.05)}px`);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'stroke-text__svg');
    svg.setAttribute('preserveAspectRatio', preserveAspect);
    svg.setAttribute('aria-hidden', 'true');

    const strokeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    strokeText.setAttribute('class', 'stroke-text__stroke');
    strokeText.setAttribute('x', '0');
    strokeText.setAttribute('y', '0');
    strokeText.setAttribute('fill', 'none');
    strokeText.setAttribute('stroke', strokeColor);
    strokeText.setAttribute('stroke-width', String(strokeWidth));
    strokeText.setAttribute('stroke-linejoin', 'round');
    strokeText.setAttribute('stroke-linecap', 'round');
    strokeText.setAttribute('style', fontStyle);

    const fillText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    fillText.setAttribute('class', 'stroke-text__fill');
    fillText.setAttribute('x', '0');
    fillText.setAttribute('y', '0');
    fillText.setAttribute('fill', fillColor);
    fillText.setAttribute('stroke', 'none');
    fillText.setAttribute('style', fontStyle);

    lines.forEach((line, lineIndex) => {
      Array.from(line).forEach((char, charIndex) => {
        const strokeSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        strokeSpan.setAttribute('data-stroke-char', '');
        if (charIndex === 0) {
          strokeSpan.setAttribute('x', '0');
          strokeSpan.setAttribute('dy', lineIndex === 0 ? '0' : `${lineStep}em`);
        }
        strokeSpan.textContent = char;
        strokeText.appendChild(strokeSpan);

        const fillSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        fillSpan.setAttribute('data-fill-char', '');
        if (charIndex === 0) {
          fillSpan.setAttribute('x', '0');
          fillSpan.setAttribute('dy', lineIndex === 0 ? '0' : `${lineStep}em`);
        }
        fillSpan.textContent = char;
        fillText.appendChild(fillSpan);
      });
    });

    svg.appendChild(strokeText);
    svg.appendChild(fillText);
    wrapper.appendChild(svg);

    root.textContent = '';
    root.classList.add('has-stroke-text');
    root.appendChild(wrapper);

    let wipeRect = null;
    let box = null;

    function measure() {
      let bbox;
      try {
        bbox = strokeText.getBBox();
      } catch {
        return;
      }
      if (!bbox || !bbox.width) return;

      const pad = Math.max(Number(strokeWidth) || 1, fontSize * 0.1);
      box = {
        x: bbox.x - pad,
        y: bbox.y - pad,
        width: bbox.width + pad * 2,
        height: bbox.height + pad * 2
      };

      svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);

      if (fillMode === 'wipe') {
        if (!wipeRect) {
          const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
          clipPath.setAttribute('id', id);
          clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
          wipeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          wipeRect.setAttribute('x', String(box.x));
          wipeRect.setAttribute('y', String(box.y));
          wipeRect.setAttribute('width', '0');
          wipeRect.setAttribute('height', String(box.height));
          clipPath.appendChild(wipeRect);
          defs.appendChild(clipPath);
          svg.insertBefore(defs, strokeText);
          fillText.setAttribute('clip-path', `url(#${id})`);
        } else {
          wipeRect.setAttribute('x', String(box.x));
          wipeRect.setAttribute('y', String(box.y));
          wipeRect.setAttribute('height', String(box.height));
        }
      }
    }

    function setupAnimation() {
      if (typeof gsap === 'undefined' || !box) return null;

      const strokes = wrapper.querySelectorAll('[data-stroke-char]');
      const fills = wrapper.querySelectorAll('[data-fill-char]');
      const fillEnabled = fillMode !== 'none';
      const useWipe = fillEnabled && fillMode === 'wipe';
      const fillDuration = Math.max(0.4, drawDuration * 0.5);
      const staggerConfig = reverse ? { each: stagger, from: 'end' } : stagger;
      const targets = [...strokes, ...fills, wipeRect].filter(Boolean);

      const setStart = () => {
        gsap.killTweensOf(targets);
        gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: dash });
        gsap.set(fills, { opacity: useWipe ? 1 : 0 });
        if (wipeRect) gsap.set(wipeRect, { attr: { width: 0 } });
      };

      const setEnd = () => {
        gsap.killTweensOf(targets);
        gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: 0 });
        gsap.set(fills, { opacity: fillEnabled ? 1 : 0 });
        if (wipeRect) gsap.set(wipeRect, { attr: { width: fillEnabled ? box.width : 0 } });
      };

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setEnd();
        return { kill() {} };
      }

      const build = () => {
        setStart();
        const tl = gsap.timeline({
          paused: true,
          defaults: { overwrite: 'auto' }
        });

        tl.to(
          strokes,
          { strokeDashoffset: 0, duration: drawDuration, ease, stagger: staggerConfig },
          0
        );

        if (useWipe && wipeRect) {
          tl.to(
            wipeRect,
            { attr: { width: box.width }, duration: fillDuration, ease: 'power2.inOut' },
            drawDuration + fillDelay
          );
        } else if (fillEnabled) {
          tl.to(
            fills,
            { opacity: 1, duration: fillDuration, ease: 'power2.out', stagger: staggerConfig },
            drawDuration + fillDelay
          );
        }

        return tl;
      };

      let timeline = null;
      let scrollTrigger = null;

      if (trigger === 'hover') {
        setEnd();
        const play = () => {
          timeline?.kill();
          timeline = build();
          timeline.play(0);
        };
        wrapper.addEventListener('pointerenter', play);
        return {
          kill() {
            wrapper.removeEventListener('pointerenter', play);
            scrollTrigger?.kill();
            timeline?.kill();
            gsap.killTweensOf(targets);
          }
        };
      }

      timeline = build();

      if (trigger === 'scroll' && typeof ScrollTrigger !== 'undefined') {
        scrollTrigger = ScrollTrigger.create({
          trigger: root,
          start: 'top 82%',
          once: true,
          onEnter: () => timeline?.play(0)
        });
      } else {
        timeline.delay(playDelay).play(0);
      }

      return {
        kill() {
          scrollTrigger?.kill();
          timeline?.kill();
          gsap.killTweensOf(targets);
        }
      };
    }

    let controller = null;
    let animated = false;

    const run = (startAnimation) => {
      measure();
      if (!box || !startAnimation || animated) return;
      controller?.kill();
      controller = setupAnimation();
      animated = true;
    };

    run(true);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => run(true)).catch(() => {});
    }

    return {
      kill() {
        controller?.kill();
      }
    };
  }

  window.initStrokeText = function (selector, options) {
    const nodes = document.querySelectorAll(selector);
    const instances = [];

    nodes.forEach((node) => {
      if (node.dataset.strokeTextReady) return;
      node.dataset.strokeTextReady = 'true';
      instances.push(createStrokeText(node, options || {}));
    });

    return instances;
  };
})();
