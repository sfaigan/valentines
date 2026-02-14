(() => {
  const envelope = document.getElementById('envelope');
  const letter = document.getElementById('letter');
  const noButtonContainer = document.querySelector('.no-button-wrapper');
  const noButton = document.getElementById('no-button');
  const yesButton = document.getElementById('yes-button');
  const heading = document.getElementById('heading');
  const yesLabel = document.getElementById('yes-label');
  const noLabel = document.getElementById('no-label');

  let isOpen = false;
  let isPulledOut = false;

  function openEnvelope() {
    if (isOpen) return;
    isOpen = true;

    envelope.classList.remove('close');
    envelope.classList.add('open');

    letter.classList.remove('pulled-out', 'bouncing', 'opening');
    void letter.offsetWidth; // retrigger animation reliably
    letter.classList.add('opening');
  }

  envelope.addEventListener('click', openEnvelope);

  letter.addEventListener('animationend', (e) => {
    if (e.animationName === 'slideUpAfterFlap' && envelope.classList.contains('open') && !isPulledOut) {
      letter.classList.remove('opening');
      letter.classList.add('bouncing');
    }
  });

  letter.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isOpen || isPulledOut) return;

    isPulledOut = true;
    letter.classList.remove('opening', 'bouncing');
    letter.classList.add('pulled-out');
  });

  // --------------------------------
  // Fireworks + celebration behavior
  // --------------------------------
  let _fwCanvas = null;
  let _fwCtx = null;
  const _fwParticles = [];
  let _fwAnimating = false;
  const FW_MAX_PARTICLES = 700;

  function _ensureFwCanvas() {
    if (_fwCanvas) return;
    _fwCanvas = document.createElement('canvas');
    _fwCanvas.className = 'fireworks-canvas';
    _fwCtx = _fwCanvas.getContext('2d');
    document.body.appendChild(_fwCanvas);

    function resize() {
      _fwCanvas.width = window.innerWidth;
      _fwCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
  }

  function _fwAnimate(now) {
    if (!_fwAnimating) return;
    _fwAnimate._last = _fwAnimate._last || now;
    const dt = Math.min(48, now - _fwAnimate._last);
    _fwAnimate._last = now;

    const ctx = _fwCtx;
    ctx.clearRect(0, 0, _fwCanvas.width, _fwCanvas.height);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = _fwParticles.length - 1; i >= 0; i--) {
      const p = _fwParticles[i];
      p.ttl += dt;
      if (p.ttl >= p.life) {
        _fwParticles.splice(i, 1);
        continue;
      }

      p.vy += 0.025 * (dt / 16);
      p.vx *= 0.997;
      p.vy *= 0.997;
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);

      const alpha = 1 - p.ttl / p.life;
      const brightAlpha = Math.min(1, alpha * 2.0);

      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.shadowBlur = Math.max(4, p.size * 4);
      ctx.shadowColor = p.color;
      ctx.globalAlpha = brightAlpha * 0.9;
      ctx.arc(p.x, p.y, p.size * 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = brightAlpha;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.globalAlpha = Math.min(1, brightAlpha * 0.6);
      ctx.arc(p.x, p.y, Math.max(0.35, p.size * 0.32), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.globalCompositeOperation = 'source-over';

    if (_fwParticles.length > 0) {
      requestAnimationFrame(_fwAnimate);
    } else {
      _fwAnimating = false;
      _fwAnimate._last = 0;
      ctx.clearRect(0, 0, _fwCanvas.width, _fwCanvas.height);
    }
  }

  function spawnFireworkFast(cx, cy) {
    _ensureFwCanvas();
    const colors = ['#ffffff', '#ff5b9a', '#ff69b4', '#ffd1dc', '#ff8ab8', '#fff176', '#ffd54a'];
    let count = Math.floor(Math.random() * 40) + 40;

    const available = Math.max(0, FW_MAX_PARTICLES - _fwParticles.length);
    if (available <= 0) return;
    count = Math.min(count, available);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      _fwParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: Math.random() * 700 + 400,
        ttl: 0,
        size: Math.random() * 1.2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    if (!_fwAnimating) {
      _fwAnimating = true;
      requestAnimationFrame(_fwAnimate);
    }
  }

  let _showInterval = null;
  function startFireworkShow() {
    if (_showInterval) return;
    spawnFireworkFast(Math.random() * window.innerWidth, Math.random() * (window.innerHeight * 0.6));
    _showInterval = setInterval(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * (window.innerHeight * 0.7);
      spawnFireworkFast(x, y);
    }, 600);
  }

  yesButton.addEventListener('click', () => {
    if (yesLabel.textContent === 'No') {
      heading.textContent = 'Will you be my Valentine?';
      yesLabel.textContent = 'Yes';
      noLabel.textContent = 'No';
      return;
    }

    if (yesLabel.textContent === 'Yes') {
      if (document.body.classList.contains('celebrating')) return;
      document.body.classList.add('celebrating', 'fireworks-dim');

      envelope.classList.add('fade-away');
      letter.classList.add('fade-away');
      yesButton.classList.add('fade-away');
      noButton.classList.add('fade-away');

      let started = false;
      function startShow() {
        if (started) return;
        started = true;
        document.body.classList.add('fireworks-only');
        const r = letter.getBoundingClientRect();
        spawnFireworkFast(r.left + r.width / 2, r.top + Math.max(40, r.height * 0.18));
        startFireworkShow();
      }

      function onFadeEnd(e) {
        if (e.propertyName !== 'opacity') return;
        letter.removeEventListener('transitionend', onFadeEnd);
        startShow();
      }

      letter.addEventListener('transitionend', onFadeEnd);
      setTimeout(startShow, 750);
    }
  });

  noButtonContainer.addEventListener('mouseover', (event) => {
    if (!letter.classList.contains('pulled-out')) return;

    const x = Math.random() * 100 - 10;
    const y = Math.random() * 100 - 10;
    noButtonContainer.style.position = 'absolute';
    noButtonContainer.style.right = `${x}%`;
    noButtonContainer.style.bottom = `${y}%`;

    const rect = noButtonContainer.getBoundingClientRect();
    if (
      rect.left < event.clientX &&
      rect.right > event.clientX &&
      rect.top < event.clientY &&
      rect.bottom > event.clientY
    ) {
      noButtonContainer.dispatchEvent(new Event('mouseover'));
    }
  });

  noButton.addEventListener('click', () => {
    heading.textContent = 'Are you sure?';
    yesLabel.textContent = 'No';
    noLabel.textContent = 'Yes';
    noButtonContainer.dispatchEvent(new Event('mouseover'));

    const resetHandler = () => {
      heading.textContent = 'Will you be my Valentine?';
      yesLabel.textContent = 'Yes';
      noLabel.textContent = 'No';
      yesButton.removeEventListener('click', resetHandler);
    };

    yesButton.addEventListener('click', resetHandler);
  });
})();
