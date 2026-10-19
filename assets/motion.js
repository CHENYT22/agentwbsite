(() => {
  const gallery = document.querySelector('[data-motion-gallery]');
  const button = document.querySelector('[data-motion-toggle]');
  if (!gallery || !button) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let userPaused = false;

  function update() {
    const playing = visible && !document.hidden && !reducedMotion.matches && !userPaused;
    gallery.classList.toggle('is-playing', playing);
    button.textContent = userPaused ? '播放演示' : '暂停演示';
    button.setAttribute('aria-label', userPaused ? '播放六种滚动动效演示' : '暂停六种滚动动效演示');
  }

  button.addEventListener('click', () => {
    userPaused = !userPaused;
    update();
  });
  document.addEventListener('visibilitychange', update);
  reducedMotion.addEventListener?.('change', update);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      update();
    }, { threshold: 0.02 }).observe(gallery);
  } else {
    visible = true;
    update();
  }
})();
