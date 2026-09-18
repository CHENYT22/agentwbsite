/* 教程站交互 v3：进度条 + 滚动进场 + 选型高亮 + Tips 悬浮按钮 + 复制 + 勾选清单 */
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

  /* --- 3. 选型选择器：按容器作用域，同页可有多组互不干扰 --- */
  var PICK_TOOL = { nocode: 'general', pro: 'code' };
  var PICK_NOTE = {
    nocode: '为你推荐：通用型 Agent · WorkBuddy / Trae —— 网页登录就能用，聊天、写代码、存文件一条龙，不用安装，新手从它开始最省心。',
    pro: '为你推荐：编程型 Agent · Codex / Trae / Cursor / Claude Code —— 已经跑通基础流程后，本地客户端效率最高：改动、调试都在自己电脑里完成，适合追求进阶的人。'
  };
  document.querySelectorAll('[data-picker]').forEach(function (root) {
    var scope = root.getAttribute('data-picker');
    var chips = root.querySelectorAll('.chip[data-pick]');
    var note = root.querySelector('[data-result]');
    var resetBtn = root.querySelector('.chip[data-pick="reset"]');
    var cards = scope === 'tools' ? root.querySelectorAll('.tool-grid .card') : [];
    function clearPick() {
      chips.forEach(function (b) {
        b.classList.remove('is-on');
        b.setAttribute('aria-pressed', 'false');
      });
      cards.forEach(function (c) { c.classList.remove('hl', 'dim'); });
      if (note) note.hidden = true;
      if (resetBtn) resetBtn.hidden = true;
    }
    chips.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-pick');
        if (key === 'reset') { clearPick(); return; }
        var tool = PICK_TOOL[key];
        chips.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        cards.forEach(function (c) {
          var hit = c.getAttribute('data-tool') === tool;
          c.classList.toggle('hl', hit);
          c.classList.toggle('dim', !hit);
        });
        if (note) { note.textContent = PICK_NOTE[key] || ''; note.hidden = false; }
        if (resetBtn) resetBtn.hidden = false;
      });
    });
  });

  /* --- 3b. 话术选择器：选中一句，下方出对应原话卡（每张自带复制） --- */
  document.querySelectorAll('[data-talk-picker]').forEach(function (root) {
    var chips = root.querySelectorAll('.chip[data-talk]');
    var box = root.querySelector('[data-talk-result]');
    var cards = box ? box.querySelectorAll('.result-card') : [];
    if (!box) return;
    chips.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-talk');
        var on = !btn.classList.contains('is-on');
        chips.forEach(function (b) {
          b.classList.remove('is-on');
          b.setAttribute('aria-pressed', 'false');
        });
        cards.forEach(function (c) {
          var hit = on && c.getAttribute('data-card') === key;
          c.hidden = !hit;
          if (hit) { c.style.animation = 'none'; void c.offsetWidth; c.style.animation = ''; }
        });
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        box.hidden = !on;
      });
    });
  });

  /* --- 3c. 生成选择器（STEP 1 级联）：A/B 两卡 → A 出结果或 B 再选 ①/② --- */
  document.querySelectorAll('[data-gen-picker]').forEach(function (root) {
    var topBtns = root.querySelectorAll(':scope > .gen-choices .gen-choice[data-gen]');
    var panelA = root.querySelector('[data-gen-panel="a"]');
    var panelB = root.querySelector('[data-gen-panel="b"]');
    var subBtns = root.querySelectorAll('[data-gen-sub]');
    var subPanels = root.querySelectorAll('[data-gen-sub-panel]');
    var back = root.querySelector('[data-gen-back]');
    function resetSub() {
      subBtns.forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
      subPanels.forEach(function (p) { p.hidden = true; });
    }
    function resetAll() {
      topBtns.forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
      panelA.hidden = true; panelB.hidden = true;
      resetSub();
      if (back) back.hidden = true;
    }
    topBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        resetAll();
        btn.classList.add('is-on');
        btn.setAttribute('aria-pressed', 'true');
        if (btn.getAttribute('data-gen') === 'a') { panelA.hidden = false; }
        else { panelB.hidden = false; }
        if (back) back.hidden = false;
      });
    });
    subBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        resetSub();
        btn.classList.add('is-on');
        btn.setAttribute('aria-pressed', 'true');
        var target = root.querySelector('[data-gen-sub-panel="' + btn.getAttribute('data-gen-sub') + '"]');
        if (target) target.hidden = false;
      });
    });
    if (back) back.addEventListener('click', resetAll);
  });

  /* --- 3d. 词典：圆形按钮展开词汇区（FLIP 动画停靠屏幕右侧）+ 词汇汇总/收藏/手动添加/提示词模板，localStorage 持久化 --- */
  var dictToggle = document.querySelector('[data-dict-toggle]');
  var dictPanel = document.querySelector('[data-dict-panel]');
  if (dictToggle && dictPanel) {
    var dictRM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var LS = {
      get: function (k, d) {
        try { var v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : d; }
        catch (e) { return d; }
      },
      set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 隐私模式等场景静默失败 */ } }
    };
    var FAV_KEY = 'awt-favs', WORD_KEY = 'awt-words', TPL_KEY = 'awt-tpls';
    var DICT_WORDS = [
      { w: 'Agent', d: '能听懂你说话、并代替你动手干活的 AI 员工' },
      { w: 'Skill', d: '给 Agent 装上的某项专业技能，比如「读 PDF」「写表格」', skill: true },
      { w: '插件', d: '让 Agent 直接连上外部 App 的钥匙，比如直接收发邮件' },
      { w: '提示词', d: '你发给 Agent 的那句话需求，说清目标、受众、风格' },
      { w: 'HTML', d: '网页的骨架，用标签告诉浏览器哪里是标题、哪里是图' },
      { w: 'CSS', d: '网页的衣服，管颜色、字号和排版' },
      { w: '客户端', d: '要先下载安装到电脑上的软件，比如 Cursor、Trae' },
      { w: '部署', d: '把做好的网站放到网上，让别人用网址访问' },
      { w: 'GitHub', d: '存代码和文件的网站，本教程用它免费上线网页' },
      { w: 'GitHub Pages', d: 'GitHub 提供的免费静态网站托管服务' }
    ];
    var favs = LS.get(FAV_KEY, []);
    var customWords = LS.get(WORD_KEY, []);
    var customTpls = LS.get(TPL_KEY, []);
    var dictList = dictPanel.querySelector('[data-dict-list]');
    var favBox = dictPanel.querySelector('[data-dict-favs]');
    var tplBox = dictPanel.querySelector('[data-tpl-list]');
    function allWords() { return DICT_WORDS.concat(customWords); }
    function isFav(w) { return favs.indexOf(w) > -1; }
    function renderWords() {
      if (!dictList) return;
      dictList.innerHTML = '';
      allWords().forEach(function (item, i) {
        var row = document.createElement('div');
        row.className = 'dict-row';
        var name = document.createElement('b');
        name.className = 'dict-w';
        name.textContent = item.w;
        var def = document.createElement('span');
        def.className = 'dict-d';
        def.textContent = item.d;
        row.appendChild(name);
        row.appendChild(def);
        if (item.skill) {
          var lnk = document.createElement('a');
          lnk.className = 'dict-link';
          lnk.href = '#skill-how';
          lnk.textContent = '如何安装';
          row.appendChild(lnk);
        }
        var star = document.createElement('button');
        star.type = 'button';
        star.className = 'star' + (isFav(item.w) ? ' is-on' : '');
        star.setAttribute('aria-pressed', isFav(item.w) ? 'true' : 'false');
        star.setAttribute('aria-label', '收藏 ' + item.w);
        star.textContent = isFav(item.w) ? '★' : '☆';
        star.addEventListener('click', function () {
          if (isFav(item.w)) favs = favs.filter(function (f) { return f !== item.w; });
          else favs.push(item.w);
          LS.set(FAV_KEY, favs);
          renderWords(); renderFavs();
        });
        row.appendChild(star);
        if (i >= DICT_WORDS.length) {
          var del = document.createElement('button');
          del.type = 'button';
          del.className = 'dict-del';
          del.setAttribute('aria-label', '删除 ' + item.w);
          del.textContent = '删除';
          del.addEventListener('click', function () {
            customWords = customWords.filter(function (c) { return c.w !== item.w; });
            LS.set(WORD_KEY, customWords);
            favs = favs.filter(function (f) { return f !== item.w; });
            LS.set(FAV_KEY, favs);
            renderWords(); renderFavs();
          });
          row.appendChild(del);
        }
        dictList.appendChild(row);
      });
    }
    function renderFavs() {
      if (!favBox) return;
      favBox.innerHTML = '';
      if (!favs.length) {
        var empty = document.createElement('span');
        empty.className = 'dict-empty';
        empty.textContent = '还没有收藏。在词汇汇总里点 ☆，就会出现在这里（保存在你的浏览器里）。';
        favBox.appendChild(empty);
        return;
      }
      favs.forEach(function (w) {
        var item = allWords().filter(function (x) { return x.w === w; })[0];
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip chip--fav';
        chip.title = item ? item.d : '点击取消收藏';
        chip.textContent = '★ ' + w;
        chip.addEventListener('click', function () {
          favs = favs.filter(function (f) { return f !== w; });
          LS.set(FAV_KEY, favs);
          renderWords(); renderFavs();
        });
        favBox.appendChild(chip);
      });
    }
    function renderTpls() {
      if (!tplBox) return;
      tplBox.innerHTML = '';
      customTpls.forEach(function (t, i) {
        var card = document.createElement('div');
        card.className = 'prompt-card prompt-card--sm';
        var copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'copy-btn';
        copy.setAttribute('data-copy', '');
        copy.textContent = '复制';
        var tag = document.createElement('div');
        tag.className = 'prompt-tag';
        tag.textContent = 'PROMPT · ' + t.n;
        var text = document.createElement('div');
        text.className = 'prompt-text';
        text.textContent = t.t;
        card.appendChild(copy); card.appendChild(tag); card.appendChild(text);
        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'dict-del';
        del.setAttribute('aria-label', '删除模板 ' + t.n);
        del.textContent = '删除';
        del.addEventListener('click', function () {
          customTpls.splice(i, 1);
          LS.set(TPL_KEY, customTpls);
          renderTpls();
        });
        card.appendChild(del);
        tplBox.appendChild(card);
      });
    }
    /* 添加词语 */
    var addWordBtn = dictPanel.querySelector('[data-dict-add]');
    if (addWordBtn) addWordBtn.addEventListener('click', function () {
      var wI = dictPanel.querySelector('[data-dict-word]');
      var dI = dictPanel.querySelector('[data-dict-def]');
      var w = (wI.value || '').trim(), d = (dI.value || '').trim();
      if (!w || !d) return;
      customWords.push({ w: w, d: d });
      LS.set(WORD_KEY, customWords);
      wI.value = ''; dI.value = '';
      renderWords();
    });
    /* 添加模板 */
    var addTplBtn = dictPanel.querySelector('[data-tpl-add]');
    if (addTplBtn) addTplBtn.addEventListener('click', function () {
      var nI = dictPanel.querySelector('[data-tpl-name]');
      var tI = dictPanel.querySelector('[data-tpl-text]');
      var n = (nI.value || '').trim(), t = (tI.value || '').trim();
      if (!n || !t) return;
      customTpls.push({ n: n, t: t });
      LS.set(TPL_KEY, customTpls);
      nI.value = ''; tI.value = '';
      renderTpls();
    });
    renderWords(); renderFavs(); renderTpls();
    /* 开合：展开时按钮 FLIP 动画移到屏幕右侧，收起时回到原位 */
    function flip(move) {
      var r1 = dictToggle.getBoundingClientRect();
      move();
      if (dictRM) return;
      var r2 = dictToggle.getBoundingClientRect();
      dictToggle.style.transition = 'none';
      dictToggle.style.transform = 'translate(' + (r1.left - r2.left) + 'px,' + (r1.top - r2.top) + 'px)';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          dictToggle.style.transition = '';
          dictToggle.style.transform = '';
        });
      });
    }
    dictToggle.addEventListener('click', function () {
      var open = dictPanel.hidden;
      dictPanel.hidden = !open;
      dictToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) dictPanel.scrollIntoView({ behavior: dictRM ? 'auto' : 'smooth', block: 'start' });
      flip(function () { dictToggle.classList.toggle('is-dock', open); });
    });
  }

  /* --- 4. Tips 悬浮按钮：点击展开 / 收起小贴士卡 --- */
  var fab = document.querySelector('[data-tips-toggle]');
  if (fab) {
    var fabCard = document.querySelector('[data-tips-pop]');
    var setFab = function (open) {
      fabCard.hidden = !open;
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      fab.classList.toggle('is-on', open);
    };
    fab.addEventListener('click', function (e) {
      e.stopPropagation();
      setFab(fabCard.hidden);
    });
    document.addEventListener('click', function (e) {
      if (!fabCard.hidden && !fabCard.contains(e.target) && e.target !== fab) setFab(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !fabCard.hidden) { setFab(false); fab.focus(); }
    });
  }

  /* --- 5. 复制按钮（事件委托，动态渲染的卡片同样生效）：成功后变「已复制」，1.5s 复原 --- */
  document.addEventListener('click', function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest('[data-copy]') : null;
    if (!btn) return;
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

  /* --- 6. 勾选清单：每个 .checklist 各自算进度，键盘（Enter、Space）同样可用 --- */
  document.querySelectorAll('.checklist').forEach(function (list) {
    var items = list.querySelectorAll('.check-item');
    var wrap = list.closest('.check-wrap') || list.parentElement;
    var prog = wrap ? wrap.querySelector('[data-check-progress]') : null;
    function updateProgress() {
      if (!prog) return;
      var n = list.querySelectorAll('.check-item.done').length;
      prog.textContent = '进度 ' + n + ' / ' + items.length + (n === items.length ? ' · 全部完成，去下面看看四个坑' : '');
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
  });

  /* --- 6b. 三步节点树：点击开合，同一时间只展开一个（高度过渡复用折叠动效） --- */
  var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-node]'));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setNode(node, open) {
    var body = node.querySelector('.node-body');
    var head = node.querySelector('[data-node-toggle]');
    if (!body) return;
    head && head.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      node.classList.add('is-open');
      body.style.height = body.scrollHeight + 'px';
      var settle = function (e) {
        if (e && e.propertyName !== 'height') return;
        if (node.classList.contains('is-open')) body.style.height = 'auto';
        body.removeEventListener('transitionend', settle);
      };
      body.addEventListener('transitionend', settle);
      setTimeout(settle, reduceMotion ? 0 : 400); /* 兜底：过渡事件偶发丢失时也能落到 auto */
    } else {
      body.style.height = body.scrollHeight + 'px';
      node.classList.remove('is-open');
      requestAnimationFrame(function () { body.style.height = '0px'; });
    }
  }
  nodes.forEach(function (node) {
    var head = node.querySelector('[data-node-toggle]');
    var body = node.querySelector('.node-body');
    if (!body) return;
    var open = node.classList.contains('is-open');
    body.style.height = open ? 'auto' : '0px';
    if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!head) return;
    head.addEventListener('click', function () {
      var willOpen = !node.classList.contains('is-open');
      if (willOpen) {
        nodes.forEach(function (o) { if (o !== node && o.classList.contains('is-open')) setNode(o, false); });
      }
      setNode(node, willOpen);
    });
  });

  /* --- 6c. 页内模板入口：平滑滚到目标卡，边框高亮 1.5s（只变 border-color） --- */
  document.querySelectorAll('[data-scroll-to]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var sel = link.getAttribute('data-scroll-to');
      var target = sel ? document.querySelector(sel) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      target.classList.add('is-flash');
      setTimeout(function () { target.classList.remove('is-flash'); }, 1500);
    });
  });


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
    var caretX = Math.round(Math.min(Math.max(w / 2 - 5, 8), Math.max(w - 18, 8)));
    var css = '.term.tip-on::after{top:' + y + 'px;left:' + x + 'px}'
            + '.term.tip-on::before{top:' + (below ? y - 13 : y + h + 3) + 'px;left:' + (x + caretX) + 'px;margin-left:0;}';
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
