/* 教程站交互 v2：进度条 + 滚动进场 + 折叠卡 + 选择器 + 复制 + 勾选清单 */
(function () {
  'use strict';

  /* --- 1. 阅读进度条（跟手，线性，无缓动） --- */
  var bar = document.getElementById('progressBar');
  if (bar) {
    var tick = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 100) + '%';
    };
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }

  /* --- 2. 滚动进场：卡片淡入上移，只播一次 --- */
  var rvs = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && rvs.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    rvs.forEach(function (el) { io.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add('in'); });
  }

  /* --- 3. 折叠解释卡：同一时间只展开一个（高度 JS 动态计算） --- */
  function pinFoldOpen(e) {
    if (e.propertyName !== 'max-height') return;
    var body = e.target;
    if (body.parentElement && body.parentElement.classList.contains('open')) {
      body.style.maxHeight = 'none'; /* 展开完成后解除上限，防窄屏/改字号后裁切 */
    }
  }
  document.querySelectorAll('[data-fold]').forEach(function (head) {
    head.addEventListener('click', function () {
      var item = head.closest('.fold');
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.fold.open').forEach(function (f) {
        var body = f.querySelector('.fold-body');
        if (body) {
          body.removeEventListener('transitionend', pinFoldOpen);
          if (body.style.maxHeight === 'none') {
            body.style.maxHeight = body.scrollHeight + 'px';
            void body.offsetHeight; /* 从实际高度回收，避免瞬间跳变 */
          }
          body.style.maxHeight = '0px';
        }
        f.classList.remove('open');
        var h = f.querySelector('[data-fold]');
        if (h) h.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('open');
        head.setAttribute('aria-expanded', 'true');
        var body = item.querySelector('.fold-body');
        if (body) {
          body.style.maxHeight = body.scrollHeight + 'px';
          body.addEventListener('transitionend', pinFoldOpen);
        }
      }
    });
  });

  /* --- 4. 选择器：点按钮出对应推荐卡 --- */
  var resultBox = document.querySelector('[data-result]');
  document.querySelectorAll('.chip[data-pick]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-pick');
      document.querySelectorAll('.chip[data-pick].is-on').forEach(function (b) { b.classList.remove('is-on'); });
      btn.classList.add('is-on');
      if (!resultBox) return;
      var hit = null;
      resultBox.querySelectorAll('.result-card').forEach(function (c) {
        var match = c.getAttribute('data-pick') === key;
        c.hidden = !match;
        if (match) hit = c;
      });
      resultBox.hidden = false;
      if (hit) { /* 重触发入场动画 */
        hit.style.animation = 'none';
        void hit.offsetHeight;
        hit.style.animation = '';
      }
    });
  });

  /* --- 5. 复制按钮：成功后变「已复制」，1.5s 复原 --- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.prompt-card');
      var src = btn.getAttribute('data-copy');
      var el = (src && document.querySelector(src)) || (card && card.querySelector('.prompt-text'));
      var text = el ? el.innerText : '';
      if (!text) return;
      var settled = false;
      var done = function () {
        if (settled) return;
        settled = true;
        btn.textContent = '已复制 ✓';
        btn.classList.add('done');
        setTimeout(function () {
          btn.textContent = '复制';
          btn.classList.remove('done');
        }, 1500);
      };
      var fallback = function () {
        if (settled) return;
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { /* 忽略 */ }
        document.body.removeChild(ta);
        setTimeout(done, 60); /* 兜底：即使 execCommand 不可用也给出反馈 */
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
        setTimeout(fallback, 800); /* 某些环境 Promise 永不返回 */
      } else {
        fallback();
      }
    });
  });

  /* --- 6. 勾选清单：点击打勾 + 进度提示 --- */
  var items = document.querySelectorAll('.check-item');
  var prog = document.querySelector('[data-check-progress]');
  function updateProgress() {
    if (!prog) return;
    var n = document.querySelectorAll('.check-item.done').length;
    prog.textContent = '已完成 ' + n + ' / ' + items.length + (n === items.length ? ' · 全部完成，去刷新你的网页吧' : '');
  }
  items.forEach(function (it) {
    it.addEventListener('click', function () {
      it.classList.toggle('done');
      it.setAttribute('aria-checked', it.classList.contains('done') ? 'true' : 'false');
      updateProgress();
    });
  });
  updateProgress();
})();
