(() => {
  'use strict';

  const section = document.querySelector('#responsive-layout');
  if (!section) return;

  const preview = section.querySelector('[data-responsive-preview]');
  const caption = section.querySelector('[data-responsive-caption]');
  const buttons = [...section.querySelectorAll('[data-responsive-view]')];
  const descriptions = {
    desktop: '电脑：导航展开，作品并排展示。',
    mobile: '手机：导航收起，作品改为单列。'
  };

  buttons.forEach(button => button.addEventListener('click', () => {
    const view = button.dataset.responsiveView;
    preview.dataset.view = view;
    caption.textContent = descriptions[view];
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));
})();
