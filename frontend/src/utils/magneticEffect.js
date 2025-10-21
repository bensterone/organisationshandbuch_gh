export function enableMagneticEffect() {
  document.querySelectorAll('.magnetic-link, .magnetic-button').forEach((el) => {
    const glow = el.querySelector('.magnetic-glow');

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const moveX = (x - rect.width / 2) * 0.12;
      const moveY = (y - rect.height / 2) * 0.12;

      el.style.transform = `scale(1.05) translate(${moveX}px, ${moveY}px)`;

      if (glow) {
        glow.style.transform = `translate(${moveX * -0.5}px, ${moveY * -0.5}px)`;
      }
    });

    el.addEventListener('mouseenter', () => el.classList.add('active'));
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      if (glow) glow.style.transform = 'translate(0,0)';
      el.classList.remove('active');
    });
  });
}

export function enableMagneticEffect() {
  document.querySelectorAll('.magnetic-link, .magnetic-button, .magnetic-nav').forEach((el) => {
    const glow = el.querySelector('.magnetic-glow');

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const moveX = (x - rect.width / 2) * 0.12;
      const moveY = (y - rect.height / 2) * 0.12;

      el.style.transform = `scale(1.05) translate(${moveX}px, ${moveY}px)`;

      if (glow) glow.style.transform = `translate(${moveX * -0.5}px, ${moveY * -0.5}px)`;
    });

    el.addEventListener('mouseenter', () => el.classList.add('active'));
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      if (glow) glow.style.transform = 'translate(0,0)';
      el.classList.remove('active');
    });
  });
}
