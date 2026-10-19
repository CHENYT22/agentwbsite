(() => {
  'use strict';

  const storeKey = 'agent-guide.glossary.v1';
  const coreTerms = [
    { id: 'agent', name: 'Agent', definition: '能按你的要求生成、修改网站的 AI 工具。' },
    { id: 'skill', name: 'Skill', definition: '预设好的工作流程，可让 Agent 按步骤处理任务。' },
    { id: 'plugin', name: '插件', definition: '为 Agent 增加功能或连接其他工具。' },
    { id: 'vibe-coding', name: 'Vibe Coding', definition: '用自然语言描述想法，让 AI 生成和修改代码的方式。' },
    { id: 'prompt', name: '提示词', definition: '你发给 AI 的任务说明。' },
    { id: 'github', name: 'GitHub', definition: '存放和管理网站文件的平台。' },
    { id: 'repository', name: '仓库', definition: 'GitHub 中存放项目文件和修改记录的空间。' },
    { id: 'github-pages', name: 'GitHub Pages', definition: '把 GitHub 仓库里的网页文件发布成网站的服务。' },
    { id: 'index-html', name: 'index.html', definition: '网站首页常用的文件名。' },
    { id: 'responsive', name: '响应式', definition: '让网页在手机和电脑上都能合适地显示。' }
  ];
  const emptyStore = () => ({ custom: [], favorites: [] });
  let glossaryState = readGlossary();

  function readGlossary() {
    try {
      const value = JSON.parse(localStorage.getItem(storeKey) || 'null');
      if (!value || !Array.isArray(value.custom) || !Array.isArray(value.favorites)) return emptyStore();
      const names = new Set();
      const usedIds = new Set(coreTerms.map(term => term.id));
      const custom = [];
      for (const term of value.custom) {
        if (!term || typeof term.name !== 'string' || typeof term.definition !== 'string') continue;
        const name = term.name.trim().slice(0, 40);
        const definition = term.definition.trim().slice(0, 220);
        const normalized = name.toLocaleLowerCase();
        if (!name || !definition || names.has(normalized)) continue;
        names.add(normalized);
        let id = typeof term.id === 'string' && term.id.startsWith('custom-') ? term.id : '';
        if (!id || usedIds.has(id)) {
          let suffix = custom.length;
          do { id = `custom-import-${suffix++}`; } while (usedIds.has(id));
        }
        usedIds.add(id);
        custom.push({ id, name, definition });
      }
      return { custom, favorites: value.favorites.filter(id => typeof id === 'string' && usedIds.has(id)) };
    } catch (_) { return emptyStore(); }
  }

  function saveGlossary() {
    try { localStorage.setItem(storeKey, JSON.stringify(glossaryState)); } catch (_) { /* Storage can be disabled. */ }
  }

  const glossary = document.createElement('dialog');
  glossary.id = 'glossary-dialog';
  glossary.className = 'resource-dialog';
  glossary.setAttribute('aria-labelledby', 'glossary-title');
  glossary.innerHTML = `
    <div class="dialog-head"><div><p class="eyebrow">QUICK REFERENCE</p><h2 id="glossary-title">词典</h2></div><button class="dialog-close" type="button" data-close="glossary" aria-label="关闭词典">×</button></div>
    <p class="dialog-intro">10 个常用词，输入名称查找。</p>
    <label class="field-label" for="term-search">查找术语</label><input id="term-search" class="dialog-input" type="search" placeholder="输入名称" autocomplete="off">
    <div id="glossary-list" class="glossary-list"></div>
    <form id="term-form" class="term-form"><h3>添加术语</h3><label class="field-label" for="term-name">名称</label><input id="term-name" class="dialog-input" type="text" maxlength="40" required><label class="field-label" for="term-definition">一句话解释</label><input id="term-definition" class="dialog-input" type="text" maxlength="220" required><button class="button button-primary" id="term-add" type="submit">添加术语</button><p class="form-status" id="term-status" role="status"></p></form>`;
  document.body.append(glossary);

  const tips = document.createElement('dialog');
  tips.id = 'tips-dialog';
  tips.className = 'resource-dialog';
  tips.setAttribute('aria-labelledby', 'tips-title');
  tips.innerHTML = `
    <div class="dialog-head"><div><p class="eyebrow">FIELD NOTES</p><h2 id="tips-title">实用提示</h2></div><button class="dialog-close" type="button" data-close="tips" aria-label="关闭提示">×</button></div>
    <div class="tips-list">
      <details><summary>如何安装 Skill</summary><p>把 Skill 的链接发给 Agent，请它安装并验证。安装后，在新对话输入 Skill 名称调用。</p></details>
      <details><summary>如何安装插件</summary><p>打开所用工具的插件目录，查看所需权限后安装。完成后用一个小任务试运行。</p></details>
      <details><summary>如何制作自己的 Skill</summary><p>写下重复任务的输入、步骤和结果，请 Agent 整理为 Skill，并做一次试运行。</p></details>
    </div>`;
  document.body.append(tips);

  const list = glossary.querySelector('#glossary-list');
  const search = glossary.querySelector('#term-search');
  const status = glossary.querySelector('#term-status');

  function renderTerms() {
    list.replaceChildren();
    const query = search.value.trim().toLocaleLowerCase();
    const customByName = new Map(glossaryState.custom.map(term => [term.name.toLocaleLowerCase(), term]));
    const coreNames = new Set(coreTerms.map(term => term.name.toLocaleLowerCase()));
    const terms = [
      ...coreTerms.map(term => customByName.get(term.name.toLocaleLowerCase()) || term),
      ...glossaryState.custom.filter(term => !coreNames.has(term.name.toLocaleLowerCase()))
    ].filter(term => term.name.toLocaleLowerCase().includes(query));
    if (!terms.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-terms';
      empty.textContent = '没有找到这个词。';
      list.append(empty);
      return;
    }
    for (const term of terms) {
      const article = document.createElement('article');
      article.className = 'term-row';
      const top = document.createElement('div');
      top.className = 'term-row-top';
      const name = document.createElement('b');
      name.textContent = term.name;
      const actions = document.createElement('div');
      actions.className = 'term-actions';
      const favorite = document.createElement('button');
      favorite.type = 'button';
      favorite.textContent = glossaryState.favorites.includes(term.id) ? '已收藏' : '收藏';
      favorite.setAttribute('aria-label', `${favorite.textContent} ${term.name}`);
      favorite.setAttribute('aria-pressed', String(glossaryState.favorites.includes(term.id)));
      favorite.addEventListener('click', () => {
        glossaryState.favorites = glossaryState.favorites.includes(term.id)
          ? glossaryState.favorites.filter(id => id !== term.id)
          : [...glossaryState.favorites, term.id];
        const selected = glossaryState.favorites.includes(term.id);
        favorite.textContent = selected ? '已收藏' : '收藏';
        favorite.setAttribute('aria-label', `${favorite.textContent} ${term.name}`);
        favorite.setAttribute('aria-pressed', String(selected));
        saveGlossary();
      });
      actions.append(favorite);
      if (!coreTerms.some(item => item.id === term.id)) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = '删除';
        remove.setAttribute('aria-label', `删除 ${term.name}`);
        remove.addEventListener('click', () => {
          const nextFocus = article.nextElementSibling?.querySelector('button')
            || article.previousElementSibling?.querySelector('button') || search;
          const builtIn = coreTerms.find(item => item.name.toLocaleLowerCase() === term.name.toLocaleLowerCase());
          glossaryState.custom = glossaryState.custom.filter(item => item.id !== term.id);
          glossaryState.favorites = glossaryState.favorites.filter(id => id !== term.id);
          saveGlossary();
          if (builtIn) {
            const scrollTop = list.scrollTop;
            renderTerms();
            list.scrollTop = scrollTop;
            const restored = [...list.querySelectorAll('.term-row')].find(row => row.querySelector('b')?.textContent === builtIn.name);
            (restored?.querySelector('button') || search).focus();
          } else {
            article.remove();
            if (!list.children.length) renderTerms();
            nextFocus.focus();
          }
        });
        actions.append(remove);
      }
      top.append(name, actions);
      const definition = document.createElement('p');
      definition.textContent = term.definition;
      article.append(top, definition);
      list.append(article);
    }
  }

  search.addEventListener('input', renderTerms);
  glossary.querySelector('#term-form').addEventListener('submit', event => {
    event.preventDefault();
    const nameInput = glossary.querySelector('#term-name');
    const definitionInput = glossary.querySelector('#term-definition');
    const name = nameInput.value.trim();
    const definition = definitionInput.value.trim();
    if (!name || !definition) { status.textContent = '请填写名称和解释。'; return; }
    if ([...coreTerms, ...glossaryState.custom].some(term => term.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      status.textContent = '这个词已经在词典里。'; return;
    }
    glossaryState.custom.push({ id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, definition });
    search.value = '';
    saveGlossary(); renderTerms();
    nameInput.value = ''; definitionInput.value = '';
    status.textContent = '已添加。';
    nameInput.focus();
  });

  document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
    const dialog = button.dataset.open === 'glossary' ? glossary : tips;
    if (dialog === glossary) { search.value = ''; renderTerms(); }
    if (!dialog.open) dialog.showModal();
  }));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => {
    button.closest('dialog').close();
  }));
  [glossary, tips].forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  }));

  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    const text = button.closest('[data-copy-scope], .template-card').querySelector('[data-copy-text]').textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = '已复制';
    } catch (_) {
      button.textContent = '请手动复制';
    }
    setTimeout(() => { button.textContent = '复制'; }, 2400);
  }));

  const publishChecks = [...document.querySelectorAll('.publish-check')];
  const publishProgress = document.querySelector('[data-check-progress]');
  if (publishChecks.length && publishProgress) {
    const updateProgress = () => {
      const done = publishChecks.filter(input => input.checked).length;
      publishProgress.textContent = `进度 ${done} / ${publishChecks.length}`;
      publishChecks.forEach(input => input.closest('.publish-item').classList.toggle('is-complete', input.checked));
    };
    publishChecks.forEach(input => input.addEventListener('change', updateProgress));
    updateProgress();
  }
})();
