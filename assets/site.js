/* 教程站交互：阅读进度条 + 移动端侧边栏抽屉 */
(function () {
  'use strict';

  /* --- 阅读进度条 --- */
  var bar = document.getElementById('progressBar');
  if (bar) {
    var tick = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, p)) + '%';
    };
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }

  /* --- 移动端侧边栏 --- */
  var sidebar = document.getElementById('sidebar');
  var toggle = document.getElementById('navToggle');
  var scrim = document.getElementById('sidebarScrim');

  function close() {
    if (sidebar) sidebar.classList.remove('is-open');
    if (scrim) scrim.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  function open() {
    if (sidebar) sidebar.classList.add('is-open');
    if (scrim) scrim.classList.add('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }

  if (toggle && sidebar) {
    toggle.addEventListener('click', function () {
      sidebar.classList.contains('is-open') ? close() : open();
    });
  }
  if (scrim) scrim.addEventListener('click', close);
  if (sidebar) {
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });

  /* --- 键盘左右方向键翻章 --- */
  var prev = document.querySelector('.pager-link.prev:not(.empty)');
  var next = document.querySelector('.pager-link.next:not(.empty)');
  var typing = ['INPUT', 'TEXTAREA', 'SELECT'];
  document.addEventListener('keydown', function (e) {
    if (typing.indexOf(document.activeElement.tagName) > -1) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowLeft' && prev) location.href = prev.getAttribute('href');
    if (e.key === 'ArrowRight' && next) location.href = next.getAttribute('href');
  });
})();
