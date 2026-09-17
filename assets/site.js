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

  /* --- 6. 勾选清单：点击 / 键盘（Enter、Space）打勾 + 进度提示 --- */
  var items = document.querySelectorAll('.check-item');
  var prog = document.querySelector('[data-check-progress]');
  function updateProgress() {
    if (!prog) return;
    var n = document.querySelectorAll('.check-item.done').length;
    prog.textContent = '已完成 ' + n + ' / ' + items.length + (n === items.length ? ' · 全部完成，去刷新你的网页吧' : '');
  }
  function toggle(it) {
    it.classList.toggle('done');
    it.setAttribute('aria-checked', it.classList.contains('done') ? 'true' : 'false');
    updateProgress();
  }
  items.forEach(function (it) {
    it.addEventListener('click', function () { toggle(it); });
    it.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault(); /* 阻止空格滚动页面 */
        toggle(it);
      }
    });
  });
  updateProgress();

  /* --- 7. 术语气泡：绝对定位于词条内，坐标换算成视口钳制后的纯 px --- */
  var terms = document.querySelectorAll('.term');
  var tipStyle = document.createElement('style');
  document.head.appendChild(tipStyle);
  var probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;'
    + 'width:max-content;box-sizing:border-box;font-size:12px;line-height:1.6;padding:8px 12px;'
    + 'border-radius:8px;text-align:left;';
  probe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(probe);
  var active = null;
  function placeTip(t) {
    var vw = document.documentElement.clientWidth;
    var maxW = Math.min(260, Math.round(vw * 0.92));
    probe.style.maxWidth = maxW + 'px';
    probe.style.width = 'max-content';
    probe.textContent = t.getAttribute('data-tip') || '';
    var w = Math.min(probe.offsetWidth, maxW);
    probe.style.width = w + 'px';
    var h = probe.offsetHeight;
    var r = t.getBoundingClientRect();
    /* 目标视口横坐标 → 相对词条左缘的偏移 */
    var vx = Math.min(Math.max(r.left + r.width / 2 - w / 2, 8), vw - 8 - w);
    var x = Math.round(vx - r.left);
    var y = -h - 8;
    var below = r.top - h - 8 < 64; /* 56px 吸顶导航 + 8px 间距，顶上放不下就翻到下方 */
    if (below) y = Math.round(r.height) + 8;
    var caretX = Math.round(Math.min(Math.max(r.width / 2 - 5, 8), Math.max(w - 18, 8)));
    var css = '.term.tip-on::after{top:' + y + 'px;left:' + x + 'px}'
            + '.term.tip-on::before{top:' + (below ? y - 13 : y + h + 3) + 'px;left:' + (x + caretX) + 'px;}';
    if (below) css += '.term.tip-on::before{border-top-color:transparent;border-bottom-color:var(--ink)}';
    tipStyle.textContent = css;
  }
  function activate(t) {
    if (active && active !== t) active.classList.remove('tip-on');
    active = t;
    placeTip(t);
    t.classList.add('tip-on');
  }
  function deactivate(t) {
    if (active === t) { active = null; t.classList.remove('tip-on'); }
  }
  terms.forEach(function (t) {
    t.addEventListener('mouseenter', function () { activate(t); });
    t.addEventListener('focus', function () { activate(t); });
    t.addEventListener('mouseleave', function () { deactivate(t); });
    t.addEventListener('blur', function () { deactivate(t); });
  });
  window.addEventListener('resize', function () { if (active) placeTip(active); });
})();
